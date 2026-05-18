import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import App from './loaders/app';
import { logger } from './utils/logger';
import { TravelPlanRoutes } from './routes/index';
import { attachTravelPlanWebSocket } from './ws/travel-plan-ws.server';

const app = new App([new TravelPlanRoutes()]);

((): void => {
  try {
    app.listen();
    const httpServer = app.getHttpServer();
    const apiVersion = process.env.API_VERSION || 'v1';
    if (httpServer) {
      attachTravelPlanWebSocket(httpServer, `/api/${apiVersion}/ws`);
    }
  } catch (err) {
    logger.error(err);
  }
})();

async function shutdown(): Promise<void> {
  try {
    app.closeServer();
  } catch (err) {
    logger.error(`Error close server : ${err}`);
  }
}

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit();
});

process.on('SIGINT', async () => {
  await shutdown();
  process.exit();
});

process.on('uncaughtException', (err) => {
  logger.error(`uncaughtException: ${err}`);
});
