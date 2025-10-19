import express from 'express';
import cors from 'cors';
import LoggerColor from 'node-color-log';
import fs from 'fs';
import path from 'path';

import vimeoRoutes from './routes/vimeo.route';
import planRoutes from './routes/plan.route';
import authRoutes from './routes/auth.route';
import userRoutes from './routes/user.route';
import onboardingRoutes from './routes/onboarding.route';
import examRoutes from './routes/exam.route';
import videoRoutes from './routes/video.route';
import orderRoutes from './routes/order.route';
import bankRoutes from './routes/bank.route';
import studentCoachesRoutes from './routes/studentCoaches.route';
import weeklyVideoRoutes from './routes/weeklyVideo.route';
import matchRoutes from './routes/match.route';
import AdsRoutes from './routes/ads.route';

import { errorHandler } from './middleware/errorHandler.middleware';
import { connectToMongo } from './config/mongo.config';
import { initializeFirebase } from './config/firebase.config';
import { configureEnvironment } from './config/env.config';
import { logger } from './middleware/logger.middleware';
import { HOST_PERMITS } from './shared/util/url.util';
import { cronApp } from './core/crons';
import { serverImagesStaticAssets } from './middleware/imagesCache.middleware';

// const { swaggerDocument } = require('./swagger');
// const swaggerUi = require('swagger-ui-express');

// Configurar las variables de entorno según el ambiente (development o production)
configureEnvironment();

const uploadDir = path.join('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

initializeFirebase();
cronApp();

const app = express();

app.use(
  cors({
    origin: HOST_PERMITS,
  }),
);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(serverImagesStaticAssets());

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api', logger, [
  vimeoRoutes,
  orderRoutes,
  planRoutes,
  authRoutes,
  userRoutes,
  onboardingRoutes,
  examRoutes,
  videoRoutes,
  weeklyVideoRoutes,
  bankRoutes,
  studentCoachesRoutes,
  matchRoutes,
  AdsRoutes,
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
