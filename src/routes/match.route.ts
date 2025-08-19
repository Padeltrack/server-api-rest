import { Router } from 'express';
import {
  getMatches
} from '../modules/match/match.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { SelectRoleModel } from '../modules/user/user.model';

const matchRoutes = Router();
const pathMatch = '/match';

matchRoutes.get(`${pathMatch}/all`, authenticate, authorize(SelectRoleModel.SuperAdmin, SelectRoleModel.Coach), getMatches);

export default matchRoutes;
