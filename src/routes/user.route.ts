import { Router } from 'express';
import {
  getMe,
  getUsers,
  deleteMe,
  markVerifiedUser,
  updateMe,
  markWorkedUser,
  getUserById,
} from '../modules/user/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { SelectRoleModel } from '../modules/user/user.model';
import { authorize } from '../middleware/roles.middleware';

const userRoutes = Router();
const pathAuth = '/user';

userRoutes.get(`${pathAuth}/all`, authenticate, authorize(SelectRoleModel.SuperAdmin), getUsers);
userRoutes.get(`${pathAuth}/me`, authenticate, getMe);
userRoutes.get(`${pathAuth}/:id`, authenticate, authorize(SelectRoleModel.SuperAdmin), getUserById);
userRoutes.patch(
  `${pathAuth}/mark/verified/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  markVerifiedUser,
);
userRoutes.patch(
  `${pathAuth}/mark/worked/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  markWorkedUser,
);
userRoutes.patch(`${pathAuth}/me`, authenticate, updateMe);
userRoutes.delete(`${pathAuth}/me`, authenticate, deleteMe);

export default userRoutes;
