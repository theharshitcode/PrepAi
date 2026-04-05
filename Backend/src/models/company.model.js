// models/company.model.js
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Company name is required'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    industry: {
        type: String,
        trim: true,
        enum: [
            'Technology',
            'Finance',
            'Healthcare',
            'E-Commerce',
            'EdTech',
            'Consulting',
            'Manufacturing',
            'Telecom',
            'Media',
            'Other'
        ]
    },
    logo: {
        type: String,         // S3 URL ya CDN link
        default: null
    },
    isActive: {
        type: Boolean,
        default: true         // inactive companies search mein nahi aayengi
    }
}, { timestamps: true });

// Search ke liye text index
companySchema.index({ name: 'text', industry: 'text' });

module.exports = mongoose.model('Company', companySchema);