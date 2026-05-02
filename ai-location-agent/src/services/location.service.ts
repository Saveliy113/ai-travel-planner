import { LocationBodyDto } from '../dtos/location.dto';
import { logger } from '../utils/logger';

import { openai } from '../loaders/openai';
import { QUERY_EXPANDER_PROMPT } from '../prompt/prompt';

class LocationService {
  private llmModel = process.env.OPENAI_MODEL || 'gpt-5-mini-2025-08-07';

  public async getLocation(body: LocationBodyDto): Promise<null> {
    try {
      const { lat, lon, categories } = body;

      // Building query for categories with OpenAI API
      const query = await openai.chat.completions.create({
        model: this.llmModel,
        messages: [
          {
            role: 'system',
            content: QUERY_EXPANDER_PROMPT,
          },
          {
            role: 'user',
            content: `Categories: ${categories.map((category) => `${category.name}`).join(', ')}`,
          },
        ],
      });

      console.log(query.choices[0].message.content);

    

      return null;
    } catch (error) {
      logger.error(
        `[LocationService] getLocation: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}

export default LocationService;
