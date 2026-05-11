import { Router } from 'express';

import { TravelSetupController } from '../controllers/index';
import Route from '../interfaces/routes.interface';
import { validateDto } from '../middlewares/index';
import { TravelSetupGenerateDto } from '../dtos/index';

class TravelSetupRoutes implements Route {
  public path = '/travel-setup';
  public router = Router();
  private travelSetupController = new TravelSetupController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      `${this.path}/generate`,
      validateDto(TravelSetupGenerateDto, 'body'),
      this.travelSetupController.generate,
    );
  }
}

export default TravelSetupRoutes;
