// models/interview.model.js
const mongoose = require('mongoose');

const qaSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        default: null
    },
    audioUrl: {
        type: String,
        default: null
    },
    videoUrl: {
        type: String,
        default: null
    },
    aiScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null
    },
    aiFeedback: {
        type: String,
        default: null
    }
});

const interviewSchema = new mongoose.Schema({
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    jobRole: {
        type: String,
        required: [true, 'Job role is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    qna: [qaSchema],
    overallScore: {
        type: Number,
        min: 0,
        max: 100,
        default: null
    },
    overallFeedback: {
        type: String,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Auto overallScore calculate karo jab save ho
interviewSchema.pre('save', async function () {
    const answered = this.qna.filter(q => q.aiScore !== null);
    if (answered.length > 0) {
        const total = answered.reduce((sum, q) => sum + q.aiScore, 0);
        this.overallScore = Math.round(total / answered.length);
    }
});

module.exports = mongoose.model('Interview', interviewSchema);