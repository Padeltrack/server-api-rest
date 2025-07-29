import fs from 'fs';
import path from 'path';

const readJSON = (filePath: string) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, filePath), 'utf-8'));

const paths = {
  ...readJSON('./paths/auth.paths.json'),
  ...readJSON('./paths/plan.paths.json'),
  ...readJSON('./paths/orders.paths.json'),
  ...readJSON('./paths/vimeo.paths.json'),
  ...readJSON('./paths/user.paths.json'),
};

const schemas = {
  ...readJSON('./schemas/auth.validationZodError.schema.json'),
  ...readJSON('./schemas/user.schema.json'),
  ...readJSON('./schemas/plan.schema.json'),
  ...readJSON('./schemas/order.schema.json'),
  ...readJSON('./schemas/vimeo.schema.json'),
};

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Backend API',
    version: '1.0.0',
  },
  paths,
  components: {
    schemas,
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};
