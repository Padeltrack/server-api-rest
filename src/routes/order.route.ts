import { Router } from 'express';
import { createOrder, getOrdersByUser, updateOrderStatus } from '../modules/order/order.controller';

const router = Router();
const basePath = '/order';

router.post(basePath, createOrder); // Crear orden
router.get(`${basePath}/:userId`, getOrdersByUser); // Ver órdenes por usuario
router.patch(`${basePath}/:id`, updateOrderStatus); // Cambiar estado (admin)

export default router;
