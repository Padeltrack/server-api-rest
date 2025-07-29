import { initializeApp, cert } from 'firebase-admin/app';
import LoggerColor from 'node-color-log';

export const initializeFirebase = () => {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.BUCKET_URL,
  });

  LoggerColor.bold().info('✅ Firebase initialized');
};
