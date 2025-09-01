import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { ExamQuestionnaireMongoModel } from './exam.model';
import { ExamAnswerMongoModel, SelectStatusAnswerModel } from './exam-answer.model';
import {
  addQuestionnaireSchemaZod,
  AssignExamToCoachSchemaZod,
  ExamAnswerRegisterSchemaZod,
  ExamGradeRegisterSchemaZod,
} from './exam.dto';
import { ZodError } from 'zod';
import {
  SelectRoleModel,
  SelectUserLevelModel,
  UserLevelModel,
  UserMongoModel,
} from '../user/user.model';
import {
  deleteVimeoVideo,
  getUrlTokenExtractVimeoVideoById,
  getVimeoVideoById,
  uploadVideoToVimeo,
} from '../vimeo/vimeo.helper';
import { examAnswerStudentFolder, examFolder } from '../vimeo/viemo.constant';
import { sendEMail } from '../mail/sendTemplate.mail';
import { HOST_CLIENT_ADMIN_PROD } from '../../shared/util/url.util';
import { generateEmail } from '../mail/loadTemplate.mail';

export const getQuestionnaireExam = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'getQuestionnaireExam' });
  req.logger.info({ status: 'start' });

  try {
    const getQuestionnaires = await ExamQuestionnaireMongoModel.find().sort({ order: 1 });
    const questionnaires = await Promise.all(
      getQuestionnaires.map(async (q: any) => {
        const videoVimeo: any = await getVimeoVideoById({ id: q.idVideoVimeo });
        const { linkVideo, thumbnail } = getUrlTokenExtractVimeoVideoById({ videoVimeo });
        return {
          ...q._doc,
          linkVideo,
          thumbnail,
        };
      }),
    );

    return res.status(200).json({ questionnaires });
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
    const status = req.query.status || '';

    const where: any = {};

    if (status) where['status'] = status;
    if (me.role === SelectRoleModel.Coach) {
      where['assignCoachId'] = me._id;
      where['status'] = {
        $in: [
          SelectStatusAnswerModel.Revision,
          SelectStatusAnswerModel.Pendiente,
          SelectStatusAnswerModel.Completado,
        ],
      };
    }

    const count = await ExamAnswerMongoModel.countDocuments(where);
    const exams = await ExamAnswerMongoModel.aggregate([
      { $match: where },
      {
        $addFields: {
          statusOrder: {
            $switch: {
              branches: [
                {
                  case: {
                    $in: [
                      '$status',
                      [SelectStatusAnswerModel.Pendiente, SelectStatusAnswerModel.Revision],
                    ],
                  },
                  then: 1,
                },
                { case: { $eq: ['$status', SelectStatusAnswerModel.Rechazado] }, then: 2 },
                { case: { $eq: ['$status', SelectStatusAnswerModel.Completado] }, then: 3 },
              ],
              default: 4,
            },
          },
        },
      },
      { $sort: { statusOrder: 1, createdAt: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId',
        },
      },
      { $unwind: '$userId' },
      {
        $lookup: {
          from: 'users',
          localField: 'assignCoachId',
          foreignField: '_id',
          as: 'assignCoachId',
        },
      },
      { $unwind: { path: '$assignCoachId', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          userId: { displayName: 1, photo: 1, gender: 1, email: 1, role: 1 },
          assignCoachId: { displayName: 1, photo: 1, gender: 1, email: 1, role: 1 },
          status: 1,
          average: 1,
          createdAt: 1,
        },
      },
    ]);

    return res.status(200).json({ exams, count });
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
      _id: idAnswerExam,
    };
    if (me.role === SelectRoleModel.Coach) {
      where['assignCoachId'] = me._id;
      where['status'] = {
        $in: [
          SelectStatusAnswerModel.Revision,
          SelectStatusAnswerModel.Pendiente,
          SelectStatusAnswerModel.Completado,
        ],
      };
    }

    const getExam = await ExamAnswerMongoModel.findOne(where)
      .populate('userId', '_id displayName level photo gender email role')
      .populate('assignCoachId', '_id displayName level photo gender email role')
      .populate('answers.questionnaireId')
      .lean()
      .sort({ order: -1 });
    if (!getExam) {
      return res.status(404).json({
        message: 'Answer not found',
      });
    }

    const allQuestions = await ExamQuestionnaireMongoModel.find().select('_id').lean();

    const expectedIds = allQuestions.map(q => q._id.toString());
    const answeredIds = getExam?.answers
      .map((a: any) => a.questionnaireId?._id?.toString())
      .filter(Boolean);
    const hasAllQuestionsAnswered = expectedIds.every(id => answeredIds?.includes(id));

    const answersLinkVideo = await Promise.all(
      getExam.answers.map(async (ans: any) => {
        // Video pregunta cuestionario
        const videoVimeoQuestion: any = await getVimeoVideoById({
          id: ans.questionnaireId.idVideoVimeo,
        });
        const { linkVideo: linkVideoQuestion, thumbnail: thumbnailQuestion } =
          getUrlTokenExtractVimeoVideoById({ videoVimeo: videoVimeoQuestion });

        const questionnaireId = {
          ...ans.questionnaireId,
          linkVideo: linkVideoQuestion,
          thumbnail: thumbnailQuestion,
        };

        // Video respuesta estudiante
        const videoVimeo: any = await getVimeoVideoById({ id: ans.idVideoVimeo });
        const { linkVideo, thumbnail } = getUrlTokenExtractVimeoVideoById({ videoVimeo });

        return {
          ...ans,
          linkVideo,
          thumbnail,
          questionnaireId,
        };
      }),
    );

    getExam.answers = answersLinkVideo;

    return res.status(200).json({ exam: getExam, hasAllQuestionsAnswered });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching answer exam by id', error });
  }
};

