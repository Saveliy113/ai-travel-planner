/**
 * Generates travel heuristic patterns (If–Then rules) via OpenAI structured outputs.
 * Run from repo: cd ingest && npm install && npm run generate
 *
 * Env: OPENAI_API_KEY (required), OPENAI_MODEL (optional, default gpt-4o-mini)
 *
 * Flags:
 *   --limit N      Process only first N seed combinations (smoke tests)
 *   --dry-run      Print planned combinations without calling the API
 *   --output PATH  JSON output path (default ./output/travel-patterns.json)
 *   --delay-ms MS  Pause between API calls (default 400)
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '..', '.env') });

const TRAVEL_PATTERN_CATEGORIES = [
  'weather',
  'timing',
  'logistics',
  'health',
  'culture',
] as const;

export type TravelPatternCategory = (typeof TRAVEL_PATTERN_CATEGORIES)[number];

export interface TravelPattern {
  id: string;
  category: TravelPatternCategory;
  tags: string[];
  condition: string;
  action: string;
  embedding_text: string;
}

export interface GeneratedBatchMeta {
  traveler_type: string;
  location_type: string;
  focus_area: string;
}

/** Full row as stored in the JSON dump (Qdrant ingest can omit `source`). */
export interface TravelPatternDocument extends TravelPattern {
  source: GeneratedBatchMeta;
}

const TRAVELER_TYPES = [
  'Solo traveler',
  'Couple',
  'Family with toddlers',
  'Family with teenagers',
  'Senior travelers',
  'Group of friends',
] as const;

const LOCATION_TYPES = [
  'Megacity',
  'Beach resort',
  'Mountains / hiking',
  'Historical ruins',
  'Jungle',
] as const;

const FOCUS_AREAS = [
  'Extreme / adventure',
  'Luxury',
  'Budget',
  'Food & gastronomy',
  'Nightlife',
  'Religion & pilgrimage',
] as const;

/** Strict JSON Schema for OpenAI structured outputs (single batch per seed triple). */
const PATTERNS_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    patterns: {
      type: 'array',
      minItems: 5,
      maxItems: 5,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          category: {
            type: 'string',
            enum: [...TRAVEL_PATTERN_CATEGORIES],
          },
          tags: {
            type: 'array',
            minItems: 2,
            maxItems: 3,
            items: { type: 'string' },
          },
          condition: { type: 'string' },
          action: { type: 'string' },
          embedding_text: { type: 'string' },
        },
        required: ['category', 'tags', 'condition', 'action', 'embedding_text'],
      },
    },
  },
  required: ['patterns'],
} as const;

function buildSystemPrompt(travelerType: string, locationType: string, focusArea: string): string {
  return `You are an expert Travel Knowledge Engineer. Your task is to generate heuristic travel patterns (If-Then rules) for an AI Trip Planner.

CURRENT CONTEXT:
- Traveler Type: ${travelerType}
- Location Type: ${locationType}
- Focus Area: ${focusArea}

REQUIREMENTS:
1. Generate 5 unique, highly specific travel patterns based on the context above.
2. Patterns must focus on realistic constraints: physical fatigue, logistics, weather, or safety.
3. Extract 2-3 extremely short, punchy keywords (tags) for each pattern (e.g., "nightclub", "spf", "altitude", "museum"). Do not inflate keywords.
4. Output strictly in JSON format matching this schema:
{
  "patterns": [
    {
      "category": "string",
      "tags": ["string"],
      "condition": "string",
      "action": "string",
      "embedding_text": "string (combine condition and core entities for vectorization)"
    }
  ]
}`;
}

function cartesianProduct<A extends readonly string[], B extends readonly string[], C extends readonly string[]>(
  a: A,
  b: B,
  c: C,
): Array<{ traveler_type: A[number]; location_type: B[number]; focus_area: C[number] }> {
  const out: Array<{ traveler_type: A[number]; location_type: B[number]; focus_area: C[number] }> = [];
  for (const traveler_type of a) {
    for (const location_type of b) {
      for (const focus_area of c) {
        out.push({ traveler_type, location_type, focus_area });
      }
    }
  }
  return out;
}

