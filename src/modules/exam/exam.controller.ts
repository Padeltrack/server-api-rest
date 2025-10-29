import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { ExamQuestionnaireMongoModel } from './exam.model';
import { ExamAnswerMongoModel, SelectStatusAnswerModel } from './exam-answer.model';
import {
  addQuestionnaireSchemaZod,
  AssignExamToCoachSchemaZod,
  ExamAnswerRegisterSchemaZod,
  ExamGradeRegisterSchemaZod,
  updateQuestionnaireSchemaZod,
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
  extractBufferToFileThumbnail,
  getUrlTokenExtractVimeoVideoById,
  getVimeoVideoById,
  setThumbnailToVimeo,
  updateVideoToVimeo,
  uploadVideoToVimeo,
} from '../vimeo/vimeo.helper';
import { examAnswerStudentFolder, examFolder } from '../vimeo/viemo.constant';
import { sendEMail } from '../mail/sendTemplate.mail';
import { HOST_CLIENT_ADMIN_PROD } from '../../shared/util/url.util';
import { generateEmail } from '../mail/loadTemplate.mail';
import { cleanUploadedFiles } from '../../middleware/multer.middleware';
import {
  getRequestLanguage,
  transformTranslatedDocument,
} from '../../middleware/translation.middleware';
import { WeeklyVideoMongoModel } from '../weeklyVideo/weeklyVideo.model';
import { getVideosByWeek } from '../weeklyVideo/weeklyVideo.model.helper';
import { CounterMongoModel } from '../counter/counter.model';
import { OrderMongoModel, SelectStatusOrderModel } from '../order/order.model';

export const getQuestionnaireExam = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'getQuestionnaireExam' });
  req.logger.info({ status: 'start' });

  try {
    const getQuestionnaires = await ExamQuestionnaireMongoModel.find().sort({ order: 1 }).lean();
    const questionnaires = await Promise.all(
      getQuestionnaires.map(async (q: any) => {
        try {
          const videoVimeo: any = await getVimeoVideoById({ id: q.idVideoVimeo });
          const { linkVideo, thumbnail } = getUrlTokenExtractVimeoVideoById({ videoVimeo });
          console.log('linkVideo ', linkVideo);
          console.log('thumbnail ', thumbnail);
          return {
            ...q,
            linkVideo,
            thumbnail,
          };
        } catch (error) {
          console.error(`Error fetching video ${q.idVideoVimeo}:`, error);
          return {
            ...q,
            linkVideo: null,
            thumbnail: null,
          };
        }
      }),
    );

    return res.status(200).json({ questionnaires });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('exams.list.error'), error });
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
    return res.status(500).json({ message: req.t('exams.answers.list.error'), error });
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
        message: req.t('exams.answers.notFound'),
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
    return res.status(500).json({ message: req.t('exams.answers.getById.error'), error });
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
        message: req.t('exams.answers.notEnrolled'),
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
    return res.status(500).json({ message: req.t('exams.answers.getById.error'), error });
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
    const language = getRequestLanguage(req);

    if (me.level) {
      return res.status(401).json({
        message: req.t('exams.alreadyCompleted'),
      });
    }
    let isComplete = false;

    const getExistQuestionExam = await ExamQuestionnaireMongoModel.exists({ _id: questionnaireId });
    if (!getExistQuestionExam) {
      return res.status(404).json({ message: req.t('exams.question.notFound') });
    }

    const currentExam = await ExamAnswerMongoModel.findOne({ userId }).sort({ createdAt: -1 });

    if (currentExam && currentExam.status !== SelectStatusAnswerModel.Pendiente) {
      return res.status(400).json({
        message: req.t('exams.alreadyCompleted'),
        isComplete: true,
      });
    }

    if (!filePath) {
      return res.status(400).json({ message: req.t('exams.question.fileRequired') });
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
        message: req.t('exams.answers.register.success'),
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

      // NOTIFICATION ADMIN

      const notificationAdminEmail = await generateEmail({
        template: 'newExamAdmin',
        language,
        variables: {
          displayName: 'Administrador',
          examId: currentExam._id,
          submittedAt: new Date().toLocaleString(),
          studentName: me.displayName,
          assignExamLink: `${HOST_CLIENT_ADMIN_PROD}/exams/${currentExam._id}`,
        },
      });

      const msgAdmin = {
        from: `${process.env.NODE_MAILER_ROOT_EMAIL}`,
        to: `${process.env.NODE_MAILER_ROOT_EMAIL}`,
        subject: req.t('emails.subjects.newExamAdmin'),
        text: '-',
        html: notificationAdminEmail,
      };

      sendEMail({ data: msgAdmin });
    }

    return res.status(200).json({
      message: req.t('exams.answers.register.success'),
      isComplete,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: req.t('exams.validation.error'),
        issues: error.errors,
      });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('exams.answer.error'), error });
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
        message: req.t('exams.alreadyCompleted'),
      });
    }
    let isComplete = false;
    const currentExam = await ExamAnswerMongoModel.findOne({ userId }).sort({ createdAt: -1 });

    if (!currentExam) {
      return res.status(404).json({
        message: req.t('exams.notFound'),
      });
    }

    if (currentExam.status !== SelectStatusAnswerModel.Pendiente) {
      return res.status(400).json({
        message: req.t('exams.alreadyCompleted'),
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
        message: req.t('exams.notCompleted'),
        isComplete: false,
      });
    }

    return res.status(200).json({
      message: req.t('exams.answers.finalize.success'),
      isComplete,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: req.t('exams.validation.error'),
        issues: error.errors,
      });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('exams.answers.register.error'), error });
  }
};

