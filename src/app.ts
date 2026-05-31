import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime_seconds: Math.floor(process.uptime()) });
  });

  app.use('/', routes);

  return app;
}
