const Interview = require('../models/interview.model');
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const {
    startInterviewValidator,
    submitAnswerValidator,
    reportValidator
} = require('../validators/interview.validator');
const {
    startInterview,
    submitAnswer,
    getReport
} = require('../controllers/interview.controller');

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const isVideo = file.mimetype.startsWith('video/');
        return {
            folder: isVideo ? 'ai-interview/video' : 'ai-interview/audio',
            resource_type: 'video',
            allowed_formats: ['mp3', 'mp4', 'wav', 'webm', 'm4a', 'mov']
        };
    }
});

const upload = multer({ storage }).fields([
    { name: 'audio', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]);

router.post('/start', auth, startInterviewValidator, validate, startInterview);
router.post('/answer', auth, (req, res, next) => {
    upload(req, res, (err) => {
        if (err) return res.status(400).json({ message: err.message });
        next();
    });
}, submitAnswerValidator, validate, submitAnswer);
router.get('/report/:id', auth, reportValidator, validate, getReport);

// interview.routes.js mein add karo
router.get('/my-interviews', auth, async (req, res) => {
    try {
        const interviews = await Interview.find({ candidate: req.user._id })
            .populate('company', 'name industry')
            .sort({ createdAt: -1 })
        res.json(interviews)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
})

module.exports = router;