export const addQuestionnaire = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'addQuestionnaire' });
  req.logger.info({ status: 'start' });

  try {
    const { title, description } = addQuestionnaireSchemaZod.parse(req.body);
    const filePath = req.file?.path;
    const language = getRequestLanguage(req);

    if (!filePath) {
      return res.status(400).json({ message: req.t('exams.question.fileRequired') });
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

    // Crear el cuestionario con el nuevo esquema de traducciones
    const questionnaireData = {
      _id: new ObjectId().toHexString(),
      idVideoVimeo,
      order: nextOrder,
      translate: {
        es: { title: '', description: '' },
        en: { title: '', description: '' },
        pt: { title: '', description: '' },
        [language]: { title, description },
      },
    };

    await ExamQuestionnaireMongoModel.create(questionnaireData);

    return res.status(200).json({
      message: req.t('exams.questionnaire.add.success'),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: req.t('exams.validation.error'),
        issues: error.errors,
      });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('exams.answers.register.error'), error });
  }
};

export const registerGradeExam = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'registerGradeExam' });
  req.logger.info({ status: 'start' });

  try {
    const me = req.user;
    const { examAnswerId, answers } = ExamGradeRegisterSchemaZod.parse(req.body);
    const language = getRequestLanguage(req);

    const getExamAnswer = await ExamAnswerMongoModel.findOne({ _id: examAnswerId });

    if (!getExamAnswer) {
      return res.status(404).json({
        message: req.t('exams.answers.notFound'),
      });
    }

    if (me._id !== getExamAnswer?.assignCoachId) {
      return res.status(403).json({
        message: req.t('exams.forbidden'),
      });
    }

    if (getExamAnswer.status !== SelectStatusAnswerModel.Revision) {
      return res.status(400).json({
        message: req.t('exams.answers.notFound'),
      });
    }

    if (!answers.length) {
      return res.status(404).json({
        message: req.t('exams.answers.notFoundInList'),
      });
    }

    if (getExamAnswer.answers.length !== answers.length) {
      return res.status(400).json({
        message: req.t('exams.answers.countMismatch'),
      });
    }

    const getUser = await UserMongoModel.findOne({ _id: getExamAnswer.userId });
    if (!getUser) {
      return res.status(404).json({
        message: req.t('exams.user.notFound'),
      });
    }

    const getOrder = await OrderMongoModel.findOne({
      userId: getUser._id,
      status: SelectStatusOrderModel.Approved,
      currentWeek: { $exists: false },
    })
      .sort({ createdAt: -1 })
      .select('_id');
    if (!getOrder) {
      return res.status(404).json({
        message: req.t('exams.order.notFound'),
      });
    }

    const updatedAnswers = getExamAnswer.answers.map((answer: any) => {
      const match = answers.find(a => a.questionnaireId === answer.questionnaireId);
      return match ? { ...answer._doc, score: match.score } : answer;
    });

    if (updatedAnswers.length !== answers.length) {
      return res.status(400).json({
        message: req.t('exams.answers.countMismatch'),
      });
    }

    const average = parseFloat(
      (answers.reduce((sum, a) => sum + (a.score || 0), 0) / (answers.length || 1)).toFixed(2),
    );

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
    let levelUser: UserLevelModel = SelectUserLevelModel.Basico;
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

    // UPDATE ORDER
    let fieldsUpdated: any = { currentWeek: 1 };

    const lastOrderApproved = await OrderMongoModel.findOne(
      {
        userId: getUser._id,
        status: SelectStatusOrderModel.Approved,
        currentWeek: { $exists: true },
      },
      { sort: { createdAt: -1 } },
    ).select('currentWeek');

    if (lastOrderApproved?.currentWeek) {
      fieldsUpdated.currentWeek = lastOrderApproved.currentWeek + 1;
    }

    fieldsUpdated.approvedOrderDate = new Date();
    fieldsUpdated.lastProgressDate = new Date();

    await OrderMongoModel.updateOne({ _id: getOrder._id }, { $set: fieldsUpdated });

    // GENERATE WEEK VIDEOS

    const getLimitVideoWeek = await CounterMongoModel.findOne({ _id: 'limitVideoWeek' });
    const week = fieldsUpdated.currentWeek;
    const videosByWeek = await getVideosByWeek({
      week,
      levelUser,
      maxVideo: getLimitVideoWeek?.seq,
    });

    await WeeklyVideoMongoModel.create({
      _id: new ObjectId().toHexString(),
      orderId: getOrder._id,
      week,
      videos: videosByWeek.map(videoId => ({ videoId, check: false })),
    });

    // SEND EMAIL TO STUDENT

    const examGradeEmail = await generateEmail({
      template: 'examGradeStudent',
      language,
      variables: {
        average: `${average}`,
        studentName: getUser.displayName,
      },
    });

    const msg = {
      from: `${process.env.NODE_MAILER_ROOT_EMAIL}`,
      to: getUser.email,
      subject: req.t('emails.subjects.examGradeStudent'),
      text: '-',
      html: examGradeEmail,
    };

    sendEMail({ data: msg });

    return res.status(200).json({
      message: req.t('exams.grade.register.success'),
      updatedAnswers,
      levelUser,
      average,
      status: SelectStatusAnswerModel.Completado,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: req.t('exams.validation.error'),
        issues: error.errors,
      });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('exams.answers.register.error'), error });
  }
};

