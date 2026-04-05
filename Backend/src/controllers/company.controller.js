// controllers/company.controller.js
const Company = require('../models/company.model');

// Search by name
exports.searchCompanies = async (req, res) => {
    try {
        const { q, industry } = req.query;

        const filter = { isActive: true };

        if (q) {
            filter.name = { $regex: q, $options: 'i' };  // case-insensitive search
        }
        if (industry) {
            filter.industry = industry;
        }

        const companies = await Company.find(filter)
            .select('name industry logo')  // sirf zaroori fields
            .limit(10)                     // max 10 results
            .sort({ name: 1 });

        res.json(companies);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Sabhi industries ki list
exports.getIndustries = async (req, res) => {
    try {
        const industries = await Company.distinct('industry', { isActive: true });
        res.json(industries);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.searchCompanies = async (req, res) => {
    try {
        const { q, industry } = req.query;
        const filter = {};  // isActive hata diya

        if (q && q.trim() !== '') {
            filter.name = { $regex: q, $options: 'i' };
        }

        if (industry) {
            filter.industry = industry;
        }

        const companies = await Company.find(filter)
            .select('name industry logo')
            .limit(10)
            .sort({ name: 1 });

        res.json(companies);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};