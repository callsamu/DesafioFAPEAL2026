import { Express, Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const spec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FAPEAL API',
      version: '1.0.0',
      description: 'API REST de dados educacionais dos municípios de Alagoas',
    },
  },
  apis: ['./src/routes.ts'],
});

export function registerDocs(app: Express) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.json(spec);
  });
}
