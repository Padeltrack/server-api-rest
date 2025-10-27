import { Router } from 'express';
import {
  getQuestionnaireExam,
  getAnswerExamByList,
  registerAnswerExam,
  registerGradeExam,
  getAnswerExamById,
  addQuestionnaire,
  deleteQuestionnaire,
  getRegisterAnswerExam,
  assignExamToCoach,
  finalizeAnswerExam,
  updateQuestionnaire,
} from '../modules/exam/exam.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { SelectRoleModel } from '../modules/user/user.model';
import { uploadVideo } from '../middleware/multer.middleware';
import { activeOrder } from '../middleware/orderActive.middleware';
import { translationCollectionMiddleware } from '../middleware/translation.middleware';

const examRoutes = Router();
const pathAExam = '/exam';

examRoutes.get(
  `${pathAExam}/questionnaire/list`,
  authenticate,
  authorize(SelectRoleModel.Student, SelectRoleModel.SuperAdmin, SelectRoleModel.Coach),
  // activeOrder,
  translationCollectionMiddleware,
  getQuestionnaireExam,
);
examRoutes.get(
  `${pathAExam}/answer/list`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin, SelectRoleModel.Coach),
  getAnswerExamByList,
);
examRoutes.get(
  `${pathAExam}/answer/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin, SelectRoleModel.Coach),
  getAnswerExamById,
);
examRoutes.get(
  `${pathAExam}/register/answer`,
  authenticate,
  authorize(SelectRoleModel.Student, SelectRoleModel.Coach),
  activeOrder,
  getRegisterAnswerExam,
);
examRoutes.post(
  `${pathAExam}/questionnaire/add`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  uploadVideo.single('upload_video'),
  addQuestionnaire,
);
examRoutes.post(
  `${pathAExam}/register/answer`,
  authenticate,
  authorize(SelectRoleModel.Student, SelectRoleModel.Coach),
  activeOrder,
  uploadVideo.single('upload_video'),
  registerAnswerExam,
);
examRoutes.post(
  `${pathAExam}/finalize/answer`,
  authenticate,
  authorize(SelectRoleModel.Student, SelectRoleModel.Coach),
  activeOrder,
  finalizeAnswerExam,
);
examRoutes.post(
  `${pathAExam}/register/grade`,
  authenticate,
  authorize(SelectRoleModel.Coach),
  registerGradeExam,
);
examRoutes.post(
  `${pathAExam}/assign/coach`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  assignExamToCoach,
);
examRoutes.patch(
  `${pathAExam}/questionnaire/update/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  uploadVideo.fields([
    { name: 'upload_video', maxCount: 1 },
    { name: 'upload_thumbnail', maxCount: 1 },
  ]),
  updateQuestionnaire,
);
examRoutes.delete(
  `${pathAExam}/questionnaire/delete/:id`,
  authenticate,
  authorize(SelectRoleModel.SuperAdmin),
  deleteQuestionnaire,
);

export default examRoutes;
