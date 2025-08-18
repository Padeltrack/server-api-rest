import { Router } from 'express';
import {
  getMyCoaches,
  assignCoach,
  removeAssignCoach,
  getCoachesByStudent,
} from '../modules/studentCoaches/studentCoaches.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { SelectRoleModel } from '../modules/user/user.model';

const studentCoachesRoutes = Router();
const pathStudentCoaches = '/studentCoaches';

studentCoachesRoutes.get(
  `${pathStudentCoaches}/assign/me`,
  authenticate,
  authorize(SelectRoleModel.Student),
  getMyCoaches,
);
studentCoachesRoutes.get(
  `${pathStudentCoaches}/assign/:studentId`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  getCoachesByStudent,
);
studentCoachesRoutes.post(
  `${pathStudentCoaches}/assign/me`,
  authenticate,
  authorize(SelectRoleModel.Student),
  assignCoach,
);
studentCoachesRoutes.delete(
  `${pathStudentCoaches}/assign/me/:id`,
  authenticate,
  authorize(SelectRoleModel.Student),
  removeAssignCoach,
);

export default studentCoachesRoutes;
