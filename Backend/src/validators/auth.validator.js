// src/validators/auth.validator.js
const { body } = require('express-validator');

exports.registerValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
        .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

exports.loginValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
];

exports.completeProfileValidator = [
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['candidate', 'admin']).withMessage('Role must be candidate or admin'),

    body('companies')
        .notEmpty().withMessage('At least one company is required')
        .isArray({ min: 1 }).withMessage('Companies must be an array')
];