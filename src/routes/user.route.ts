import { Router } from 'express';
import { getMe, getUsers, deleteMe } from '../modules/user/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { SelectRoleModel } from '../modules/user/user.model';
import { authorize } from '../middleware/roles.middleware';

const authRoutes = Router();
const pathAuth = '/user';

authRoutes.get(`${pathAuth}/all`, authenticate, authorize(SelectRoleModel.SuperAdmin), getUsers);
authRoutes.get(`${pathAuth}/me`, authenticate, getMe);
authRoutes.delete(`${pathAuth}/me`, authenticate, deleteMe);

export default authRoutes;
