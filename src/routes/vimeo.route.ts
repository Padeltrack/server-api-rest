import { Router } from 'express';
import {
  uploadVideoToFolderVimeo,
  removeVideoToFolderVimeo,
  getVimeoVideos,
  getFreeVimeoVideos,
  getFoldersVimeo,
  getItemsFolderByIdVimeo,
} from '../modules/vimeo/vimeo.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { SelectRoleModel } from '../modules/user/user.model';
import { uploadVideo } from '../middleware/multer.middleware';

const router = Router();
const basePath = '/vimeo';

router.get(`${basePath}/videos/free`, authenticate, getFreeVimeoVideos);
router.get(`${basePath}/videos`, authenticate, getVimeoVideos);
router.get(
  `${basePath}/folders`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  getFoldersVimeo,
);
router.get(
  `${basePath}/folder/:id/items`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  getItemsFolderByIdVimeo,
);
router.post(
  `${basePath}/folder/video/upload`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  uploadVideo.single('upload_video'),
  uploadVideoToFolderVimeo,
);
router.delete(
  `${basePath}/folder/video/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  removeVideoToFolderVimeo,
);

export default router;
