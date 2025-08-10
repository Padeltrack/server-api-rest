import { Router } from 'express';
import { deleteQuestionOnboarding, getQuestionsOnboarding, updateQuestionOnboarding } from '../modules/onboarding/onboarding.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { SelectRoleModel } from '../modules/user/user.model';

const onboardingRoutes = Router();
const pathOnboarding = '/onboarding';

onboardingRoutes.get(`${pathOnboarding}/questions/list`, getQuestionsOnboarding);
onboardingRoutes.patch(`${pathOnboarding}/questions/:id`, authenticate, authorize(SelectRoleModel.SuperAdmin), updateQuestionOnboarding);
onboardingRoutes.delete(`${pathOnboarding}/questions/:id`, authenticate, authorize(SelectRoleModel.SuperAdmin), deleteQuestionOnboarding);

export default onboardingRoutes;
