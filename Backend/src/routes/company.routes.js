// routes/company.routes.js
const express = require('express');
const router = express.Router();
const { searchCompanies, getIndustries } = require('../controllers/company.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/search', auth, searchCompanies);    // GET /api/companies/search?q=tata
router.get('/industries', auth, getIndustries);  // GET /api/companies/industries

module.exports = router;