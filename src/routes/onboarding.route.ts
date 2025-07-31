import { Router } from 'express';
import { getQuestionsOnboarding } from '../modules/onboarding/onboarding.controller';

const authRoutes = Router();
const pathAuth = '/onboarding';

authRoutes.get(`${pathAuth}/questions/list`, getQuestionsOnboarding);

export default authRoutes;
