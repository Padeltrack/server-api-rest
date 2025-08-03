import { Router } from 'express';
import { getQuestionnaireExam, getAnswerExamByList, registerAnswerExam, registerGradeExam, getAnswerExamById } from '../modules/exam/exam.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { SelectRoleModel } from '../modules/user/user.model';
import { uploadVideo } from '../middleware/multer.middleware';

const examRoutes = Router();
const pathAuth = '/exam';

examRoutes.get(`${pathAuth}/questionnaire/list`, getQuestionnaireExam);
examRoutes.get(`${pathAuth}/answer/list`, authenticate, authorize(SelectRoleModel.SuperAdmin, SelectRoleModel.Coach), getAnswerExamByList);
examRoutes.get(`${pathAuth}/answer/:id`, authenticate, authorize(SelectRoleModel.SuperAdmin, SelectRoleModel.Coach), getAnswerExamById);
examRoutes.post(`${pathAuth}/register/answer`, uploadVideo.single('upload_video'), registerAnswerExam);
examRoutes.post(`${pathAuth}/register/grade`, authenticate, authorize(SelectRoleModel.Coach), registerGradeExam);

export default examRoutes;
