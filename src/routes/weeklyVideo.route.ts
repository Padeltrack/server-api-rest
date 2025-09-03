import { Router } from 'express';
import { getWeeklyVideos, markCheckMeVideo } from '../modules/weeklyVideo/WeeklyVideo.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { SelectRoleModel } from '../modules/user/user.model';
import { activeOrder } from '../middleware/orderActive.middleware';

const weeklyVideoRoutes = Router();
const pathAuth = '/weeklyVideo';

weeklyVideoRoutes.get(
  `${pathAuth}/me`,
  authenticate,
  authorize(SelectRoleModel.Student, SelectRoleModel.Coach),
  activeOrder,
  getWeeklyVideos,
);
weeklyVideoRoutes.patch(
  `${pathAuth}/check/video/me`,
  authenticate,
  authorize(SelectRoleModel.Student, SelectRoleModel.Coach),
  activeOrder,
  markCheckMeVideo,
);

export default weeklyVideoRoutes;
