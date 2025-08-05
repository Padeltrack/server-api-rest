import { Router } from 'express';
import { getVideos, getVideoById } from '../modules/video/video.controller';
import { authenticate } from '../middleware/auth.middleware';
import { SelectRoleModel } from '../modules/user/user.model';
import { authorize } from '../middleware/roles.middleware';

const videoRoutes = Router();
const pathAuth = '/video';

videoRoutes.get(`${pathAuth}/all`, authenticate, authorize(SelectRoleModel.SuperAdmin), getVideos);
videoRoutes.get(
  `${pathAuth}/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  getVideoById,
);

export default videoRoutes;
