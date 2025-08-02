import { Router } from 'express';
import { getQuestionsExam, getAnswerExamByList, registerAnswerExam, registerGradeExam, getAnswerExamById } from '../modules/exam/exam.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/roles.middleware';
import { SelectRoleModel } from '../modules/user/user.model';

const examRoutes = Router();
const pathAuth = '/exam';

examRoutes.get(`${pathAuth}/questions/list`, authenticate, getQuestionsExam);
examRoutes.get(`${pathAuth}/answer/list`, authenticate, authorize(SelectRoleModel.SuperAdmin), getAnswerExamByList);
examRoutes.get(`${pathAuth}/answer/:id`, authenticate, authorize(SelectRoleModel.SuperAdmin), getAnswerExamById);
examRoutes.post(`${pathAuth}/register/answer`, authenticate, registerAnswerExam);
examRoutes.post(`${pathAuth}/register/grade`, authenticate, authorize(SelectRoleModel.Coach), registerGradeExam);

export default examRoutes;
