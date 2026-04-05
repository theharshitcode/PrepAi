const jwt = require('jsonwebtoken');
const Blacklist = require('../models/blacklist.model');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).send({ error: 'Please authenticate.' });
        }

        const token = authHeader.replace('Bearer ', '');

        // 1. JWT verify karo
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 2. Blacklist check
        const blacklistEntry = await Blacklist.findOne({
            token,
            expiresAt: { $gt: new Date() }   // fix
        });
        if (blacklistEntry) {
            return res.status(401).send({ error: 'Token has been revoked.' });
        }

        // 3. User fetch — decoded.id fix
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).send({ error: 'Please authenticate.' });
        }

        req.user = user;
        req.token = token;
        next();

    } catch (error) {
        res.status(401).send({ error: 'Please authenticate.' });
    }
};

module.exports = auth;