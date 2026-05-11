import type { TravelSetupGenerateBody, TravelSetupGenerateResult } from '../interfaces/travelSetup.interface';
import { logger } from '../utils/logger';

class TravelSetupService {
  public async generate(body: TravelSetupGenerateBody): Promise<TravelSetupGenerateResult> {
    try {
      logger.debug(`[TravelSetupService] generate (stub) destination="${body.destination}"`);
      // Placeholder — add plan generation / orchestration here.
      return { ok: true, message: 'Not implemented' };
    } catch (error) {
      logger.error(
        `[TravelSetupService] generate: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}

export default TravelSetupService;