export const getRegisterAnswerExam = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'getRegisterAnswerExam' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;

    const currentExam = await ExamAnswerMongoModel.findOne({ userId: me._id }).sort({
      createdAt: -1,
    });

    if (!currentExam) {
      return res.status(200).json({
        message: 'You have not registered for the exam yet',
        answers: [],
        hasAllQuestionsAnswered: false,
      });
    }

    const answersLinkVideo = await Promise.all(
      currentExam.answers.map(async (ans: any) => {
        // Video respuesta estudiante
        const videoVimeo: any = await getVimeoVideoById({ id: ans.idVideoVimeo });
        const { linkVideo, thumbnail } = getUrlTokenExtractVimeoVideoById({ videoVimeo });

        return {
          ...ans._doc,
          linkVideo,
          thumbnail,
        };
      }),
    );

    return res.status(200).json({ answers: answersLinkVideo, status: currentExam.status });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching answer exam by id', error });
  }
};

export const registerAnswerExam = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'registerAnswerExam' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const userId = me._id;
    const { questionnaireId, answerText } = ExamAnswerRegisterSchemaZod.parse(req.body);
    const filePath = req.file?.path;

    if (me.level) {
      return res.status(401).json({
        message: 'You have already completed the exam',
      });
    }
    let isComplete = false;

    const getExistQuestionExam = await ExamQuestionnaireMongoModel.exists({ _id: questionnaireId });
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
      folderId: examAnswerStudentFolder,
      isPrivate: true,
    });

    const idVideoVimeo = result.uri.split('/').pop();

    if (!currentExam) {
      await ExamAnswerMongoModel.create({
        _id: new ObjectId().toHexString(),
        userId,
        status: SelectStatusAnswerModel.Pendiente,
        answers: [
          {
            questionnaireId,
            answerText,
            idVideoVimeo,
            createdAt: new Date(),
          },
        ],
      });

      return res.status(200).json({
        message: 'Answer registered successfully',
        isComplete: false,
      });
    }

    const isExistQuestionUser = await ExamAnswerMongoModel.exists({
      _id: currentExam._id,
      answers: { $elemMatch: { questionnaireId } },
    });

    if (isExistQuestionUser) {
      await ExamAnswerMongoModel.updateOne(
        { _id: currentExam._id, 'answers.questionnaireId': questionnaireId },
        {
          $set: {
            status: SelectStatusAnswerModel.Pendiente,
            'answers.$.answerText': answerText,
            'answers.$.idVideoVimeo': idVideoVimeo,
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
              questionnaireId,
              answerText,
              idVideoVimeo,
              createdAt: new Date(),
            },
          },
        },
        { upsert: true },
      );
    }

    const questionsExamCount = await ExamQuestionnaireMongoModel.countDocuments({});
    const countAnswers = currentExam?.answers?.length || 0;
    if (questionsExamCount === countAnswers + 1) {
      isComplete = true;
    }

    return res.status(200).json({
      message: 'Answer registered successfully',
      isComplete,
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

export const finalizeAnswerExam = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'finalizeAnswerExam' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const userId = me._id;

    if (me.level) {
      return res.status(401).json({
        message: 'You have already completed the exam',
      });
    }
    let isComplete = false;
    const currentExam = await ExamAnswerMongoModel.findOne({ userId }).sort({ createdAt: -1 });

    if (!currentExam) {
      return res.status(404).json({
        message: 'Exam not found',
      });
    }

    if (currentExam.status !== SelectStatusAnswerModel.Pendiente) {
      return res.status(400).json({
        message: 'You have already completed the exam',
        isComplete: true,
      });
    }

    const questionsExamCount = await ExamQuestionnaireMongoModel.countDocuments({});
    const countAnswers = currentExam?.answers?.length || 0;

    if (questionsExamCount === countAnswers) {
      await ExamAnswerMongoModel.updateOne(
        { _id: currentExam._id },
        { $set: { status: SelectStatusAnswerModel.Revision } },
      );
      isComplete = true;
    } else {
      return res.status(400).json({
        message: 'You have not completed the exam',
        isComplete: false,
      });
    }

    return res.status(200).json({
      message: 'Answer finalized successfully',
      isComplete,
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

export const addQuestionnaire = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'addQuestionnaire' });
  req.logger.info({ status: 'start' });

  try {
    const { title, description } = addQuestionnaireSchemaZod.parse(req.body);
    const filePath = req.file?.path;

    if (!filePath) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result: any = await uploadVideoToVimeo({
      video: {
        filePath,
        name: req.file?.originalname || `Video de examen ${new Date().toISOString()}`,
      },
      folderId: examFolder,
      isPrivate: true,
    });

    const idVideoVimeo = result.uri.split('/').pop();

    const lastItem = await ExamQuestionnaireMongoModel.findOne()
      .sort({ order: -1 })
      .select('order');

    const nextOrder = lastItem?.order != null ? lastItem.order + 1 : 1;

    await ExamQuestionnaireMongoModel.create({
      _id: new ObjectId().toHexString(),
      title,
      description,
      idVideoVimeo,
      order: nextOrder,
    });

    return res.status(200).json({
      message: 'Add questionnaire successfully',
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
    const me = req.user;
    const { examAnswerId, answers } = ExamGradeRegisterSchemaZod.parse(req.body);

    const getExamAnswer = await ExamAnswerMongoModel.findOne({ _id: examAnswerId });

    if (!getExamAnswer) {
      return res.status(404).json({
        message: 'Answer not found',
      });
    }

    if (me._id !== getExamAnswer?.assignCoachId) {
      return res.status(403).json({
        message: 'Forbidden',
      });
    }

    if (getExamAnswer.status !== SelectStatusAnswerModel.Revision) {
      return res.status(400).json({
        message: 'Answer not found',
      });
    }

    if (!answers.length) {
      return res.status(404).json({
        message: 'No answers found',
      });
    }

    if (getExamAnswer.answers.length !== answers.length) {
      return res.status(400).json({
        message: 'Number of answers does not match',
      });
    }

    const getUser = await UserMongoModel.findOne({ _id: getExamAnswer.userId });
    if (!getUser) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const updatedAnswers = getExamAnswer.answers.map((answer: any) => {
      const match = answers.find(a => a.questionnaireId === answer.questionnaireId);
      return match ? { ...answer._doc, score: match.score } : answer;
    });

    if (updatedAnswers.length !== answers.length) {
      return res.status(400).json({
        message: 'Number of answers does not match',
      });
    }

    const average = answers.reduce((sum, a) => sum + (a.score || 0), 0) / (answers.length || 1);

    await ExamAnswerMongoModel.updateOne(
      {
        _id: examAnswerId,
      },
      {
        $set: {
          answers: updatedAnswers,
          average,
          status: SelectStatusAnswerModel.Completado,
        },
      },
    );

    // UPDATE LEVEL USER
    let levelUser: UserLevelModel = SelectUserLevelModel.Principiante;
    if (average >= 4 && average <= 6) {
      levelUser = SelectUserLevelModel.Intermedio;
    } else if (average >= 7) {
      levelUser = SelectUserLevelModel.Avanzado;
    }

    await UserMongoModel.updateOne(
      {
        _id: getUser._id,
      },
      {
        $set: {
          level: levelUser,
        },
      },
    );

    const examGradeEmail = await generateEmail({
      template: 'examGradeStudent',
      variables: {
        average: average.toFixed(2),
        studentName: getUser.displayName,
      },
    });

    const msg = {
      from: `${process.env.NODE_MAILER_ROOT_EMAIL}`,
      to: getUser.email,
      subject: 'Calificación de examen, Padel Track',
      text: '-',
      html: examGradeEmail,
    };

    sendEMail({ data: msg });

    return res.status(200).json({
      message: 'Grade registered successfully',
      updatedAnswers,
      levelUser,
      average,
      status: SelectStatusAnswerModel.Completado,
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

export const assignExamToCoach = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'assignExam' });
  req.logger.info({ status: 'start' });

  try {
    const { examAnswerId, coachId } = AssignExamToCoachSchemaZod.parse(req.body);

    const getExamAnswer = await ExamAnswerMongoModel.findOne({ _id: examAnswerId });
    if (!getExamAnswer) {
      return res.status(404).json({
        message: 'Exam answer not found',
      });
    }

    const getUser = await UserMongoModel.findOne({ _id: getExamAnswer.userId });
    if (!getUser) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    if (coachId === getUser._id) {
      return res.status(400).json({
        message: 'You cannot assign your own exam to yourself',
      });
    }

    if (
      ![SelectStatusAnswerModel.Pendiente, SelectStatusAnswerModel.Revision].includes(
        getExamAnswer.status as any,
      )
    ) {
      return res.status(400).json({
        message: 'Exam answer is not in a valid state',
      });
    }

    const getCoach = await UserMongoModel.findOne({ _id: coachId });
    if (!getCoach) {
      return res.status(404).json({
        message: 'Coach not found',
      });
    }

    await ExamAnswerMongoModel.updateOne(
      { _id: examAnswerId },
      { $set: { assignCoachId: coachId } },
    );

    const assignExamEmail = await generateEmail({
      template: 'assignCoachExam',
      variables: {
        professorName: getCoach.displayName,
        studentName: getUser.displayName,
        subject: 'Preparación física',
        status: 'En Revision',
        reviewLink: `${HOST_CLIENT_ADMIN_PROD}/exams/${examAnswerId}`,
      },
    });

    const msg = {
      from: `${process.env.NODE_MAILER_ROOT_EMAIL}`,
      to: getCoach.email,
      subject: 'Asignación de examen, Padel Track',
      text: '-',
      html: assignExamEmail,
    };

    sendEMail({ data: msg });

    return res.status(200).json({
      message: 'Questionnaire assigned successfully',
      coach: getCoach,
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

export const deleteQuestionnaire = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'deleteQuestionnaire' });
  req.logger.info({ status: 'start' });

  try {
    const idQuestionnaire = req.params.id;

    const getQuestionnaire = await ExamQuestionnaireMongoModel.findOne({ _id: idQuestionnaire });

    if (!getQuestionnaire) {
      return res.status(404).json({
        message: 'Questionnaire not found',
      });
    }

    await ExamQuestionnaireMongoModel.deleteOne({
      _id: getQuestionnaire,
    });
    await deleteVimeoVideo({ idVideoVimeo: getQuestionnaire.idVideoVimeo });

    return res.status(200).json({
      message: 'Questionnaire deleted successfully',
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
