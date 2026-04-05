const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Blacklist = require('../models/blacklist.model');
const config = require('../config/config');
// TOP mein add karo — ye line missing hai
const Company = require('../models/company.model');

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
};

const generateTokens = (userId) => {
    const token = jwt.sign(
        { id: userId },
        config.JWT_SECRET,
        { expiresIn: '1h' }
    );
    const refreshToken = jwt.sign(
        { id: userId },
        config.JWT_REFRESH_SECRET,         // alag secret
        { expiresIn: '7d' }
    );
    return { token, refreshToken };
};

exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await userModel.create({ name, email, password: hashedPassword });
        const { token, refreshToken } = generateTokens(user._id);

        res.cookie('token', token, cookieOptions);
        res.cookie('refreshToken', refreshToken, cookieOptions);

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user._id, name: user.name, email: user.email },
            token,
            refreshToken
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const { token, refreshToken } = generateTokens(user._id);

        res.cookie('token', token, cookieOptions);
        res.cookie('refreshToken', refreshToken, cookieOptions);

        res.json({
            user: { id: user._id, name: user.name, email: user.email },
            token,
            refreshToken
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.logoutUser = async (req, res) => {
    try {
        const decoded = jwt.verify(req.token, config.JWT_SECRET);
        const refreshToken = req.cookies?.refreshToken;

        const blacklistOps = [
            Blacklist.create({
                token: req.token,
                expiresAt: new Date(decoded.exp * 1000)
            })
        ];

        if (refreshToken) {
            const decodedRefresh = jwt.decode(refreshToken);
            blacklistOps.push(
                Blacklist.create({
                    token: refreshToken,
                    expiresAt: new Date(decodedRefresh.exp * 1000)
                })
            );
        }

        await Promise.all(blacklistOps);

        res.clearCookie('token', cookieOptions);
        res.clearCookie('refreshToken', cookieOptions);

        res.json({ message: 'Logged out successfully.' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Logout failed.' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: 'No refresh token' });
        }

        // Blacklist check
        const isBlacklisted = await Blacklist.findOne({ token: refreshToken });
        if (isBlacklisted) {
            return res.status(401).json({ message: 'Refresh token revoked' });
        }

        // Verify karo
        const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);

        // Naya access token banao
        const newToken = jwt.sign({ id: decoded.id }, config.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', newToken, cookieOptions);
        res.json({ token: newToken });

    } catch (err) {
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

// auth.controller.js mein add karo
exports.completeProfile = async (req, res) => {
    try {
        const { role, companies } = req.body;

        // Agar pehle se complete hai toh block karo
        if (req.user.isProfileComplete) {
            return res.status(400).json({
                message: 'Profile already completed. Role and companies cannot be changed.'
            });
        }

        // Validation
        if (!role || !companies || companies.length === 0) {
            return res.status(400).json({
                message: 'Role and at least one company are required'
            });
        }

        // Companies DB mein exist karti hain?
        const validCompanies = await Company.find({ _id: { $in: companies } });
        if (validCompanies.length !== companies.length) {
            return res.status(400).json({
                message: 'One or more companies are invalid'
            });
        }

        const user = await userModel.findByIdAndUpdate(
            req.user.id,
            {
                role,
                companies,
                isProfileComplete: true      // ab kabhi nahi badlega
            },
            { new: true }
        ).select('-password');

        res.json({
            message: 'Profile completed successfully',
            user
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};