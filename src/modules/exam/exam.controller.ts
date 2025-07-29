import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { ExamQuestionMongoModel } from './exam.model';
import { ExamAnswerMongoModel, SelectStatusAnswerModel } from './exam-answer.model';
import { ExamAnswerRegisterSchemaZod, ExamGradeRegisterSchemaZod } from './exam.dto';
import { ZodError } from 'zod';
import { SelectUserLevelModel, UserLevelModel, UserMongoModel } from '../user/user.model';

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

export const registerAnswerExam = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'registerAnswerExam' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const userId = me._id;
    const { questionId, answerText } = ExamAnswerRegisterSchemaZod.parse(req.body);
    const answerUrlVideo = 'https://vimeo.com/1100055243';
    let isComplete = false;

    if (me.level) {
        return res.status(401).json({
            message: 'You have already completed the exam'
        });
    }

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

    if (!currentExam) {
      await ExamAnswerMongoModel.create({
        _id: new ObjectId().toHexString(),
        userId,
        status: SelectStatusAnswerModel.Pendiente,
        answers: [
          {
            questionId,
            answerText,
            answerUrlVideo,
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
            'answers.$.answerUrlVideo': answerUrlVideo,
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
              answerUrlVideo,
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
