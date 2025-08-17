import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrdersById,
  updateOrderStatus,
} from '../modules/order/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { SelectRoleModel } from '../modules/user/user.model';

const router = Router();
const basePath = '/order';

router.get(
  `${basePath}/all`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin, SelectRoleModel.Student),
  getOrders,
);
router.get(
  `${basePath}/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin, SelectRoleModel.Student),
  getOrdersById,
);
router.post(basePath, authenticate, authorize(SelectRoleModel.Student), createOrder);
router.patch(
  `${basePath}/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  updateOrderStatus,
);

export default router;
