import 'reflect-metadata';
import 'dotenv/config';

import App from './loaders/app';
import { AliveRoutes, ValidationRoutes } from './routes/index';

const app = new App([new AliveRoutes(), new ValidationRoutes()]);

app.listen();
