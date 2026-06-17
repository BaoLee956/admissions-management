const express = require('express');
const router = express.Router();
// Import thêm verifyCandidateOTP và adminLogin
const { requestCandidateOTP, verifyCandidateOTP, adminLogin, changePassword } = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// [POST] /api/v1/auth/candidates/otp
router.post('/candidates/otp', requestCandidateOTP);

// [POST] /api/v1/auth/candidates/verify
router.post('/candidates/verify', verifyCandidateOTP);

// [POST] /api/v1/auth/admin/login
router.post('/admin/login', adminLogin);

// [POST] /api/v1/auth/change-password (Yêu cầu phải có Token hợp lệ)
router.post('/change-password', verifyToken, changePassword);

module.exports = router;