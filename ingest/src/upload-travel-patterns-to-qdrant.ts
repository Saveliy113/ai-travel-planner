/**
 * Upserts travel patterns from JSON into Qdrant with OpenAI text-embedding-3-large vectors.
 *
 * Uses Qdrant HTTP API via native fetch (no @qdrant/js-client-rest) because Node.js 23 can
 * throw `invalid onError method` when that client attaches an undici Agent to fetch.
 *
 * cd ingest && npm install && npm run upload:qdrant
 *
 * Env:
 *   OPENAI_API_KEY      (required)
 *   QDRANT_URL          optional, default http://127.0.0.1:6333
 *   QDRANT_API_KEY      optional (Qdrant Cloud)
 *   QDRANT_COLLECTION   optional, default travel_patterns
 *   OPENAI_EMBEDDING_MODEL optional, default text-embedding-3-large
 */

import * as fs from 'fs/promises';
import * as path from 'path';

import dotenv from 'dotenv';
import OpenAI from 'openai';

/** text-embedding-3-large default output size */
const EMBEDDING_DIM = 3072;

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '..', '.env') });

interface PatternSource {
  traveler_type: string;
  location_type: string;
  focus_area: string;
}

interface PatternRecord {
  id: string;
  category: string;
  tags: string[];
  condition: string;
  action: string;
  embedding_text: string;
  source?: PatternSource;
}

interface PatternsFile {
  patterns: PatternRecord[];
}

export type TravelPatternPayload = {
  category: string;
  tags: string[];
  condition: string;
  action: string;
  embedding_text: string;
  source?: PatternSource;
};

type QdrantWrapped<T> = { result?: T; status?: string };

interface QdrantRestContext {
  baseUrl: string;
  apiKey?: string;
}

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/$/, '');
}

async function qdrantJson(ctx: QdrantRestContext, pathname: string, init?: RequestInit): Promise<unknown> {
  const url = `${ctx.baseUrl}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (ctx.apiKey) headers.set('api-key', ctx.apiKey);
  headers.set('user-agent', 'travel-patterns-ingest/1.0');

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Qdrant ${res.status} ${pathname}: expected JSON, got: ${text.slice(0, 300)}`);
  }
  if (!res.ok) {
    throw new Error(`Qdrant ${res.status} ${pathname}: ${JSON.stringify(body)}`);
  }
  return body;
}

function parseArgs(argv: string[]): {
  inputPath: string;
  recreate: boolean;
  batchEmbeddings: number;
  batchUpsert: number;
} {
  let inputPath = path.join(process.cwd(), 'output', 'travel-patterns.json');
  let recreate = false;
  let batchEmbeddings = 64;
  let batchUpsert = 64;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--recreate') {
      recreate = true;
      continue;
    }
    if (arg === '--input' && argv[i + 1]) {
      inputPath = path.resolve(argv[++i]);
      continue;
    }
    if (arg === '--batch-embeddings' && argv[i + 1]) {
      batchEmbeddings = Math.max(1, parseInt(argv[++i], 10));
      continue;
    }
    if (arg === '--batch-upsert' && argv[i + 1]) {
      batchUpsert = Math.max(1, parseInt(argv[++i], 10));
      continue;
    }
  }

  return { inputPath, recreate, batchEmbeddings, batchUpsert };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function inferVectorParamsSize(vectors: unknown): number | undefined {
  if (!vectors || typeof vectors !== 'object') return undefined;
  if ('size' in vectors && typeof (vectors as { size: unknown }).size === 'number') {
    return (vectors as { size: number }).size;
  }
  for (const v of Object.values(vectors as Record<string, unknown>)) {
    if (v && typeof v === 'object' && 'size' in v && typeof (v as { size: unknown }).size === 'number') {
      return (v as { size: number }).size;
    }
  }
  return undefined;
}

async function collectionExists(ctx: QdrantRestContext, name: string): Promise<boolean> {
  const raw = await qdrantJson(ctx, '/collections', { method: 'GET' });
  const wrapped = raw as QdrantWrapped<{ collections: Array<{ name: string }> }>;
  return (wrapped.result?.collections ?? []).some((c) => c.name === name);
}

async function getCollectionVectorsSize(ctx: QdrantRestContext, name: string): Promise<number | undefined> {
  const encoded = encodeURIComponent(name);
  const raw = await qdrantJson(ctx, `/collections/${encoded}`, { method: 'GET' });
  const wrapped = raw as QdrantWrapped<{ config?: { params?: { vectors?: unknown } } }>;
  return inferVectorParamsSize(wrapped.result?.config?.params?.vectors);
}

async function deleteCollection(ctx: QdrantRestContext, name: string): Promise<void> {
  const encoded = encodeURIComponent(name);
  await qdrantJson(ctx, `/collections/${encoded}`, { method: 'DELETE' });
}

