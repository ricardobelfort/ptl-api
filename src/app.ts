import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

const app = express();
app.use(helmet());
app.use(cors({ origin: [/^https:\/\/.*\.vercel\.app$/, /http:\/\/localhost:\d+/], credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api/v1', routes);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// 404
app.use((req, res) => res.status(404).json({ message: 'Not Found' }));

// erro genérico
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (env.NODE_ENV !== 'production') console.error(err);
  res.status(err.status || 500).json({ message: 'Internal Server Error' });
});

export default app;
