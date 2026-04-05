// src/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Audio storage
const audioStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'ai-interview/audio',
        resource_type: 'video',   // Cloudinary audio bhi video type mein store karta hai
        allowed_formats: ['mp3', 'mp4', 'wav', 'webm', 'm4a'],
    }
});

// Video storage
const videoStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'ai-interview/video',
        resource_type: 'video',
        allowed_formats: ['mp4', 'webm', 'mov'],
    }
});

const uploadAudio = multer({ storage: audioStorage });
const uploadVideo = multer({ storage: videoStorage });

module.exports = { cloudinary, uploadAudio, uploadVideo };