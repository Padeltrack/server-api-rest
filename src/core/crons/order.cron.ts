import cron from 'node-cron';
import { ObjectId } from 'mongodb';
import LoggerColor from 'node-color-log';
import { OrderMongoModel, SelectStatusOrderModel } from '../../modules/order/order.model';
import { WeeklyVideoMongoModel } from '../../modules/weeklyVideo/weeklyVideo.model';
import { getVideosByWeek } from '../../modules/weeklyVideo/weeklyVideo.model.helper';

function daysBetween(fecha1: Date, fecha2: Date) {
  return Math.floor((fecha2.getTime() - fecha1.getTime()) / (1000 * 60 * 60 * 24));
}

const cronOrderProgressWeek = async () => {
    LoggerColor.log('⏳ Ejecutando cron de progreso de videos...');
    try {
        const progresos = await OrderMongoModel.find({ status: SelectStatusOrderModel.Approved, currentWeek: { $exists: true }, lastProgressDate: { $exists: true } });

        for (const progress of progresos) {
            if (progress?.currentWeek && progress?.lastProgressDate) {
                const days = daysBetween(progress.lastProgressDate, new Date());

                if (days >= 7) {
                    const semanasAvance = Math.floor(days / 7);
                    progress.currentWeek += semanasAvance;
                    progress.lastProgressDate = new Date();
                    await progress.save();

                    const week = progress.currentWeek;
                    await WeeklyVideoMongoModel.create({
                        _id: new ObjectId().toHexString(),
                        orderId: progress._id,
                        week,
                        videos: await getVideosByWeek({ week }),
                    });

                    LoggerColor.bold().log(`📅 Usuario ${progress.userId} avanzó ${semanasAvance} semanas → Semana actual: ${progress.currentWeek}`);
                }
            }
        }
    } catch (err) {
        LoggerColor.error('❌ Error en cron de videos:', err);
    }
}

export const cronOrder = () => {
    cron.schedule('0 0 * * *', () => {
        cronOrderProgressWeek();
    });
}
