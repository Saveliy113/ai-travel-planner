import { NextFunction, Request, Response } from 'express';

import { logger } from '../utils/logger';
import LocationService from '../services/location.service';
import { LocationBodyDto, LocationInterestsBodyDto } from '../dtos/location.dto';

class LocationController {
  private locationService = new LocationService();

  public getLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.locationService.getLocation(req.body as LocationBodyDto);
      res.status(200).json(data);
    } catch (error) {
      logger.error(
        `[ERROR] [LocationController] [getLocation]: ${error instanceof Error ? error.message : error}`,
      );
      next(error);
    }
  };

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
