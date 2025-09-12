import multer from 'multer';
import { Request } from 'express';
import fs from 'fs/promises';

export const uploadVideo = multer({ dest: 'uploads/' });

export const cleanUploadedFiles = async (req: Request) => {
  if (!req.files) return;

  const filesArray = Object.values(req.files).flat() as Express.Multer.File[];

  for (const file of filesArray) {
    try {
      await fs.unlink(file.path);
      console.log(`Archivo borrado: ${file.path}`);
    } catch (err) {
      console.warn(`No se pudo borrar el archivo ${file.path}:`, err);
    }
  }
};
