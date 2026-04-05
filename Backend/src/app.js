const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']          // cookies frontend se aane ke liye zaroori
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

// Routes
const authRoutes = require('./routes/auth.route.js');
const companyRoutes = require('./routes/company.routes');  // ye missing tha
// const interviewRoutes = require('./routes/interview.routes');  // baad mein uncomment karna

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/interview', require('./routes/interview.route.js'));
app.use('/api/payment', require('./routes/payment.routes'));
module.exports = app;