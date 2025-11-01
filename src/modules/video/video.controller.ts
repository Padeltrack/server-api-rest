import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { ZodError } from 'zod';
import { VideoMongoModel } from './video.model';
import { CreateVideoSchemaZod, UpdateVideoSchemaZod } from './video.dto';
import {
  deleteVimeoVideo,
  extractBufferToFileThumbnail,
  getUrlTokenExtractVimeoVideoById,
  getVimeoVideoById,
  setThumbnailToVimeo,
  updateVideoToVimeo,
  uploadVideoToVimeo,
} from '../vimeo/vimeo.helper';
import { planVideoFolder } from '../vimeo/viemo.constant';
import { cleanUploadedFiles } from '../../middleware/multer.middleware';
import { formatZodErrorResponse } from '../../shared/util/zod.util';
import {
  getRequestLanguage,
  transformTranslatedDocument,
} from '../../middleware/translation.middleware';

export const getVideos = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'videos', serviceHandler: 'getVideos' });
  req.logger.info({ status: 'start' });

  try {
    const page = Number(req.query?.page) || 1;
    const limit = Number(req.query?.limit) || 150;
    const skip = (page - 1) * limit;
    const search = req.query?.search || '';
    let weeks = (req.query?.weeks as string) || '';
    const language = getRequestLanguage(req);

    let numberWeeks: number[] = [];
    if (weeks) numberWeeks = weeks.split(',').map(Number);

    const query: any = {};

    if (numberWeeks.length) {
      query.semanas = { $in: numberWeeks };
    }

    if (search) {
      const pathTranslate = `translate.${language}`;
      query.$or = [
        { [`${pathTranslate}.nombre`]: { $regex: search, $options: 'i' } },
        { [`${pathTranslate}.descripcion`]: { $regex: search, $options: 'i' } },
        { [`${pathTranslate}.objetivos`]: { $regex: search, $options: 'i' } },
        { [`${pathTranslate}.momentoDeUso`]: { $regex: search, $options: 'i' } },
        { [`${pathTranslate}.contraccion`]: { $regex: search, $options: 'i' } },
        { [`${pathTranslate}.tipoEstimulo`]: { $regex: search, $options: 'i' } },
        { [`${pathTranslate}.musculos`]: { $regex: search, $options: 'i' } },
        { [`${pathTranslate}.sistemaControl`]: { $regex: search, $options: 'i' } },
        { [`${pathTranslate}.material`]: { $regex: search, $options: 'i' } },
        { [`${pathTranslate}.observacion`]: { $regex: search, $options: 'i' } },
        { [`${pathTranslate}.recomendaciones`]: { $regex: search, $options: 'i' } },
      ];
    }

    const count = await VideoMongoModel.countDocuments(query);
    const videos = await VideoMongoModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const videosLinks = await Promise.all(
      videos.map(async (video: any) => {
        if (video?.idVideoVimeo) {
          const getVideoVimeo = await getVimeoVideoById({ id: video.idVideoVimeo });
          const { thumbnail, linkVideo } = getUrlTokenExtractVimeoVideoById({
            videoVimeo: getVideoVimeo,
          });
          return {
            ...video,
            thumbnail,
            linkVideo,
          };
        }
        return {
          ...video,
          thumbnail: 'https://placehold.co/600x400?text=video%20not%20found',
          linkVideo: '#',
        };
      }),
    );

    return res.status(200).json({ videos: videosLinks, count });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: req.t('videos.list.error') });
  }
};

export const getVideoById = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'videos', serviceHandler: 'getVideoById' });
  req.logger.info({ status: 'start' });

  try {
    const _id = req.params.id;
    const language = getRequestLanguage(req);

    if (!_id) {
      return res.status(400).json({ message: req.t('videos.validation.idRequired') });
    }

    const video: any = await VideoMongoModel.findOne({ _id }).lean();

    if (video?.idVideoVimeo) {
      const getVideoVimeo = await getVimeoVideoById({ id: video.idVideoVimeo });
      const { thumbnail, linkVideo } = getUrlTokenExtractVimeoVideoById({
        videoVimeo: getVideoVimeo,
      });
      video.thumbnail = thumbnail;
      video.linkVideo = linkVideo;
    }

    return res.status(200).json({ video: transformTranslatedDocument(video, language) });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: req.t('videos.detail.error') });
  }
};

