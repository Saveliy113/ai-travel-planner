import 'reflect-metadata';
import { config } from 'dotenv';

import App from './loaders/app';
import { AliveRoutes, ValidationRoutes } from './routes/index';

config();

const app = new App([new AliveRoutes(), new ValidationRoutes()]);

app.listen();
