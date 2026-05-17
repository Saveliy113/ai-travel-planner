import { QdrantClient } from '@qdrant/js-client-rest';

import { logger } from '../utils/logger';

const QDRANT_HOST = process.env.QDRANT_HOST;
if (!QDRANT_HOST) {
  console.error('[ERROR] [loaders] [qdrant] Fatal: QDRANT_HOST environment variable is required');
  process.exit(1);
}

export const qdrantClient = new QdrantClient({ url: QDRANT_HOST });

export async function connectQdrant(): Promise<void> {
  try {
    await qdrantClient.getCollections();
    logger.info('↗️  Qdrant connected');
  } catch (err) {
    logger.error('Qdrant connection failed', err);
    process.exit(1);
  }
}
