/**
 * Generates travel heuristic patterns (If–Then rules) via OpenAI structured outputs.
 * Combinations come from a fixed LOCATION_MAPPING (allowed seasons × focuses per location).
 *
 * Run: cd ingest && npm run generate
 *
 * Env: OPENAI_API_KEY, OPENAI_MODEL (optional)
 * Flags: --limit, --dry-run, --output, --delay-ms, --model
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
  season_type: string;
  location_type: string;
  focus_area: string;
}

export interface TravelPatternDocument extends TravelPattern {
  source: GeneratedBatchMeta;
}

const LOCATION_MAPPING: Record<string, { allowed_seasons: string[]; allowed_focuses: string[] }> = {
  Megacity: {
    allowed_seasons: [
      'Peak tourist season',
      'Off-season / Shoulder season',
      'Short weekend getaway',
      'Extreme heat / Summer peak',
    ],
    allowed_focuses: ['Luxury', 'Budget', 'Food & gastronomy', 'Nightlife', 'Religion & pilgrimage'],
  },
  'Beach resort': {
    allowed_seasons: [
      'Peak tourist season',
      'Off-season / Shoulder season',
      'Extreme heat / Summer peak',
      'Monsoon / Rainy season',
    ],
    allowed_focuses: ['Luxury', 'Budget', 'Food & gastronomy', 'Nightlife', 'Extreme / adventure'],
  },
  'Mountains / hiking': {
    allowed_seasons: [
      'Peak tourist season',
      'Off-season / Shoulder season',
      'Winter / Freeze conditions',
      'Monsoon / Rainy season',
    ],
    allowed_focuses: ['Extreme / adventure', 'Budget', 'Road-tripping / Driving'],
  },
  'Historical ruins': {
    allowed_seasons: [
      'Peak tourist season',
      'Off-season / Shoulder season',
      'Extreme heat / Summer peak',
      'Short weekend getaway',
    ],
    allowed_focuses: ['Budget', 'Luxury', 'Religion & pilgrimage', 'Food & gastronomy'],
  },
  Jungle: {
    allowed_seasons: ['Peak tourist season', 'Off-season / Shoulder season', 'Monsoon / Rainy season'],
    allowed_focuses: ['Extreme / adventure', 'Budget', 'Luxury'],
  },
  'Rural countryside / Small villages': {
    allowed_seasons: [
      'Peak tourist season',
      'Off-season / Shoulder season',
      'Short weekend getaway',
      'Winter / Freeze conditions',
    ],
    allowed_focuses: ['Budget', 'Food & gastronomy', 'Religion & pilgrimage', 'Road-tripping / Driving'],
  },
  'Desert / Arid zones': {
    allowed_seasons: ['Peak tourist season', 'Winter / Freeze conditions', 'Extreme heat / Summer peak'],
    allowed_focuses: ['Extreme / adventure', 'Luxury', 'Road-tripping / Driving'],
  },
};

function generateValidCombinations(): GeneratedBatchMeta[] {
  const out: GeneratedBatchMeta[] = [];

  for (const [location, mapping] of Object.entries(LOCATION_MAPPING)) {
    for (const season of mapping.allowed_seasons) {
      for (const focus of mapping.allowed_focuses) {
        out.push({
          season_type: season,
          location_type: location,
          focus_area: focus,
        });
      }
    }
  }
  return out;
}

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

function buildSystemPrompt(seasonType: string, locationType: string, focusArea: string): string {
  return `You are an expert Travel Knowledge Engineer. Your task is to generate heuristic travel patterns (If-Then rules) for an AI Trip Planner.

CURRENT CONTEXT:
- Season/Timing Context: ${seasonType}
- Location Type: ${locationType}
- Focus Area: ${focusArea}

REQUIREMENTS:
1. Generate 5 unique, highly specific travel patterns based on the context above.
2. Patterns must focus on realistic constraints: physical fatigue, logistics, weather, or safety.
3. Extract 2-3 extremely short, punchy keywords (tags) for each pattern.
4. For "embedding_text", combine the environment context, condition, and action so it remains completely unique. Format: "Context: ${locationType} (${seasonType}) - ${focusArea}. If [Condition], then [Action]."

Output strictly in JSON format matching the schema.`;
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
  const systemPrompt = buildSystemPrompt(combo.season_type, combo.location_type, combo.focus_area);

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Return exactly one JSON object. No prose.' },
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
      const backoff = Math.min(10_000, 500 * 2 ** attempt);
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

  const combos = generateValidCombinations();
  const slice = typeof limit === 'number' ? combos.slice(0, limit) : combos;

  console.log(`Total highly valid combinations to process: ${slice.length}`);

  if (dryRun) {
    console.log(JSON.stringify(slice.slice(0, Math.min(10, slice.length)), null, 2));
    if (slice.length > 10) console.log(`… and ${slice.length - 10} more valid combos.`);
    console.log('(dry-run: no API calls)');
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set.');
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });
  const documents: TravelPatternDocument[] = [];

  let index = 0;
  for (const combo of slice) {
    index += 1;
    const label = `[${index}/${slice.length}] ${combo.location_type} × ${combo.season_type} × ${combo.focus_area}`;
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
      valid_combinations_processed: slice.length,
    },
    total_patterns: deduped.length,
    patterns: deduped,
  };

  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\nSuccessfully wrote ${deduped.length} clean, deduplicated patterns to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
