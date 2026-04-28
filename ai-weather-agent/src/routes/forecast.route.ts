import { Router } from 'express';

import Route from '../interfaces/routes.interface';
import { ForecastController } from '../controllers/index';
import { validateDto } from '../middlewares/index';
import { ForecastQueryDto } from '../dtos/index';

class ForecastRoutes implements Route {
  public path = '/forecast';
  public router = Router();
  private forecastController = new ForecastController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      this.path,
      validateDto(ForecastQueryDto, 'query'),
      this.forecastController.getForecasts,
    );
  }
}

export default ForecastRoutes;
