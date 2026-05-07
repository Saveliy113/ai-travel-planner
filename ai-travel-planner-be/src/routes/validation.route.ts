import { Router } from 'express';

import { ValidationController } from '../controllers/index';
import Route from '../interfaces/routes.interface';
import { validateDto } from '../middlewares/index';
import { TravelPlannerInputDto } from '../dtos/index';

class ValidationRoutes implements Route {
  public path = '/validation';
  public router = Router();
  private validationController = new ValidationController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      `${this.path}/destination`,
      validateDto(TravelPlannerInputDto, 'body'),
      this.validationController.validateDestination,
    );
  }
}

export default ValidationRoutes;