export const assignExamToCoach = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'assignExam' });
  req.logger.info({ status: 'start' });

  try {
    const { examAnswerId, coachId } = AssignExamToCoachSchemaZod.parse(req.body);
    const language = getRequestLanguage(req);

    const getExamAnswer = await ExamAnswerMongoModel.findOne({ _id: examAnswerId });
    if (!getExamAnswer) {
      return res.status(404).json({
        message: req.t('exams.answers.notFoundById'),
      });
    }

    const getUser = await UserMongoModel.findOne({ _id: getExamAnswer.userId });
    if (!getUser) {
      return res.status(404).json({
        message: req.t('exams.user.notFound'),
      });
    }

    if (coachId === getUser._id) {
      return res.status(400).json({
        message: req.t('exams.cannotAssignSelf'),
      });
    }

    if (
      ![SelectStatusAnswerModel.Pendiente, SelectStatusAnswerModel.Revision].includes(
        getExamAnswer.status as any,
      )
    ) {
      return res.status(400).json({
        message: req.t('exams.answers.invalidState'),
      });
    }

    const getCoach = await UserMongoModel.findOne({ _id: coachId });
    if (!getCoach) {
      return res.status(404).json({
        message: req.t('exams.coach.notFound'),
      });
    }

    await ExamAnswerMongoModel.updateOne(
      { _id: examAnswerId },
      { $set: { assignCoachId: coachId } },
    );

    const assignExamEmail = await generateEmail({
      template: 'assignCoachExam',
      language,
      variables: {
        professorName: getCoach.displayName,
        studentName: getUser.displayName,
        subject: req.t('emails.subjects.subjectAssignCoachExam'),
        status: 'En Revision',
        reviewLink: `${HOST_CLIENT_ADMIN_PROD}/exams/${examAnswerId}`,
      },
    });

    const msg = {
      from: `${process.env.NODE_MAILER_ROOT_EMAIL}`,
      to: getCoach.email,
      subject: req.t('emails.subjects.assignCoachExam'),
      text: '-',
      html: assignExamEmail,
    };

    sendEMail({ data: msg });

    // students

    const notifyStudentAssignExamEmail = await generateEmail({
      template: 'notifyStudentAssignCoachExam',
      language,
      variables: {
        coachName: getCoach.displayName,
        studentName: getUser.displayName,
        reviewHours: '48',
        examTitle: req.t('emails.subjects.subjectAssignCoachExam'),
        supportEmail: 'padeltrackhub@gmail.com',
      },
    });

    const msgStudent = {
      from: `${process.env.NODE_MAILER_ROOT_EMAIL}`,
      to: getUser.email,
      subject: req.t('emails.subjects.notifyStudentAssignCoachExam'),
      text: '-',
      html: notifyStudentAssignExamEmail,
    };

    sendEMail({ data: msgStudent });

    return res.status(200).json({
      message: req.t('exams.questionnaire.assign.success'),
      coach: getCoach,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: req.t('exams.validation.error'),
        issues: error.errors,
      });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('exams.answers.register.error'), error });
  }
};

