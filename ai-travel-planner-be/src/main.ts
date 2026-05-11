import 'reflect-metadata';
import 'dotenv/config';

import App from './loaders/app';
import { AliveRoutes, TravelSetupRoutes, ValidationRoutes } from './routes/index';

const app = new App([new AliveRoutes(), new ValidationRoutes(), new TravelSetupRoutes()]);

app.listen();
