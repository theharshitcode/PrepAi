// models/user.model.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    // role: {
    //     type: String,
    //     enum: ['candidate', 'admin'],
    //     default: null                  // register pe null — baad mein ek baar set hoga
    // },
    role: {
        type: String,
        enum: ['candidate', 'admin'],
        default: undefined    // null ki jagah
    },
    companies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }],
    isProfileComplete: {
        type: Boolean,
        default: false                 // role + companies set hone ke baad true hoga
    },
    interviewCount: {
        type: Number,
        default: 0        // har interview pe increment hoga
    },
    isPaid: {
        type: Boolean,
        default: false    // payment ke baad true hoga
    }
}, { timestamps: true });

// Role aur companies sirf ek baar set ho sakti hain
userSchema.pre('save', async function () {
    if (this.isModified('role') && this.isProfileComplete) {
        throw new Error('Role cannot be changed once set');
    }
    if (this.isModified('companies') && this.isProfileComplete) {
        throw new Error('Companies cannot be changed once set');
    }
});

module.exports = mongoose.model('User', userSchema);