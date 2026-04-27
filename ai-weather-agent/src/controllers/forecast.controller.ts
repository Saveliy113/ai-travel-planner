import { NextFunction, Request, Response } from 'express';

import { logger } from '../utils/logger';
import ForecastService from '../services/forecast.service';

class ForecastController {
  private forecastService = new ForecastService();

  public getForecast = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = this.forecastService.getForecast(req.query as Record<string, unknown>);
      res.status(200).json(data);
    } catch (error) {
      logger.error(
        `[ERROR] [ForecastController] [getForecast]: ${error instanceof Error ? error.message : error}`,
      );
      next(error);
    }
  };
}

export default ForecastController;
