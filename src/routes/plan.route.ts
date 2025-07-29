import { Router } from 'express';
import { createPlan, getAllPlans } from '../modules/plan/plan.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { SelectRoleModel } from '../modules/user/user.model';

const router = Router();
const basePath = '/plan';

router.post(basePath, authenticate, authorize(SelectRoleModel.SuperAdmin), createPlan);
router.get(`${basePath}/all`, getAllPlans);

export default router;
