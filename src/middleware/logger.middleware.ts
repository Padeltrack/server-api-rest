import { Request, Response, NextFunction } from 'express';
import pino from 'pino';

declare module 'express-serve-static-core' {
  interface Request {
    logger: pino.Logger;
  }
}

let cachedLogger: pino.Logger | null = null;

export function getLogger() {
  if (cachedLogger) {
    return cachedLogger;
  }

  const logger = pino({ base: null }).child({ env: process.env.ENV, version: '2' });
  cachedLogger = logger;
  return logger;
}

export const logger = (req: Request, _res: Response, next: NextFunction) => {
  const logger = getLogger();
  req.logger = logger;
  next();
};
