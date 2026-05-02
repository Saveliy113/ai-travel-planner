import { Router } from 'express';

import Route from '../interfaces/routes.interface';
import { LocationController } from '../controllers/index';
import { LocationMiddleware, validateDto } from '../middlewares/index';
import { LocationBodyDto } from '../dtos/index';

class LocationRoutes implements Route {
  public path = '/location';
  public router = Router();
  private locationController = new LocationController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      this.path,
      validateDto(LocationBodyDto, 'body'),
      LocationMiddleware,
      this.locationController.getLocation,
    );
  }
}

export default LocationRoutes;
