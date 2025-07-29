import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import LoggerColor from 'node-color-log';

import vimeoRoutes from './routes/vimeo.route';
import planRoutes from './routes/plan.route';
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.route';
import onboarding from './routes/onboarding.route';
import Exam from './routes/exam.route';
import orderRoutes from './routes/order.route';
import { errorHandler } from './middleware/errorHandler.middleware';
import { connectToMongo } from './config/mongo.config';
import { initializeFirebase } from './config/firebase.config';
import { logger } from './middleware/logger.middleware';

const { swaggerDocument } = require('./swagger');
const swaggerUi = require('swagger-ui-express');

dotenv.config();
initializeFirebase();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api', logger, [
  vimeoRoutes,
  orderRoutes,
  planRoutes,
  authRoutes,
  userRoutes,
  onboarding,
  Exam,
]);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

connectToMongo()
  .then(() => {
    app.listen(PORT, () => {
      LoggerColor.bold().log(`🚀 Server running on http://localhost:${PORT}`);
      LoggerColor.bold().log(`📚 Swagger docs at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(err => {
    LoggerColor.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  });
