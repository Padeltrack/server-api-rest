import { Router } from 'express';
import { createPlan, getCoachPlans, getPlans, updatePlan } from '../modules/plan/plan.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { SelectRoleModel } from '../modules/user/user.model';

const router = Router();
const basePath = '/plan';

router.get(`${basePath}/all`, getPlans);
router.get(`${basePath}/coach/all`, getCoachPlans);
router.post(basePath, authenticate, authorize(SelectRoleModel.SuperAdmin), createPlan);
router.patch(`${basePath}/:id`, authenticate, authorize(SelectRoleModel.SuperAdmin), updatePlan);

export default router;
