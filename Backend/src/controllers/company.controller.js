// controllers/company.controller.js
const Company = require('../models/company.model');

// Sabhi industries ki list
exports.getIndustries = async (req, res) => {
    try {
        const industries = await Company.distinct('industry', { isActive: true });
        res.json(industries);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// company.controller.js — sirf ye rakho
exports.searchCompanies = async (req, res) => {
    try {
        const { q, industry } = req.query;
        const filter = {};

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