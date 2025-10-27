import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      language: string;
    }
  }
}

export const transformTranslatedDocument = (doc: any, language: string): any => {
  if (!doc || typeof doc !== 'object') {
    return doc;
  }

  if (Array.isArray(doc)) {
    return doc.map(item => transformTranslatedDocument(item, language));
  }

  if (doc.translate && typeof doc.translate === 'object') {
    const translatedDoc = { ...doc };
    const translation = doc.translate[language];

    if (translation && typeof translation === 'object') {
      Object.keys(translation).forEach(key => {
        if (translation[key] !== null && translation[key] !== undefined) {
          translatedDoc[key] = translation[key];
        }
      });
    }

    delete translatedDoc.translate;
    return translatedDoc;
  }
  return doc;
};

export const translationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);

  const language = req.language || 'es';

  res.json = function (data: any) {
    try {
      const transformedData = transformTranslatedDocument(data, language);
      return originalJson(transformedData);
    } catch (error) {
      console.error('Error in translation middleware:', error);
      return originalJson(data);
    }
  };

  next();
};

export const translationCollectionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const originalJson = res.json.bind(res);
  const language = req.language || 'es';

  res.json = function (data: any) {
    try {
      let transformedData = data;

      if (Array.isArray(data)) {
        if (data.length > 0 && data[0]?.translate) {
          transformedData = data.map((item: any) => transformTranslatedDocument(item, language));
        }
      } else if (data && typeof data === 'object') {
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key])) {
            if (data[key].length > 0 && data[key][0]?.translate) {
              transformedData = {
                ...transformedData,
                [key]: data[key].map((item: any) => transformTranslatedDocument(item, language)),
              };
            }
          }
        });
      }

      return originalJson(transformedData);
    } catch (error) {
      console.error('Error in translation collection middleware:', error);
      return originalJson(data);
    }
  };

  next();
};

export const transformToLanguage = (data: any, language: string = 'es'): any => {
  return transformTranslatedDocument(data, language);
};

export const getRequestLanguage = (req: Request): string => {
  return req.language || 'es';
};
