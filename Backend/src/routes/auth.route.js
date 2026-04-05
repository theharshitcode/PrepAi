// // routes/auth.routes.js
// const express = require('express');
// const router = express.Router();
// const auth = require('../middlewares/auth.middleware');
// const {
//     registerUser,
//     loginUser,
//     logoutUser,
//     getProfile,
//     refreshToken,
//     completeProfile
// } = require('../controllers/auth.controller');

// router.post('/register', registerUser);
// router.post('/login', loginUser);
// router.post('/logout', auth, logoutUser);      // auth middleware chahiye
// router.post('/refresh', refreshToken);          // auth nahi chahiye — token expire ho chuka hoga
// router.get('/profile', auth, getProfile);       // auth middleware chahiye
// // auth.routes.js
// router.post('/complete-profile', auth, completeProfile);  // auth chahiye

// module.exports = router;

// src/routes/auth.route.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
    registerValidator,
    loginValidator,
    completeProfileValidator
} = require('../validators/auth.validator');
const {
    registerUser,
    loginUser,
    logoutUser,
    getProfile,
    refreshToken,
    completeProfile
} = require('../controllers/auth.controller');

router.post('/register', registerValidator, validate, registerUser);
router.post('/login', loginValidator, validate, loginUser);
router.post('/logout', auth, logoutUser);
router.post('/refresh', refreshToken);
router.get('/profile', auth, getProfile);
router.post('/complete-profile', auth, completeProfileValidator, validate, completeProfile);

module.exports = router;