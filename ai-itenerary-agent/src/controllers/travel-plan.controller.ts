import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

import type { TravelPlanGenerateBody } from '../interfaces/travel-plan.interface';
import TravelPlanService from '../services/travel-plan.service';
import { logger } from '../utils/logger';
import { broadcastTravelPlanEvent } from '../ws/travel-plan-ws.hub';

class TravelPlanController {
  private travelPlanService = new TravelPlanService();

  public generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobId = randomUUID();
      res.status(200).json({ ok: true, jobId });

      const body = req.body as TravelPlanGenerateBody;
      this.travelPlanService.generate(body, jobId).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[ERROR] [TravelPlanController] [generate] background job ${jobId}: ${message}`);
        broadcastTravelPlanEvent(jobId, { type: 'plan_error', jobId, error: message });
      });
    } catch (error) {
      logger.error(
        `[ERROR] [TravelPlanController] [generate]: ${error instanceof Error ? error.message : error}`,
      );
      next(error);
    }
  };
}

export default TravelPlanController;
