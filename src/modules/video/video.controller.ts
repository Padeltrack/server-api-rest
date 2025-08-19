import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { VideoMongoModel } from './video.model';
import { CreateVideoSchemaZod } from './video.dto';
import {
  deleteVimeoVideo,
  getUrlTokenExtractVimeoVideoById,
  getVimeoVideoById,
  uploadVideoToVimeo,
} from '../vimeo/vimeo.helper';
import { planVideoFolder } from '../vimeo/viemo.constant';

export const getVideos = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'videos', serviceHandler: 'getVideos' });
  req.logger.info({ status: 'start' });

  try {
    const page = Number(req.query?.page) || 1;
    const limit = Number(req.query?.limit) || 10;
    const skip = (page - 1) * limit;

    const videos = await VideoMongoModel.find().skip(skip).limit(limit).sort({ createdAt: -1 });
    const videosLinks = await Promise.all(
      videos.map(async (video: any) => {
        if (video?.idVideoVimeo) {
          const getVideoVimeo = await getVimeoVideoById({ id: video.idVideoVimeo });
          const { thumbnail, linkVideo } = getUrlTokenExtractVimeoVideoById({
            videoVimeo: getVideoVimeo,
          });
          return {
            ...video._doc,
            thumbnail,
            linkVideo,
          };
        }
        return video._doc;
      }),
    );

    const count = await VideoMongoModel.countDocuments({});

    return res.status(200).json({ videos: videosLinks, count });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: 'Error getting videos' });
  }
};

export const getVideoById = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'videos', serviceHandler: 'getVideoById' });
  req.logger.info({ status: 'start' });

  try {
    const _id = req.params.id;

    if (!_id) {
      return res.status(400).json({ message: 'Video id is required' });
    }

    const video: any = await VideoMongoModel.findOne({ _id });

    if (video?.idVideoVimeo) {
      const getVideoVimeo = await getVimeoVideoById({ id: video.idVideoVimeo });
      const { thumbnail, linkVideo } = getUrlTokenExtractVimeoVideoById({
        videoVimeo: getVideoVimeo,
      });
      video._doc.thumbnail = thumbnail;
      video._doc.linkVideo = linkVideo;
    }

    return res.status(200).json({ video });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: 'Error getting video' });
  }
};

export const addVideo = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'videos', serviceHandler: 'addVideo' });
  req.logger.info({ status: 'start' });

  try {
    const videoData = CreateVideoSchemaZod.parse(req.body);

    if (!videoData.plan.length) {
      return res.status(400).json({
        message: 'Video plan is required',
      });
    }

    if (!videoData.semanas.length) {
      return res.status(400).json({
        message: 'Video semanas is required',
      });
    }

    const filePath = req.file?.path;

    if (!filePath) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result: any = await uploadVideoToVimeo({
      video: {
        filePath,
        name:
          videoData.nombre ||
          req.file?.originalname ||
          `Video subido desde la plataforma ${new Date().toISOString()}`,
        description: videoData.descripcion,
      },
      folderId: planVideoFolder,
      isPrivate: true,
    });

    await VideoMongoModel.create({
      _id: new ObjectId().toHexString(),
      ...videoData,
      plan: videoData.plan.split(',').map((plan) => plan.trim()),
      semanas: videoData.semanas.split(',').map((sem) => Number(sem.trim())),
      idVideoVimeo: result.uri.split('/').pop(),
    });

    return res.status(200).json({
      message: 'Video added successfully',
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: 'Error adding video' });
  }
};

export const updateFileVideo = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'videos', serviceHandler: 'updateFileVideo' });
  req.logger.info({ status: 'start' });

  try {
    const videoId = req.params.id;
    const filePath = req.file?.path;

    if (!videoId) {
      return res.status(400).json({ message: 'Video id is required' });
    }

    if (!filePath) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const getVideo = await VideoMongoModel.findOne({ _id: videoId });
    if (!getVideo) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (getVideo?.idVideoVimeo) {
      await deleteVimeoVideo({ idVideoVimeo: getVideo.idVideoVimeo });
    }

    const result: any = await uploadVideoToVimeo({
      video: {
        filePath,
        name:
          getVideo.nombre ||
          req.file?.originalname ||
          `Video subido desde la plataforma ${new Date().toISOString()}`,
        description: getVideo?.descripcion || '',
      },
      folderId: planVideoFolder,
      isPrivate: true,
    });

    await VideoMongoModel.updateOne(
      { _id: videoId },
      { idVideoVimeo: result.uri.split('/').pop() },
    );

    return res.status(200).json({
      message: 'Video updated successfully',
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: 'Error adding video' });
  }
};
