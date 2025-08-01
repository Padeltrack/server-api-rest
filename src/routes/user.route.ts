import { Router } from 'express';
import { getMe, getUsers, deleteMe, markVerifiedUser } from '../modules/user/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { SelectRoleModel } from '../modules/user/user.model';
import { authorize } from '../middleware/roles.middleware';

const userRoutes = Router();
const pathAuth = '/user';

userRoutes.get(`${pathAuth}/all`, authenticate, authorize(SelectRoleModel.SuperAdmin), getUsers);
userRoutes.get(`${pathAuth}/me`, authenticate, getMe);
userRoutes.patch(`${pathAuth}/mark/verified/:id`, authenticate, authorize(SelectRoleModel.SuperAdmin), markVerifiedUser);
userRoutes.delete(`${pathAuth}/me`, authenticate, deleteMe);

export default userRoutes;
