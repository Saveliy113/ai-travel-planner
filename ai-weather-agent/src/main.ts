import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import App from './loaders/app';
import { logger } from './utils/logger';
import { AliveRoutes, ForecastRoutes, McpRoutes } from './routes/index';

const app = new App([new AliveRoutes(), new ForecastRoutes(), new McpRoutes()]);

((): void => {
  try {
    app.listen();
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
