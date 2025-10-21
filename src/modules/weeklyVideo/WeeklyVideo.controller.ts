import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { ItemVideoWeekly, WeeklyVideoMongoModel } from './weeklyVideo.model';
import { VideoMongoModel } from '../video/video.model';
import { getUrlTokenExtractVimeoVideoById, getVimeoVideoById } from '../vimeo/vimeo.helper';
import { MarkCheckMeVideoSchemaZod } from './weeklyVideo.dto';
import { formatZodErrorResponse } from '../../shared/util/zod.util';

export const getWeeklyVideos = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'weeklyVideo', serviceHandler: 'getWeeklyVideos' });
  req.logger.info({ status: 'start' });

  try {
    const order = req.order;

    if (!order) {
      return res.status(404).json({
        message: req.t('orders.detail.notFound'),
      });
    }

    const weeklyVideo: any = await WeeklyVideoMongoModel.findOne({
      orderId: order._id,
      week: order.currentWeek,
    });

    if (!weeklyVideo) {
      return res.status(404).json({
        message: req.t('weeklyVideo.detail.notFound'),
      });
    }

    const weeklyVideoData = await Promise.all(
      weeklyVideo.videos.map(async (item: ItemVideoWeekly) => {
        const video = await VideoMongoModel.findOne({ _id: item.videoId }).lean();
        if (video) {
          const videoVimeo: any = await getVimeoVideoById({
            id: video.idVideoVimeo,
          });
          const { linkVideo, thumbnail } = getUrlTokenExtractVimeoVideoById({ videoVimeo });
          return {
            ...video,
            check: item?.check || false,
            thumbnail,
            linkVideo,
          };
        }

        return null;
      }),
    );

    weeklyVideo._doc.videos = weeklyVideoData.filter(video => video !== null);

    return res.status(200).json({
      weeklyVideo,
      message: req.t('weeklyVideo.list.loaded'),
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('weeklyVideo.list.error') });
  }
};

export const markCheckMeVideo = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'weeklyVideo', serviceHandler: 'markCheckMeVideo' });
  req.logger.info({ status: 'start' });

  try {
    const { videoId } = MarkCheckMeVideoSchemaZod.parse(req.body);
    const order = req.order;

    if (!order) {
      return res.status(404).json({
        message: req.t('orders.detail.notFound'),
      });
    }

    const weeklyVideo: any = await WeeklyVideoMongoModel.findOne(
      {
        orderId: order._id,
        week: order.currentWeek,
        'videos.videoId': videoId,
      },
      {
        _id: 0,
        videos: { $elemMatch: { videoId } },
      },
    );

    if (!weeklyVideo?.videos?.length) {
      return res.status(404).json({
        message: req.t('weeklyVideo.detail.notFound'),
      });
    }

    await WeeklyVideoMongoModel.updateOne(
      {
        orderId: order._id,
        week: order.currentWeek,
        'videos.videoId': videoId,
      },
      {
        $set: {
          'videos.$.check': weeklyVideo.videos[0]?.check ? false : true,
        },
      },
    );

    return res.status(200).json({
      message: req.t('weeklyVideo.check.success'),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json(formatZodErrorResponse(error, req.t));
    }
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: req.t('weeklyVideo.check.error') });
  }
};
