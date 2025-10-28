import { Router } from 'express';
import {
  getMe,
  getUsers,
  deleteMe,
  markVerifiedUser,
  updateMe,
  markWorkedUser,
  getUserById,
  getCoachOrStudentUsers,
  deleteUser,
  createAdmin,
} from '../modules/user/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { SelectRoleModel } from '../modules/user/user.model';
import { authorize } from '../middleware/roles.middleware';
import { translationCollectionMiddleware } from '../middleware/translation.middleware';

const userRoutes = Router();
const pathUser = '/user';

userRoutes.get(`${pathUser}/all`, authenticate, authorize(SelectRoleModel.SuperAdmin), getUsers);
userRoutes.get(`${pathUser}/me`, authenticate, translationCollectionMiddleware, getMe);
userRoutes.get(
  `${pathUser}/coach`,
  authenticate,
  authorize(SelectRoleModel.Student),
  getCoachOrStudentUsers,
);
userRoutes.get(
  `${pathUser}/student`,
  authenticate,
  authorize(SelectRoleModel.Coach),
  getCoachOrStudentUsers,
);
userRoutes.get(`${pathUser}/:id`, authenticate, authorize(SelectRoleModel.SuperAdmin), getUserById);
userRoutes.post(
  `${pathUser}/admin`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  createAdmin,
);
userRoutes.patch(
  `${pathUser}/mark/verified/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  markVerifiedUser,
);
userRoutes.patch(
  `${pathUser}/mark/worked/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  markWorkedUser,
);
userRoutes.patch(`${pathUser}/me`, authenticate, updateMe);
userRoutes.delete(`${pathUser}/me`, authenticate, deleteMe);
userRoutes.delete(
  `${pathUser}/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  deleteUser,
);

export default userRoutes;