function parseArgs(argv: string[]): {
  limit?: number;
  dryRun: boolean;
  outputPath: string;
  delayMs: number;
  model: string;
} {
  let limit: number | undefined;
  let dryRun = false;
  let outputPath = path.join(process.cwd(), 'output', 'travel-patterns.json');
  let delayMs = 400;
  let model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--limit' && argv[i + 1]) {
      limit = Math.max(1, parseInt(argv[++i], 10));
      continue;
    }
    if (arg === '--output' && argv[i + 1]) {
      outputPath = path.resolve(argv[++i]);
      continue;
    }
    if (arg === '--delay-ms' && argv[i + 1]) {
      delayMs = Math.max(0, parseInt(argv[++i], 10));
      continue;
    }
    if (arg === '--model' && argv[i + 1]) {
      model = argv[++i];
      continue;
    }
  }

  return { limit, dryRun, outputPath, delayMs, model };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callOpenAiBatch(
  client: OpenAI,
  model: string,
  combo: GeneratedBatchMeta,
): Promise<Omit<TravelPatternDocument, 'id'>[]> {
  const systemPrompt = buildSystemPrompt(combo.traveler_type, combo.location_type, combo.focus_area);

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Return exactly one JSON object that matches the schema. No prose.' },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'travel_patterns_response',
        strict: true,
        schema: PATTERNS_RESPONSE_SCHEMA as unknown as Record<string, unknown>,
      },
    },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error('Empty completion content');
  }

  const parsed = JSON.parse(raw) as { patterns: Omit<TravelPattern, 'id'>[] };

  return parsed.patterns.map((p) => ({
    ...p,
    source: combo,
  }));
}

async function withRetries<T>(fn: () => Promise<T>, label: string, maxAttempts = 5): Promise<T> {
  let attempt = 0;
  let lastErr: unknown;
  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      attempt += 1;
      const status = (e as { status?: number }).status;
      const retryAfter = (e as { headers?: { get?: (k: string) => string | null } }).headers?.get?.(
        'retry-after',
      );
      const backoff =
        status === 429
          ? Math.min(30_000, 1000 * 2 ** attempt + (retryAfter ? parseFloat(retryAfter) * 1000 : 0))
          : Math.min(10_000, 500 * 2 ** attempt);
      console.warn(`[retry ${attempt}/${maxAttempts}] ${label}: ${String(e)} — waiting ${backoff}ms`);
      await sleep(backoff);
    }
  }
  throw lastErr;
}

function dedupeByEmbeddingText(patterns: TravelPatternDocument[]): TravelPatternDocument[] {
  const seen = new Set<string>();
  const result: TravelPatternDocument[] = [];
  for (const p of patterns) {
    const key = p.embedding_text.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(p);
  }
  return result;
}

async function main(): Promise<void> {
  const { limit, dryRun, outputPath, delayMs, model } = parseArgs(process.argv);

  const combos = cartesianProduct(TRAVELER_TYPES, LOCATION_TYPES, FOCUS_AREAS);
  const slice = typeof limit === 'number' ? combos.slice(0, limit) : combos;

  console.log(`Combinations: ${slice.length} (of ${combos.length} total)`);

  if (dryRun) {
    console.log(JSON.stringify(slice.slice(0, Math.min(5, slice.length)), null, 2));
    if (slice.length > 5) console.log(`… ${slice.length - 5} more combinations`);
    console.log('(dry-run: no API calls)');
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set. Add it to ingest/.env or export in shell.');
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });
  const documents: TravelPatternDocument[] = [];

  let index = 0;
  for (const combo of slice) {
    index += 1;
    const label = `[${index}/${slice.length}] ${combo.traveler_type} × ${combo.location_type} × ${combo.focus_area}`;
    console.log(label);

    const batch = await withRetries(() => callOpenAiBatch(client, model, combo), label);

    for (const row of batch) {
      documents.push({
        id: crypto.randomUUID(),
        ...row,
      });
    }

    if (delayMs > 0 && index < slice.length) {
      await sleep(delayMs);
    }
  }

  const deduped = dedupeByEmbeddingText(documents);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const payload = {
    generated_at: new Date().toISOString(),
    model,
    seed_counts: {
      traveler_types: TRAVELER_TYPES.length,
      location_types: LOCATION_TYPES.length,
      focus_areas: FOCUS_AREAS.length,
      combinations_requested: slice.length,
    },
    total_patterns: deduped.length,
    patterns: deduped,
  };

  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Wrote ${deduped.length} patterns (${documents.length} before dedupe) → ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
