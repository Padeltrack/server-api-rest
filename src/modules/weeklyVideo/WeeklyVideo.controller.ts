import { Request, Response } from 'express';
import { WeeklyVideoMongoModel } from './weeklyVideo.model';
import { VideoMongoModel } from '../video/video.model';
import { getUrlTokenExtractVimeoVideoById, getVimeoVideoById } from '../vimeo/vimeo.helper';

export const getWeeklyVideos = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'weeklyVideo', serviceHandler: 'getWeeklyVideos' });
  req.logger.info({ status: 'start' });

  try {
    const order = req.order;

    if (!order) {
      return res.status(404).json({
        message: 'Order not found',
      });
    }

    const weeklyVideo: any = await WeeklyVideoMongoModel.findOne({
      orderId: order._id,
      week: order.currentWeek,
    });

    if (!weeklyVideo) {
      return res.status(404).json({
        message: 'Weekly video not found',
      });
    }

    const weeklyVideoData = await Promise.all(
      weeklyVideo.videos.map(async (videoId: string) => {
        const video = await VideoMongoModel.findOne({ _id: videoId });
        if (video) {
          const videoVimeo: any = await getVimeoVideoById({
            id: video.idVideoVimeo,
          });
          const { linkVideo, thumbnail } = getUrlTokenExtractVimeoVideoById({ videoVimeo });
          return {
            _id: video._id,
            nombre: video.nombre,
            descripcion: video.descripcion,
            thumbnail,
            linkVideo,
          };
        }

        return null;
      }),
    );

    weeklyVideo._doc.videos = weeklyVideoData.filter(video => video !== null);

    return res.status(200).json({ weeklyVideo });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error fetching weeklyVideo' });
  }
};
