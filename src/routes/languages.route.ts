import { Router } from 'express';
import { getAvailableLanguages } from '../modules/languages/languages.controller';

const languageRoutes = Router();
const pathLanguages = '/languages';

languageRoutes.get(
  `${pathLanguages}/available`,
  getAvailableLanguages,
);

export default languageRoutes;
