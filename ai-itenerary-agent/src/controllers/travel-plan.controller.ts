import { NextFunction, Request, Response } from 'express';

import type { TravelPlanGenerateBody } from '../interfaces/travel-plan.interface';
import TravelPlanService from '../services/travel-plan.service';
import { logger } from '../utils/logger';

class TravelPlanController {
  private travelPlanService = new TravelPlanService();

  public generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.travelPlanService.generate(req.body);
      res.status(200).json(data);
    } catch (error) {
      logger.error(
        `[ERROR] [TravelPlanController] [generate]: ${error instanceof Error ? error.message : error}`,
      );
      next(error);
    }
  };
}

export default TravelPlanController;
