import { NextFunction, Request, Response } from 'express';

import { logger } from '../utils/logger';
import LocationService from '../services/location.service';
import { LocationInterestsBodyDto } from '../dtos/location.dto';

class LocationController {
  private locationService = new LocationService();

  public getInterests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.locationService.getInterests(req.body as LocationInterestsBodyDto);
      res.status(200).json(data);
    } catch (error) {
      logger.error(
        `[ERROR] [LocationController] [getInterests]: ${error instanceof Error ? error.message : error}`,
      );
      next(error);
    }
  };
}

export default LocationController;
