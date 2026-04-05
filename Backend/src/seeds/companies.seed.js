// seeds/companies.seed.js
const mongoose = require('mongoose');
const Company = require('../models/company.model');
require('dotenv').config();

const indianCompanies = [
    // Tech
    { name: 'Tata Consultancy Services', industry: 'Technology' },
    { name: 'Infosys', industry: 'Technology' },
    { name: 'Wipro', industry: 'Technology' },
    { name: 'HCL Technologies', industry: 'Technology' },
    { name: 'Tech Mahindra', industry: 'Technology' },
    { name: 'Capgemini India', industry: 'Technology' },
    { name: 'Cognizant India', industry: 'Technology' },
    { name: 'Accenture India', industry: 'Technology' },
    // Finance
    { name: 'HDFC Bank', industry: 'Finance' },
    { name: 'ICICI Bank', industry: 'Finance' },
    { name: 'State Bank of India', industry: 'Finance' },
    { name: 'Axis Bank', industry: 'Finance' },
    { name: 'Zerodha', industry: 'Finance' },
    { name: 'Razorpay', industry: 'Finance' },
    // E-Commerce
    { name: 'Flipkart', industry: 'E-Commerce' },
    { name: 'Meesho', industry: 'E-Commerce' },
    { name: 'Nykaa', industry: 'E-Commerce' },
    { name: 'Myntra', industry: 'E-Commerce' },
    // EdTech
    { name: 'BYJU\'S', industry: 'EdTech' },
    { name: 'Unacademy', industry: 'EdTech' },
    { name: 'upGrad', industry: 'EdTech' },
    { name: 'Vedantu', industry: 'EdTech' },
    // Telecom
    { name: 'Jio Platforms', industry: 'Telecom' },
    { name: 'Airtel', industry: 'Telecom' },
    // Consulting
    { name: 'Deloitte India', industry: 'Consulting' },
    { name: 'McKinsey India', industry: 'Consulting' },
    { name: 'KPMG India', industry: 'Consulting' },
    // Others
    { name: 'Ola', industry: 'Technology' },
    { name: 'Zomato', industry: 'Technology' },
    { name: 'Swiggy', industry: 'Technology' },
    { name: 'Paytm', industry: 'Finance' },
    { name: 'CRED', industry: 'Finance' },
    { name: 'Dream11', industry: 'Technology' },
];

const seedCompanies = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB connected');

        // Pehle se existing companies ko skip karo
        for (const company of indianCompanies) {
            await Company.findOneAndUpdate(
                { name: company.name },
                company,
                { upsert: true, new: true }   // nahi hai toh create, hai toh skip
            );
        }

        console.log(`${indianCompanies.length} companies seeded successfully`);
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err.message);
        process.exit(1);
    }
};

seedCompanies();