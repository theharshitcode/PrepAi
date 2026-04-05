const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true        // duplicate blacklist entries nahi hoge
    },
    expiresAt: {
        type: Date,
        required: true
    }
});

// TTL index — MongoDB khud delete karega expired tokens
blacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Blacklist = mongoose.model('Blacklist', blacklistSchema);

module.exports = Blacklist;