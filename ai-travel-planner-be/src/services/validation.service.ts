import type { DestinationValidationResult } from '../interfaces/validation.interface';
import { openai } from '../loaders/openai';
import { VALIDATE_DESTINATION_PROMPT } from '../prompts/prompt';
import { logger } from '../utils/logger';

class ValidationService {
  private llmModel = process.env.OPENAI_MODEL || 'gpt-5-mini-2025-08-07';

  public async validateDestination(destination: string): Promise<DestinationValidationResult> {
    try {
      const trimmed = destination.trim();
      if (trimmed.length === 0) {
        throw new Error('destination must contain non-whitespace characters');
      }

      const completion = await openai.chat.completions.create({
        model: this.llmModel,
        messages: [
          {
            role: 'system',
            content: VALIDATE_DESTINATION_PROMPT,
          },
          {
            role: 'user',
            content: JSON.stringify({ destination: trimmed }),
          },
        ],
      });

      const text = completion.choices[0]?.message?.content;
      if (text == null || text.length === 0) {
        throw new Error('Empty LLM response');
      }

      const llmResponse = JSON.parse(text) as DestinationValidationResult;

      return {
        isValidLocation: Boolean(llmResponse.isValidLocation),
        normalizedLocation: String(llmResponse.normalizedLocation ?? ''),
        locationType: String(llmResponse.locationType ?? 'unknown'),
        containsMultipleLocations: Boolean(llmResponse.containsMultipleLocations),
        ambiguityDetected: Boolean(llmResponse.ambiguityDetected),
        clarificationRequired: Boolean(llmResponse.clarificationRequired),
        clarificationReason: String(llmResponse.clarificationReason ?? ''),
        clarificationOptions: llmResponse.clarificationOptions ?? [],
        confidence: typeof llmResponse.confidence === 'number' ? llmResponse.confidence : 0,
      };
    } catch (error) {
      logger.error(
        `[ValidationService] validateDestination: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}

export default ValidationService;
