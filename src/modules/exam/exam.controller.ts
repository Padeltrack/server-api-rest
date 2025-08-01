import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { ExamQuestionMongoModel } from './exam.model';
import { ExamAnswerMongoModel, SelectStatusAnswerModel } from './exam-answer.model';
import { ExamAnswerRegisterSchemaZod, ExamGradeRegisterSchemaZod } from './exam.dto';
import { ZodError } from 'zod';
import { SelectRoleModel, SelectUserLevelModel, UserLevelModel, UserMongoModel } from '../user/user.model';
import { uploadVideoToVimeo } from '../vimeo/vimeo.helper';
import { VideoMongoModel } from '../video/video.model';
import { examFolder } from '../vimeo/viemo.constant';

export const getQuestionsExam = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'getQuestionsExam' });
  req.logger.info({ status: 'start' });

  try {
    const questions = await ExamQuestionMongoModel.find().sort({ order: 1 });
    return res.status(200).json({ questions });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching questions exam', error });
  }
};

export const getAnswerExamByList = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'getAnswerExamByList' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;

    const where: any = {};
    if (me.role === SelectRoleModel.Coach) {
      where['status'] = { $in: [SelectStatusAnswerModel.Revision, SelectStatusAnswerModel.Pendiente] };
    }

    const exams = await ExamAnswerMongoModel.find(where).select('_id userId status average createdAt').populate('userId', 'displayName photo gender email role').lean().sort({ order: -1 });
    return res.status(200).json({ exams });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching answer exam list', error });
  }
};

export const getAnswerExamById = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'getAnswerExamById' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const idAnswerExam = req.params.id as string;

    const where: any = {
      _id: idAnswerExam
    };
    if (me.role === SelectRoleModel.Coach) {
      where['status'] = { $in: [SelectStatusAnswerModel.Revision, SelectStatusAnswerModel.Pendiente] };
    }

    const exam = await ExamAnswerMongoModel.findOne(where).populate('userId', '_id displayName level photo gender email role').populate('answers.questionId').lean().sort({ order: -1 });
    const allQuestions = await ExamQuestionMongoModel.find().select('_id').lean();

    const expectedIds = allQuestions.map(q => q._id.toString());
    const answeredIds = exam?.answers.map((a: any) => a.questionId?._id?.toString()).filter(Boolean);
    const hasAllQuestionsAnswered = expectedIds.every(id => answeredIds?.includes(id));

    return res.status(200).json({ exam, hasAllQuestionsAnswered });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching answer exam by id', error });
  }
};

