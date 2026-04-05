// src/controllers/payment.controller.js
require('dotenv').config();  // agar src ke andar se load ho raha haiconst Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/user.model');

// Ab check karo
console.log('Key ID:', process.env.RAZORPAY_KEY_ID);

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Step 1 — Order create karo
exports.createOrder = async (req, res) => {
    try {
        const options = {
            amount: 49900,          // 499 rupees in paise
            currency: 'INR',
            receipt: `receipt_${req.user._id}_${Date.now()}`,
            notes: {
                userId: req.user._id.toString(),
                plan: 'unlimited'
            }
        };

        const order = await razorpay.orders.create(options);

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID   // frontend ko chahiye
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Order creation failed' });
    }
};

// Step 2 — Payment verify karo
exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    try {
        // Signature verify karo — ye sabse important step hai
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        // Payment verified — user ko paid karo
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { isPaid: true },
            { new: true }
        ).select('-password');

        res.json({
            message: 'Payment verified successfully',
            isPaid: user.isPaid,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isPaid: user.isPaid,
                interviewCount: user.interviewCount
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Payment verification failed' });
    }
};

// Step 3 — Payment status check karo
exports.getPaymentStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('isPaid interviewCount');

        res.json({
            isPaid: user.isPaid,
            interviewCount: user.interviewCount,
            remainingFree: user.isPaid ? 'unlimited' : Math.max(0, 3 - user.interviewCount)
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};