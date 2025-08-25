import cron from 'node-cron';
import { ObjectId } from 'mongodb';
import LoggerColor from 'node-color-log';
import { OrderMongoModel, SelectStatusOrderModel } from '../../modules/order/order.model';
import { WeeklyVideoMongoModel } from '../../modules/weeklyVideo/weeklyVideo.model';
import { getVideosByWeek } from '../../modules/weeklyVideo/weeklyVideo.model.helper';
import { IPlanModel, PlanMongoModel, SelectDaysActiveModel } from '../../modules/plan/plan.model';
import { generateEmail } from '../../modules/mail/loadTemplate.mail';
import { sendEMail } from '../../modules/mail/sendTemplate.mail';
import { UserModel, UserMongoModel } from '../../modules/user/user.model';

function daysBetween(fecha1: Date, fecha2: Date) {
  return Math.floor((fecha2.getTime() - fecha1.getTime()) / (1000 * 60 * 60 * 24));
}

const cronOrderProgressWeek = async () => {
  LoggerColor.log('⏳ Ejecutando cron de progreso de videos...');
  try {
    const progresos = await OrderMongoModel.find({
      status: SelectStatusOrderModel.Approved,
      isCoach: false,
      currentWeek: { $exists: true },
      lastProgressDate: { $exists: true },
    });

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

          LoggerColor.bold().log(
            `📅 Usuario ${progress.userId} avanzó ${semanasAvance} semanas → Semana actual: ${progress.currentWeek}`,
          );
        }
      }
    }
  } catch (err) {
    LoggerColor.error('❌ Error en cron de videos:', err);
  }
};

type OrderCompleteByPlanAndUser = {
  plan: IPlanModel;
  user: UserModel | null;
};

const cronOrderStatusComplete = async () => {
  LoggerColor.log('⏰ Cron job iniciado: Validando órdenes aprobadas...');

  try {
    const orderIdsComplete: OrderCompleteByPlanAndUser[] = [];
    const today = new Date();

    const orders = await OrderMongoModel.find({
      status: SelectStatusOrderModel.Approved,
      approvedOrderDate: { $exists: true },
    });

    for (const order of orders) {
      if (!order.approvedOrderDate) continue;

      const getPlan = await PlanMongoModel.findOne({ _id: order.planId });
      if (!getPlan || !getPlan.daysActive) continue;

      const expirationDate = new Date(order.approvedOrderDate);
      expirationDate.setDate(expirationDate.getDate() + getPlan.daysActive);

      if (today > expirationDate) {
        await OrderMongoModel.updateOne(
          { _id: order._id },
          {
            $set: {
              status: SelectStatusOrderModel.Completed,
              completedOrderDate: new Date(),
            },
          },
        );
        LoggerColor.log(`✅ Orden ${order._id} marcada como COMPLETADA.`);
        orderIdsComplete.push({
          plan: getPlan,
          user: await UserMongoModel.findOne({ _id: order.userId }),
        });
      }
    }

    if (orderIdsComplete.length) {
      LoggerColor.log(`Enviando emails a usuarios...`);
      await Promise.all(
        orderIdsComplete.map(async order => {
          if (!order?.user || !order.plan) return;

          const orderCompleteEmail = await generateEmail({
            template: 'orderComplete',
            variables: {
              planName: `${order.plan.name}`,
              duration: `${order.plan.daysActive}`,
              displayName: `${order.user.displayName}`,
              endDate: new Date().toLocaleString(),
            },
          });

          const msg = {
            from: `${process.env.NODE_MAILER_ROOT_EMAIL}`,
            to: `${order.user.email}`,
            subject: 'Orden completada, Padel Track',
            text: '-',
            html: orderCompleteEmail,
          };

          sendEMail({ data: msg });
        }),
      );
    }
  } catch (err) {
    LoggerColor.error('❌ Error en el cron job:', err);
  }
};

const cronDateOrderExpired = async () => {
  LoggerColor.log('[CRON] Revisando órdenes expiradas...');

  try {
    const now = new Date();
    const orders = await OrderMongoModel.find({
      status: SelectStatusOrderModel.Completed,
    }).populate('planId');

    for (const order of orders) {
      if (!order.completedOrderDate || !order.planId) continue;

      const { daysActive } = order.planId as any;
      const expirationDate = new Date(order.completedOrderDate);
      const durationDays =
        daysActive === SelectDaysActiveModel.ONE_MONTH
          ? 30
          : daysActive === SelectDaysActiveModel.THREE_MONTHS
            ? 60
            : daysActive === SelectDaysActiveModel.TWELVE_MONTHS
              ? 60
              : 0;
      expirationDate.setDate(expirationDate.getDate() + durationDays);

      if (now > expirationDate) {
        LoggerColor.log(`Orden ${order._id} expirada (${daysActive} días)`);
        await WeeklyVideoMongoModel.deleteOne({ orderId: order._id });
        await OrderMongoModel.updateOne(
          { _id: order._id },
          { $set: { status: SelectStatusOrderModel.Expired } },
        );
      }
    }
  } catch (error) {
    LoggerColor.error('❌ Error en el cron job:', error);
  }
};

export const cronOrder = () => {
  cron.schedule('0 1 * * *', async () => {
    await cronOrderStatusComplete();
    await cronOrderProgressWeek();
    await cronDateOrderExpired();
  });
};
