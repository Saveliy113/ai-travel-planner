import { Request, Response, NextFunction } from 'express';

import type { TravelSetupGenerateBody } from '../interfaces/travelSetup.interface';
import TravelSetupService from '../services/travelSetup.service';
import { logger } from '../utils/logger';

class TravelSetupController {
  private travelSetupService = new TravelSetupService();

  public generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.travelSetupService.generate(req.body as TravelSetupGenerateBody);
      res.status(200).json(data);
    } catch (error) {
      logger.error(
        `[ERROR] [TravelSetupController] [generate]: ${error instanceof Error ? error.message : error}`,
      );
      next(error);
    }
  };
}

export default TravelSetupController;
