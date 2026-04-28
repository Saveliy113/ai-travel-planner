import { Request, Response, Router } from 'express';

import Route from '../interfaces/routes.interface';

class AliveRoutes implements Route {
  public path = '/alive';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, (_req: Request, res: Response) => {
      res.status(200).json({ status: 'live' });
    });
  }
}

export default AliveRoutes;
