import { Router } from 'express';
import authRouter from './auth.routes';
import productRouter from './product.routes';
import categoryRouter from './category.routes';
import couponRouter from './coupon.routes';
import reviewRouter from './review.routes';
import orderRouter from './order.routes';
import leadRouter from './lead.routes';
import analyticsRouter from './analytics.routes';
import settingsRouter from './settings.routes';

const router = Router();

// Mount modules
router.use('/auth', authRouter);
router.use('/products', productRouter);
router.use('/categories', categoryRouter);
router.use('/coupons', couponRouter);
router.use('/reviews', reviewRouter);
router.use('/orders', orderRouter);
router.use('/leads', leadRouter);
router.use('/analytics', analyticsRouter);
router.use('/settings', settingsRouter);

export default router;
