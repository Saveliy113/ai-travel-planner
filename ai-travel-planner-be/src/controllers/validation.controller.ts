import { plainToInstance } from 'class-transformer';
import { Request, Response, NextFunction } from 'express';

import { TravelPlannerInputDto } from '../dtos/validation.dto';
import { logger } from '../utils/logger';

class ValidationController {
  public validateTravelInput = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = plainToInstance(TravelPlannerInputDto, req.body);
      res.status(200).json({ valid: true, data });
    } catch (error) {
      logger.error(
        `[ERROR] [ValidationController] [validateTravelInput]: ${error instanceof Error ? error.message : error}`,
      );
      next(error);
    }
  };
}

export default ValidationController;
