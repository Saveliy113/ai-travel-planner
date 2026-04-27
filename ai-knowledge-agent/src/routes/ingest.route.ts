import { Router } from 'express';

import Route from '../interfaces/routes.interface';
import { IngestController } from '../controllers/index';
import { auth, validateDto } from '../middlewares/index';
import { IngestStartBodyDto } from '../dtos/index';

class IngestRoutes implements Route {
  public path = '/ingest';
  public router = Router();
  private ingestController = new IngestController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      `${this.path}/start`,
      auth,
      validateDto(IngestStartBodyDto, 'body'),
      this.ingestController.start,
    );
  }
}

export default IngestRoutes;
