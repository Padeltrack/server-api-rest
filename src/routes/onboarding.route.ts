import { Router } from 'express';
import { getQuestionsOnboarding } from '../modules/onboarding/onboarding.controller';
import { authenticate } from '../middleware/auth.middleware';

const authRoutes = Router();
const pathAuth = '/onboarding';

authRoutes.get(`${pathAuth}/questions/list`, authenticate, getQuestionsOnboarding);

export default authRoutes;
