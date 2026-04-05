// src/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { body } = require('express-validator');
const validate = require('../middlewares/validate.middleware');
const {
    createOrder,
    verifyPayment,
    getPaymentStatus
} = require('../controllers/payment.controller');

// Verify payment validator
const verifyPaymentValidator = [
    body('razorpay_order_id')
        .notEmpty().withMessage('Order ID is required'),
    body('razorpay_payment_id')
        .notEmpty().withMessage('Payment ID is required'),
    body('razorpay_signature')
        .notEmpty().withMessage('Signature is required')
];

router.post('/create-order', auth, createOrder);
router.post('/verify', auth, verifyPaymentValidator, validate, verifyPayment);
router.get('/status', auth, getPaymentStatus);

module.exports = router;