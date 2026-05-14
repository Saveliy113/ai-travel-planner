import OpenAI from 'openai';
import { logger } from '../utils/logger';

const openaiKey = process.env.OPENAI_API_KEY;

if (!openaiKey) {
    logger.error('[ERROR] [loaders] [openai] Fatal: OPENAI_API_KEY is not set');
    process.exit(1);
}

export const openai = new OpenAI({
  apiKey: openaiKey,
});