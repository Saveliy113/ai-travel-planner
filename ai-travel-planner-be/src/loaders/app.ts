import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import morgan from 'morgan';
import { Server } from 'http';

import Routes from '../interfaces/routes.interface';
import errorMiddleware from '../middlewares/error.middleware';
import { logger, stream } from '../utils/logger';

class App {
  public app: Application;
  public port: string | number;
  public nodeEnv: string;
  public server: Server | null;
  private baseUrl: string;

  constructor(routes: Routes[]) {
    this.app = express();
    this.port = process.env.PORT || 7016;
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.server = null;
    this.baseUrl = `/api/${process.env.API_VERSION}`;

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
  }

  public listen(): void {
    this.server = this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.nodeEnv} ========`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  public getServer(): Application {
    return this.app;
  }

  public closeServer(): void {
    this.server?.close(() => {
      logger.info('HTTP server closed');
    });
  }

  private initializeMiddlewares(): void {
    if (this.nodeEnv === 'production') {
      this.app.use(morgan('combined', { stream }));
      this.app.use(cors({ origin: true, credentials: true }));
    } else {
      this.app.use(morgan('dev', { stream }));
      this.app.use(cors({ origin: true, credentials: true }));
    }

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  private initializeRoutes(routes: Routes[]): void {
    routes.forEach((route) => {
      this.app.use(this.baseUrl, route.router);
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorMiddleware);
  }
}

export default App;
