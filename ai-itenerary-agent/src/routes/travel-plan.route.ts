import { Router } from 'express';

import { TravelPlanController } from '../controllers/index';
import { TravelPlanGenerateDto } from '../dtos/index';
import Route from '../interfaces/routes.interface';
import { validateDto } from '../middlewares/index';

class TravelPlanRoutes implements Route {
  public path = '/travel-plan';
  public router = Router();
  private travelPlanController = new TravelPlanController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      `${this.path}/generate`,
      validateDto(TravelPlanGenerateDto, 'body'),
      this.travelPlanController.generate,
    );
  }
}

export default TravelPlanRoutes;
