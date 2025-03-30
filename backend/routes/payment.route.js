import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { checkoutSession, createCheckoutSession } from '../controllers/payment.controller.js';

const router = express.Router();

router.post('/create-checkout-session', protectRoute, createCheckoutSession);
router.post('/checkout-session', protectRoute, checkoutSession);

// This route handles the creation of a checkout session using Razorpay.
export default router;