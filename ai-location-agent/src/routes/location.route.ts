import { Router } from 'express';

import Route from '../interfaces/routes.interface';
import { LocationController } from '../controllers/index';
import { validateDto } from '../middlewares/index';
import { LocationInterestsBodyDto } from '../dtos/index';

class LocationRoutes implements Route {
  public path = '/location';
  public router = Router();
  private locationController = new LocationController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      `${this.path}/interests`,
      validateDto(LocationInterestsBodyDto, 'body'),
      this.locationController.getInterests,
    );
  }
}

export default LocationRoutes;