export const updateQuestionnaire = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'exam', serviceHandler: 'updateQuestionnaire' });
  req.logger.info({ status: 'start' });

  try {
    const { title, description } = updateQuestionnaireSchemaZod.parse(req.body);
    const idQuestionnaire = req.params.id as string;
    const language = getRequestLanguage(req);
    const updateFields: any = {};
    let questionnaire: any = {};

    if (!idQuestionnaire) {
      return res.status(400).json({
        message: req.t('exams.videoId.required'),
      });
    }

    const getQuestionnaire = await ExamQuestionnaireMongoModel.findOne({ _id: idQuestionnaire });
    if (!getQuestionnaire) {
      return res.status(404).json({
        message: req.t('exams.questionnaire.notFound'),
      });
    }

    const videoFile = (req.files as any)?.upload_video?.[0];
    const videoPath = videoFile?.path;
    const thumbnailBuffer = await extractBufferToFileThumbnail(req);

    const idVideoVimeo = getQuestionnaire.idVideoVimeo;

    if (!videoPath && thumbnailBuffer) {
      await setThumbnailToVimeo({ idVideoVimeo, thumbnailBuffer });
    } else if (videoPath) {
      await updateVideoToVimeo({
        idVideoVimeo,
        filePath: videoPath,
        thumbnailBuffer,
      });
      await cleanUploadedFiles(req);
    }

    if (title || description) {
      const pathTranslate = `translate.${language}`;
      if (title) updateFields[`${pathTranslate}.title`] = title;
      if (description) updateFields[`${pathTranslate}.description`] = description;
    }

    if (Object.keys(updateFields).length) {
      questionnaire = await ExamQuestionnaireMongoModel.findOneAndUpdate(
        { _id: idQuestionnaire },
        {
          $set: updateFields,
        },
        { new: true },
      ).lean();
    }

    res.status(200).json({
      message: req.t('exams.questionnaire.update.success'),
      questionnaire: transformTranslatedDocument(questionnaire, language),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: req.t('exams.validation.error'),
        issues: error.errors,
      });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('exams.answer.updateError'), error });
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
        message: req.t('exams.questionnaire.notFound'),
      });
    }

    await ExamQuestionnaireMongoModel.deleteOne({
      _id: getQuestionnaire,
    });
    await deleteVimeoVideo({ idVideoVimeo: getQuestionnaire.idVideoVimeo });

    return res.status(200).json({
      message: req.t('exams.questionnaire.delete.success'),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: req.t('exams.validation.error'),
        issues: error.errors,
      });
    }

    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('exams.answer.deleteError'), error });
  }
};
