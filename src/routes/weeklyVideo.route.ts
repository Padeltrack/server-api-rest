import { Router } from 'express';
import {
  getWeeklyVideos,
} from '../modules/weeklyVideo/WeeklyVideo.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { SelectRoleModel } from '../modules/user/user.model';

const weeklyVideoRoutes = Router();
const pathAuth = '/weeklyVideo';

weeklyVideoRoutes.get(`${pathAuth}/me`, authenticate, authorize(SelectRoleModel.Student), getWeeklyVideos);

export default weeklyVideoRoutes;
