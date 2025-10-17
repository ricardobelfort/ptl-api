import { env } from './env';
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: { title: 'Painel Trabalhando a Liberdade - API', version: '1.0.0' },
    servers: [{ url: `http://localhost:${env.PORT}/api/v1` }]
  },
  apis: ['src/routes/**/*.ts', 'src/modules/**/*.ts', 'src/types/**/*.ts']
};

export const swaggerSpec = swaggerJSDoc(options);
