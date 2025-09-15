import { Router } from 'express';
import {
  getVideos,
  getVideoById,
  addVideo,
  updateFileVideo,
  deleteVideo,
  updateVideo,
} from '../modules/video/video.controller';
import { authenticate } from '../middleware/auth.middleware';
import { SelectRoleModel } from '../modules/user/user.model';
import { authorize } from '../middleware/roles.middleware';
import { uploadVideo } from '../middleware/multer.middleware';

const videoRoutes = Router();
const pathVideo = '/video';

videoRoutes.get(`${pathVideo}/all`, authenticate, authorize(SelectRoleModel.SuperAdmin), getVideos);
videoRoutes.get(
  `${pathVideo}/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  getVideoById,
);
videoRoutes.post(
  `${pathVideo}`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  uploadVideo.single('upload_video'),
  addVideo,
);
videoRoutes.patch(
  `${pathVideo}/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  uploadVideo.fields([
    { name: 'upload_video', maxCount: 1 },
    { name: 'upload_thumbnail', maxCount: 1 },
  ]),
  updateVideo,
);
videoRoutes.patch(
  `${pathVideo}/file/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  uploadVideo.single('upload_video'),
  updateFileVideo,
);
videoRoutes.delete(
  `${pathVideo}/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  deleteVideo,
);

export default videoRoutes;
