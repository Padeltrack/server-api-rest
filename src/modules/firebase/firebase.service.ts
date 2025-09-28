import { storage, auth } from 'firebase-admin';
import LoggerColor from 'node-color-log';

export const verifyIdFirebaseTokenGoogle = async (token: string) => {
  try {
    return await auth().verifyIdToken(token);
  } catch (error) {
    throw new Error('No autorizado');
  }
};

export const uploadFileFirebaseStorage = (options: { path: string; buffer: Buffer }) => {
  const { path, buffer } = options;

  try {
    storage().bucket().file(path).createWriteStream().end(buffer);
  } catch (error) {
    LoggerColor.bold().bgColor('red').error(error.message);
  }
};

export const removeFileFirebaseStorage = async (options: { path: string }) => {
  const { path } = options;

  try {
    await storage().bucket().file(path).delete({ ignoreNotFound: true });
  } catch (error) {
    LoggerColor.bold().bgColor('red').error(error.message);
  }
};
