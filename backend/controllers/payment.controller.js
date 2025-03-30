import { razorpay } from '../lib/razorpay.js';
import Coupon from '../models/coupon.model.js';
import Order from '../models/order.model.js';

export const createCheckoutSession = async (req, res) => {
  try {
    const { products, couponCode } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Invalid or empty products array' });
    }

    let totalAmount = 0;

    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100); // Convert to smallest currency unit
      totalAmount += amount * product.quantity; // Calculate total amount
      return {
        price_data: {
          currency: 'INR',
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
      };
    });

    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
      if (coupon) {
        totalAmount -= Math.round(totalAmount * (coupon.discountPercentage / 100)); // Apply discount
      }
    }

    const session = await razorpay.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: coupon
        ? [
          { coupon: await createRazorpayCoupon(coupon.discountPercentage) } // Create Razorpay coupon
        ]
        : [],
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || "",
        products: JSON.stringify(products.map((p) => ({ id: p.id, quantity: p.quantity, price: p.price }))),
      },
    });

    if (totalAmount >= 20000) {
      await createNewCoupon(req.user._id)
    }

    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export const checkoutSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await razorpay.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      if (session.metadata.couponCode) {
        await Coupon.findOneAndUpdate({
          code: session.metadata.couponCode,
          userId: session.metadata.userId,
        }, { isActive: false });
      }

      const products = JSON.parse(session.metadata.products);
      const newOrder = new Order({
        userId: session.metadata.userId,
        products: products.map((p) => ({
          id: p.id,
          quantity: p.quantity,
          price: p.price,
        })),
        totalAmount: session.amount_total / 100,
        razorpaySessionId: sessionId,
      });

      await newOrder.save();
      res.status(200).json({ message: 'Payment Successfully, Order Created, and coupon deactivated if used.', orderId: newOrder._id });
    }
  } catch (error) {
    console.error('Error fetching checkout session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function createRazorpayCoupon(discountPercentage) {
  const coupon = await razorpay.coupons.create({
    perecnt_off: discountPercentage,
    duration: 'once',
  });

  return coupon.id;
}

async function createNewCoupon(userId) {
  const newCoupon = new Coupon({
    code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    discountPercentage: 10,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    userId: userId,
  })

  await newCoupon.save()
  return newCoupon;
}