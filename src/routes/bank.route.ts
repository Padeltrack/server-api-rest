import { Router } from 'express';
import { getBanks, createBank, updateBank, deleteBank } from '../modules/bank/bank.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { SelectRoleModel } from '../modules/user/user.model';

const bankRoutes = Router();
const pathBank = '/bank';

bankRoutes.get(`${pathBank}/all`, authenticate, getBanks);
bankRoutes.post(`${pathBank}`, authenticate, authorize(SelectRoleModel.SuperAdmin), createBank);
bankRoutes.patch(
  `${pathBank}/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  updateBank,
);
bankRoutes.delete(
  `${pathBank}/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  deleteBank,
);

export default bankRoutes;
