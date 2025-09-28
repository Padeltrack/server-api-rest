import { Request, Response } from 'express';
import { ItemVideoWeekly, WeeklyVideoMongoModel } from './weeklyVideo.model';
import { VideoMongoModel } from '../video/video.model';
import { getUrlTokenExtractVimeoVideoById, getVimeoVideoById } from '../vimeo/vimeo.helper';
import { MarkCheckMeVideoSchemaZod } from './weeklyVideo.dto';

export const getWeeklyVideos = async (req: Request, res: Response) => {
  req.logger = req.logger.child({ service: 'weeklyVideo', serviceHandler: 'getWeeklyVideos' });
  req.logger.info({ status: 'start' });

  try {
    const order = req.order;

    if (!order) {
      return res.status(404).json({
        message: 'Pedido no encontrado',
      });
    }

    const weeklyVideo: any = await WeeklyVideoMongoModel.findOne({
      orderId: order._id,
      week: order.currentWeek,
    });

    if (!weeklyVideo) {
      return res.status(404).json({
        message: 'Vídeo semanal no encontrado',
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

    return res.status(200).json({ weeklyVideo });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res.status(500).json({ message: 'Error al obtener el vídeo semanal' });
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
        message: 'Pedido no encontrado',
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
        message: 'Vídeo semanal no encontrado',
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
      message: 'La verificación de video semanal se actualizó correctamente',
    });
  } catch (error) {
    req.logger.error({ status: 'error', code: 500, error: error.message });
    return res
      .status(500)
      .json({ message: 'Error al actualizar la verificación de video semanal' });
  }
};
