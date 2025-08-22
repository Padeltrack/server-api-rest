import path from 'path';

import express from 'express';

export const serverImagesStaticAssets = () => {
  const router = express.Router();

  router.use(
    '/public/images',
    express.static(path.join(__dirname, '../../public/images'), {
      maxAge: '30d',
      setHeaders: res => {
        res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
      },
    }),
  );

  return router;
};