export const addVideo = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'videos', serviceHandler: 'addVideo' });
  req.logger.info({ status: 'start' });

  try {
    const parseBody = {
      ...req.body,
      semanas: JSON.parse(req.body?.semanas || '[]'),
      plan: JSON.parse(req.body?.plan || '[]'),
    };
    const videoData = CreateVideoSchemaZod.parse(parseBody);

    if (!videoData.plan.length) {
      return res.status(400).json({
        message: req.t('videos.validation.planRequired'),
      });
    }

    if (!videoData.semanas.length) {
      return res.status(400).json({
        message: req.t('videos.validation.weeksRequired'),
      });
    }

    const filePath = req.file?.path;

    if (!filePath) {
      return res.status(400).json({ message: req.t('videos.validation.fileRequired') });
    }

    const language = getRequestLanguage(req);
    const {
      nombre,
      descripcion,
      nivelFisico,
      objetivos,
      momentoDeUso,
      contraccion,
      tipoEstimulo,
      zonaCuerpo,
      musculos,
      sistemaControl,
      series,
      repeticiones,
      areaContenido,
      zonaPista,
      tipoGolpe,
      nivelJuego,
      espacio,
      material,
      formato,
      observacion,
      recomendaciones,
      plan,
      semanas,
    } = videoData;

    const result: any = await uploadVideoToVimeo({
      video: {
        filePath,
        name:
          nombre ||
          req.file?.originalname ||
          `Video subido desde la plataforma ${new Date().toISOString()}`,
        description: descripcion,
      },
      folderId: planVideoFolder,
      isPrivate: true,
    });

    const translationData = {
      [language]: {
        nombre: nombre || '',
        descripcion: descripcion || '',
        nivelFisico: nivelFisico || '',
        objetivos: objetivos || '',
        momentoDeUso: momentoDeUso || '',
        contraccion: contraccion || '',
        tipoEstimulo: tipoEstimulo || '',
        zonaCuerpo: zonaCuerpo || '',
        musculos: musculos || '',
        sistemaControl: sistemaControl || '',
        series: series || '',
        repeticiones: repeticiones || '',
        areaContenido: areaContenido || '',
        zonaPista: zonaPista || '',
        tipoGolpe: tipoGolpe || '',
        nivelJuego: nivelJuego || '',
        espacio: espacio || '',
        material: material || '',
        formato: formato || '',
        observacion: observacion || '',
        recomendaciones: recomendaciones || '',
      },
    };

    await VideoMongoModel.create({
      _id: new ObjectId().toHexString(),
      idVideoVimeo: result.uri.split('/').pop(),
      plan,
      semanas,
      translate: translationData,
    });

    return res.status(200).json({
      message: req.t('videos.upload.success'),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(formatZodErrorResponse(error, req.t));
    }
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: req.t('videos.upload.error') });
  }
};

export const updateFileVideo = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'videos', serviceHandler: 'updateFileVideo' });
  req.logger.info({ status: 'start' });

  try {
    const videoId = req.params.id;
    const videoFile = (req.files as any)?.upload_video?.[0];
    const videoPath = videoFile?.path;

    if (!videoId) {
      return res.status(400).json({ message: req.t('videos.validation.idRequired') });
    }

    const getVideo = await VideoMongoModel.findOne({ _id: videoId });
    if (!getVideo) {
      return res.status(404).json({ message: req.t('videos.detail.notFound') });
    }
    const idVideoVimeo = getVideo?.idVideoVimeo;

    const thumbnailBuffer = await extractBufferToFileThumbnail(req);
    if (!videoPath && thumbnailBuffer) {
      await setThumbnailToVimeo({ idVideoVimeo, thumbnailBuffer });
      return res.status(200).json({
        message: req.t('videos.update.portalImageSuccess'),
      });
    }

    if (!videoPath) {
      return res.status(400).json({ message: req.t('videos.validation.fileRequired') });
    }

    if (idVideoVimeo) {
      await deleteVimeoVideo({ idVideoVimeo });
    }

    const language = getRequestLanguage(req);
    const translate = getVideo.translate as any;
    const nameVideo =
      translate?.[language]?.nombre ||
      translate?.es?.nombre ||
      req.file?.originalname ||
      `Video subido desde la plataforma ${new Date().toISOString()}`;
    const result: any = await uploadVideoToVimeo({
      video: {
        filePath: videoPath,
        name: nameVideo,
        description: translate?.[language]?.descripcion || translate?.es?.descripcion || '',
      },
      folderId: planVideoFolder,
      isPrivate: true,
    });

    await VideoMongoModel.updateOne(
      { _id: videoId },
      { idVideoVimeo: result.uri.split('/').pop() },
    );

    return res.status(200).json({
      message: req.t('videos.update.success'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: req.t('videos.update.error') });
  }
};