async function createCollection(ctx: QdrantRestContext, name: string): Promise<void> {
  const encoded = encodeURIComponent(name);
  const body = JSON.stringify({
    vectors: {
      size: EMBEDDING_DIM,
      distance: 'Cosine',
    },
  });
  await qdrantJson(ctx, `/collections/${encoded}`, { method: 'PUT', body });
}

async function upsertPoints(
  ctx: QdrantRestContext,
  name: string,
  points: Array<{ id: string; vector: number[]; payload: TravelPatternPayload }>,
): Promise<void> {
  const encoded = encodeURIComponent(name);
  const qs = new URLSearchParams({ wait: 'true' }).toString();
  const payload = JSON.stringify({ points });
  await qdrantJson(ctx, `/collections/${encoded}/points?${qs}`, {
    method: 'PUT',
    body: payload,
  });
}

async function ensureCollection(ctx: QdrantRestContext, name: string, recreate: boolean): Promise<void> {
  const exists = await collectionExists(ctx, name);

  if (exists && recreate) {
    await deleteCollection(ctx, name);
    console.log(`Deleted collection "${name}" (--recreate)`);
  } else if (exists) {
    const size = await getCollectionVectorsSize(ctx, name);
    if (size !== EMBEDDING_DIM) {
      throw new Error(
        `Collection "${name}" exists with vector size ${String(size)}, expected ${EMBEDDING_DIM}. ` +
          `Run with --recreate to replace it.`,
      );
    }
    console.log(`Collection "${name}" already exists; upserting into it.`);
    return;
  }

  await createCollection(ctx, name);
  console.log(`Created collection "${name}" (${EMBEDDING_DIM} dims, Cosine).`);
}

async function embedBatch(openai: OpenAI, model: string, texts: string[]): Promise<number[][]> {
  const res = await openai.embeddings.create({
    model,
    input: texts,
  });

  const byIndex = new Map(res.data.map((d) => [d.index, d.embedding]));
  return texts.map((_, i) => {
    const vec = byIndex.get(i);
    if (!vec) throw new Error(`Missing embedding for input index ${i}`);
    return vec;
  });
}

async function main(): Promise<void> {
  const { inputPath, recreate, batchEmbeddings, batchUpsert } = parseArgs(process.argv);

  const qdrantUrlRaw = process.env.QDRANT_URL ?? 'http://127.0.0.1:6333';
  const qdrantCtx: QdrantRestContext = {
    baseUrl: normalizeBaseUrl(qdrantUrlRaw),
    apiKey: process.env.QDRANT_API_KEY ?? undefined,
  };
  const collectionName = process.env.QDRANT_COLLECTION ?? 'travel_patterns';
  const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-large';

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set.');
    process.exit(1);
  }

  const raw = await fs.readFile(inputPath, 'utf8');
  const data = JSON.parse(raw) as PatternsFile;
  if (!Array.isArray(data.patterns)) {
    console.error(`Invalid JSON: expected { patterns: [...] } in ${inputPath}`);
    process.exit(1);
  }

  const patterns = data.patterns;
  console.log(`Loaded ${patterns.length} patterns from ${inputPath}`);

  const openai = new OpenAI({ apiKey });

  await ensureCollection(qdrantCtx, collectionName, recreate);

  let uploaded = 0;
  const patternChunks = chunk(patterns, batchEmbeddings);

  for (let ci = 0; ci < patternChunks.length; ci++) {
    const group = patternChunks[ci];
    const texts = group.map((p) => p.embedding_text);
    console.log(
      `Embedding batch ${ci + 1}/${patternChunks.length} (${group.length} texts, ${embeddingModel})…`,
    );

    const vectors = await embedBatch(openai, embeddingModel, texts);

    for (let j = 0; j < vectors.length; j++) {
      if (vectors[j].length !== EMBEDDING_DIM) {
        throw new Error(
          `Unexpected embedding length ${vectors[j].length}; expected ${EMBEDDING_DIM}. ` +
            `Check OPENAI_EMBEDDING_MODEL / dimensions.`,
        );
      }
    }

    const points = group.map((p, i) => {
      const payload: TravelPatternPayload = {
        category: p.category,
        tags: p.tags,
        condition: p.condition,
        action: p.action,
        embedding_text: p.embedding_text,
      };
      if (p.source) payload.source = p.source;

      return {
        id: p.id,
        vector: vectors[i],
        payload,
      };
    });

    for (const upsertChunk of chunk(points, batchUpsert)) {
      await upsertPoints(qdrantCtx, collectionName, upsertChunk);
      uploaded += upsertChunk.length;
    }
  }

  console.log(`Done. Upserted ${uploaded} points into "${collectionName}" at ${qdrantCtx.baseUrl}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