export const registerAnswerExam = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'registerAnswerExam' });
  req.logger.info({ status: 'start' });

  try {
    const me = { _id: '687f061066f67f6f76f56744', level: null } // req.user;
    const userId = me._id;
    const { questionId, answerText } = ExamAnswerRegisterSchemaZod.parse(req.body);
    const filePath = req.file?.path;

    if (me.level) {
      return res.status(401).json({
          message: 'You have already completed the exam'
      });
    }
    let isComplete = false;

    const getExistQuestionExam = await ExamQuestionMongoModel.exists({ _id: questionId });
    if (!getExistQuestionExam) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const currentExam = await ExamAnswerMongoModel.findOne({ userId }).sort({ createdAt: -1 });

    if (currentExam && currentExam.status !== SelectStatusAnswerModel.Pendiente) {
      return res.status(400).json({
        message: 'You have already completed the exam',
        isComplete: true,
      });
    }

    if (!filePath) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result: any = await uploadVideoToVimeo({
      video: {
        filePath,
        name: req.file?.originalname || `Video de examen ${new Date().toISOString()}`,
      },
      folderId: examFolder,
      isPrivate: true
    });

    const idVideo = new ObjectId().toHexString();
    await VideoMongoModel.create({
      _id: idVideo,
      idVideoVimeo: result.uri.split('/').pop()
    });

    if (!currentExam) {
      await ExamAnswerMongoModel.create({
        _id: new ObjectId().toHexString(),
        userId,
        status: SelectStatusAnswerModel.Pendiente,
        answers: [
          {
            questionId,
            answerText,
            idVideo,
            createdAt: new Date(),
          },
        ],
      });

      return res.status(200).json({
        message: 'Answer registered successfully',
        isComplete: false
      });
    }

    const isExistQuestionUser = await ExamAnswerMongoModel.exists({
      _id: currentExam._id,
      answers: { $elemMatch: { questionId } },
    });

    if (isExistQuestionUser) {
      await ExamAnswerMongoModel.updateOne(
        { _id: currentExam._id, 'answers.questionId': questionId },
        {
          $set: {
            'status': SelectStatusAnswerModel.Pendiente,
            'answers.$.answerText': answerText,
            'answers.$.idVideo': idVideo,
            'answers.$.createdAt': new Date(),
          },
        },
      );
    } else {
      await ExamAnswerMongoModel.updateOne(
        { _id: currentExam._id },
        {
          $set: {
            status: SelectStatusAnswerModel.Pendiente,
          },
          $push: {
            answers: {
              questionId,
              answerText,
              idVideo,
              createdAt: new Date(),
            },
          },
        },
        { upsert: true },
      );
    }

    const questionsExamCount = await ExamQuestionMongoModel.countDocuments({});
    const countAnswers = currentExam?.answers?.length || 0;
    if (questionsExamCount === countAnswers + 1) {
      await ExamAnswerMongoModel.updateOne({ _id: currentExam._id }, { $set: { status: SelectStatusAnswerModel.Revision } });
      isComplete = true
    }

    return res.status(200).json({
      message: 'Answer registered successfully',
      isComplete
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Error de validación',
        issues: error.errors,
      });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error register answer exam', error });
  }
};

export const registerGradeExam = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'registerGradeExam' });
  req.logger.info({ status: 'start' });

  try {
    const { examAnswerId, answers } = ExamGradeRegisterSchemaZod.parse(req.body);

    const getExamAnswer = await ExamAnswerMongoModel.findOne({ _id: examAnswerId });

    if (!getExamAnswer) {
      return res.status(404).json({
        message: 'Answer not found'
      });
    }

    if (getExamAnswer.status !== SelectStatusAnswerModel.Revision) {
      return res.status(400).json({
        message: 'Answer not found'
      });
    }

    if (!answers.length) {
      return res.status(404).json({
        message: 'No answers found'
      });
    }

    if (getExamAnswer.answers.length !== answers.length) {
      return res.status(400).json({
        message: 'Number of answers does not match'
      });
    }

    const getUser = await UserMongoModel.findOne({ _id: getExamAnswer.userId });
    if (!getUser) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    const updatedAnswers = answers.map(answer => {
      const match = answers.find((a) => a.questionId === answer.questionId);
      return match ? { ...answer, score: match.score } : answer;
    });
    const average = answers.reduce((sum, a) => sum + (a.score || 0), 0) / (answers.length || 1);

    await ExamAnswerMongoModel.updateOne({
      _id: examAnswerId
    }, { 
      $set: {
        answers: updatedAnswers,
        average,
        status: SelectStatusAnswerModel.Completado
      }
    });

    // UPDATE LEVEL USER
    let levelUser: UserLevelModel = SelectUserLevelModel.Principiante;
    if (average >= 6 && average < 8) {
      levelUser = SelectUserLevelModel.Intermedio;
    } else if (average >= 8) {
      levelUser = SelectUserLevelModel.Avanzado;
    }
    await UserMongoModel.updateOne({
      _id: getUser._id
    }, {
      $set: {
        level: levelUser
      }
    });

    return res.status(200).json({
      message: 'Grade registered successfully'
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: 'Error de validación',
        issues: error.errors,
      });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching grade exam', error });
  }
};
