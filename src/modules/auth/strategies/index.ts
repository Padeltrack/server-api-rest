import { Response } from 'express';
import { SelectRoleModel } from '../../user/user.model';
import type { RoleModel, UserModel } from '../../user/user.model';
import { adminAuthStrategic } from './admin.auth.strategic';
import { studentsAuthStrategic } from './student.auth.strategic';
import { coachesAuthStrategic } from './coach.auth.strategic';

export type ParamsAuthStrategy = {
  user: UserModel;
  isPanelAdmin?: boolean;
};
type AuthStrategy = (option: { data: ParamsAuthStrategy; res: Response }) => Promise<any>;

const authStrategiesByRole: Record<RoleModel, AuthStrategy> = {
  [SelectRoleModel.Admin]: adminAuthStrategic,
  [SelectRoleModel.SuperAdmin]: adminAuthStrategic,
  [SelectRoleModel.Student]: studentsAuthStrategic,
  [SelectRoleModel.Coach]: coachesAuthStrategic,
};

export const selectAuthStrategy = (role: RoleModel): AuthStrategy => {
  return authStrategiesByRole[role] || studentsAuthStrategic;
};
