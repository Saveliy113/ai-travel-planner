import { NextFunction, Request, Response } from 'express';

import { logger } from '../utils/logger';
import LocationService from '../services/location.service';

class LocationController {
  private locationService = new LocationService();

  public getLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.locationService.getLocation(req.query as Record<string, unknown>);
      res.status(200).json(data);
    } catch (error) {
      logger.error(
        `[ERROR] [LocationController] [getLocation]: ${error instanceof Error ? error.message : error}`,
      );
      next(error);
    }
  };
}

export default LocationController;