export const updateVideo = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'videos', serviceHandler: 'updateVideo' });
  req.logger.info({ status: 'start' });

  try {
    const videoId = req.params.id;
    const parseBody = {
      ...req.body,
      semanas: JSON.parse(req.body?.semanas || '[]'),
      plan: JSON.parse(req.body?.plan || '[]'),
    };
    const videoData = UpdateVideoSchemaZod.parse(parseBody);
    const language = getRequestLanguage(req);

    if (!videoId) {
      return res.status(400).json({
        message: 'Se requiere identificación de video',
      });
    }

    const getVideo = await VideoMongoModel.findOne({ _id: videoId }).lean();
    if (!getVideo) {
      return res.status(404).json({
        message: 'Vídeo no encontrado',
      });
    }

    const videoFile = (req.files as any)?.upload_video?.[0];
    const videoPath = videoFile?.path;
    const thumbnailBuffer = await extractBufferToFileThumbnail(req);

    const idVideoVimeo = getVideo?.idVideoVimeo;
    const fields: any = {};

    if (videoData.plan) fields['plan'] = videoData.plan;
    if (videoData.semanas) fields['semanas'] = videoData.semanas;

    const pathTranslate = `translate.${language}`;

    const {
      nombre,
      descripcion,
      nivelFisico,
      objetivos,
      momentoDeUso,
      contraccion,
      tipoEstimulo,
      zonaCuerpo,
      musculos,
      sistemaControl,
      series,
      repeticiones,
      areaContenido,
      zonaPista,
      tipoGolpe,
      nivelJuego,
      espacio,
      material,
      formato,
      observacion,
      recomendaciones,
    } = videoData;

    if (nombre) fields[`${pathTranslate}.nombre`] = nombre;
    if (descripcion) fields[`${pathTranslate}.descripcion`] = descripcion;
    if (nivelFisico) fields[`${pathTranslate}.nivelFisico`] = nivelFisico;
    if (objetivos) fields[`${pathTranslate}.objetivos`] = objetivos;
    if (momentoDeUso) fields[`${pathTranslate}.momentoDeUso`] = momentoDeUso;
    if (contraccion) fields[`${pathTranslate}.contraccion`] = contraccion;
    if (tipoEstimulo) fields[`${pathTranslate}.tipoEstimulo`] = tipoEstimulo;
    if (zonaCuerpo) fields[`${pathTranslate}.zonaCuerpo`] = zonaCuerpo;
    if (musculos) fields[`${pathTranslate}.musculos`] = musculos;
    if (sistemaControl) fields[`${pathTranslate}.sistemaControl`] = sistemaControl;
    if (series) fields[`${pathTranslate}.series`] = series;
    if (repeticiones) fields[`${pathTranslate}.repeticiones`] = repeticiones;
    if (areaContenido) fields[`${pathTranslate}.areaContenido`] = areaContenido;
    if (zonaPista) fields[`${pathTranslate}.zonaPista`] = zonaPista;
    if (tipoGolpe) fields[`${pathTranslate}.tipoGolpe`] = tipoGolpe;
    if (nivelJuego) fields[`${pathTranslate}.nivelJuego`] = nivelJuego;
    if (espacio) fields[`${pathTranslate}.espacio`] = espacio;
    if (material) fields[`${pathTranslate}.material`] = material;
    if (formato) fields[`${pathTranslate}.formato`] = formato;
    if (observacion) fields[`${pathTranslate}.observacion`] = observacion;
    if (recomendaciones) fields[`${pathTranslate}.recomendaciones`] = recomendaciones;

    const translate = getVideo.translate as any;
    const oldNombre = translate?.[language]?.nombre || translate?.es?.nombre;
    const oldDescripcion = translate?.[language]?.descripcion || translate?.es?.descripcion;
    const isChangeName = nombre && nombre !== oldNombre;
    const isChangeDesc = descripcion && descripcion !== oldDescripcion;
    const isUpdatedVimeo = isChangeName || isChangeDesc || videoPath || thumbnailBuffer;

    if (!videoPath && thumbnailBuffer) {
      await setThumbnailToVimeo({ idVideoVimeo, thumbnailBuffer });
    } else if (idVideoVimeo && isUpdatedVimeo) {
      const nameToUse = nombre || oldNombre;
      const descToUse = descripcion !== undefined ? descripcion : oldDescripcion;
      await updateVideoToVimeo({
        idVideoVimeo,
        filePath: videoPath,
        thumbnailBuffer,
        name: nameToUse,
        description: descToUse,
      });
    }

    await cleanUploadedFiles(req);

    const video = await VideoMongoModel.findOneAndUpdate(
      { _id: videoId },
      { $set: fields },
      { new: true },
    ).lean();

    return res.status(200).json({
      message: req.t('videos.update.success'),
      video: video ? transformTranslatedDocument(video, language) : null,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(formatZodErrorResponse(error, req.t));
    }
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: req.t('videos.update.error') });
  }
};

export const deleteVideo = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'videos', serviceHandler: 'deleteVideo' });
  req.logger.info({ status: 'start' });

  try {
    const videoId = req.params.id;

    if (!videoId) {
      return res.status(400).json({
        message: 'Se requiere identificación de video',
      });
    }

    const getVideo = await VideoMongoModel.findOne({ _id: videoId });
    if (!getVideo) {
      return res.status(404).json({
        message: 'Vídeo no encontrado',
      });
    }

    if (getVideo?.idVideoVimeo) {
      await deleteVimeoVideo({ idVideoVimeo: getVideo.idVideoVimeo });
    }

    await VideoMongoModel.deleteOne({ _id: videoId });

    return res.status(200).json({
      message: 'Vídeo eliminado correctamente',
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: 'Error al eliminar el vídeo' });
  }
};
