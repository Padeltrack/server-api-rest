import { Router } from 'express';
import { getAds, createAds, updateAds, deleteAds } from '../modules/ads/ads.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { SelectRoleModel } from '../modules/user/user.model';

const adsRoutes = Router();
const pathAds = '/ads';

adsRoutes.get(`${pathAds}`, getAds);
adsRoutes.post(`${pathAds}`, authenticate, authorize(SelectRoleModel.SuperAdmin), createAds);
adsRoutes.patch(`${pathAds}/:id`, authenticate, authorize(SelectRoleModel.SuperAdmin), updateAds);
adsRoutes.delete(`${pathAds}/:id`, authenticate, authorize(SelectRoleModel.SuperAdmin), deleteAds);

export default adsRoutes;
