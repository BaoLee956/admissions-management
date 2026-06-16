const express = require('express');
const router = express.Router();
// Import thêm verifyCandidateOTP và adminLogin
const { requestCandidateOTP, verifyCandidateOTP, adminLogin } = require('../controllers/auth.controller');

// [POST] /api/v1/auth/candidates/otp
router.post('/candidates/otp', requestCandidateOTP);

// [POST] /api/v1/auth/candidates/verify
router.post('/candidates/verify', verifyCandidateOTP);

// [POST] /api/v1/auth/admin/login
router.post('/admin/login', adminLogin);

module.exports = router;