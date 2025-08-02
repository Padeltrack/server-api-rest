import { Request, Response } from 'express';
import { VideoMongoModel } from './video.model';

export const getVideos = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'videos', serviceHandler: 'getVideos' });
  req.logger.info({ status: 'start' });

  try {
    const page = Number(req.query?.page) || 1;
    const limit = Number(req.query?.limit) || 10;
    const skip = (page - 1) * limit;

    const videos = await VideoMongoModel.find().skip(skip).limit(limit).sort({ createdAt: -1 });
    return res.status(200).json({ videos });
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

    const video = await VideoMongoModel.findOne({ _id });
    return res.status(200).json({ video });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(401).json({ message: 'Error getting video' });
  }
};
