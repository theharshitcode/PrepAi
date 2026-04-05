// src/validators/interview.validator.js
const { body, param } = require('express-validator');

exports.startInterviewValidator = [
    body('jobRole')
        .trim()
        .notEmpty().withMessage('Job role is required')
        .isLength({ min: 2 }).withMessage('Job role must be at least 2 characters')
        .isLength({ max: 100 }).withMessage('Job role cannot exceed 100 characters'),

    body('companyId')
        .notEmpty().withMessage('Company is required')
        .isMongoId().withMessage('Invalid company ID')
];

exports.submitAnswerValidator = [
    body('interviewId')
        .notEmpty().withMessage('Interview ID is required')
        .isMongoId().withMessage('Invalid interview ID'),

    body('questionIndex')
        .notEmpty().withMessage('Question index is required')
        .isInt({ min: 0, max: 4 }).withMessage('Question index must be between 0 and 4'),

    body('answer')
        .optional()
        .isString().withMessage('Answer must be a string')
        .isLength({ max: 2000 }).withMessage('Answer too long')
];

exports.reportValidator = [
    param('id')
        .notEmpty().withMessage('Interview ID is required')
        .isMongoId().withMessage('Invalid interview ID')
];