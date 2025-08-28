import { Router } from 'express';
import { createMatch, getMatch, getMatches } from '../modules/match/match.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { SelectRoleModel } from '../modules/user/user.model';
import { activeOrderCoachCenter } from '../middleware/orderActive.middleware';

const matchRoutes = Router();
const pathMatch = '/match';

matchRoutes.get(
  `${pathMatch}/all`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin, SelectRoleModel.Coach),
  getMatches,
);
matchRoutes.get(
  `${pathMatch}/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin, SelectRoleModel.Coach),
  getMatch,
);
matchRoutes.post(
  `${pathMatch}`,
  authenticate,
  authorize(SelectRoleModel.Coach),
  activeOrderCoachCenter,
  createMatch,
);

export default matchRoutes;
