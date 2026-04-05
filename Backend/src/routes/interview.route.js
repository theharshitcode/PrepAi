// // routes/interview.routes.js
// const express = require('express');
// const router = express.Router();
// const auth = require('../middlewares/auth.middleware');
// const {
//     startInterview,
//     submitAnswer,
//     getReport
// } = require('../controllers/interview.controller');

// router.post('/start', auth, startInterview);
// router.post('/answer', auth, submitAnswer);
// router.get('/report/:id', auth, getReport);

// module.exports = router;




// routes/interview.routes.js
// const express = require('express');
// const router = express.Router();
// const auth = require('../middlewares/auth.middleware');
// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');
// const { cloudinary } = require('../config/cloudinary');
// const {
//     startInterview,
//     submitAnswer,
//     getReport
// } = require('../controllers/interview.controller');

// // Combined storage for both audio and video
// const storage = new CloudinaryStorage({
//     cloudinary,
//     params: async (req, file) => {
//         const isVideo = file.mimetype.startsWith('video/');
//         return {
//             folder: isVideo ? 'ai-interview/video' : 'ai-interview/audio',
//             resource_type: 'video',   // audio bhi video type mein jaata hai Cloudinary pe
//             allowed_formats: ['mp3', 'mp4', 'wav', 'webm', 'm4a', 'mov']
//         };
//     }
// });

// const upload = multer({ storage }).fields([
//     { name: 'audio', maxCount: 1 },
//     { name: 'video', maxCount: 1 }
// ]);

// router.post('/start', auth, startInterview);
// router.post('/answer', auth, upload, submitAnswer);
// router.get('/report/:id', auth, getReport);
// router.post('/answer', auth, (req, res, next) => {
//     upload(req, res, (err) => {
//         if (err) {
//             return res.status(400).json({ message: err.message });
//         }
//         console.log('After multer - body:', req.body);  // debug
//         next();
//     });
// }, submitAnswer);

// module.exports = router;



// src/routes/interview.routes.js
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

module.exports = router;