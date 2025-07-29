import { Router } from 'express';
import { getQuestionsExam, registerAnswerExam, registerGradeExam } from '../modules/exam/exam.controller';
import { authenticate } from '../middleware/auth.middleware';

const authRoutes = Router();
const pathAuth = '/exam';

authRoutes.get(`${pathAuth}/questions/list`, authenticate, getQuestionsExam);
authRoutes.post(`${pathAuth}/register/answer`, authenticate, registerAnswerExam);
authRoutes.post(`${pathAuth}/register/grade`, authenticate, registerGradeExam);

export default authRoutes;
