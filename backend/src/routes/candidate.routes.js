const express = require('express');
const router = express.Router();
const { getAdmissionResult, confirmEnrollment, uploadDocument, submitApplication } = require('../controllers/candidate.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');
const { upload, handleUploadError } = require('../middlewares/upload.middleware');

// Áp dụng Middleware bảo vệ cho toàn bộ route của Candidate
router.use(verifyToken);
router.use(checkRole('CANDIDATE'));

// [GET] /api/v1/candidates/me/admission-result
router.get('/me/admission-result', getAdmissionResult);

// [PUT] /api/v1/candidates/me/confirm-enrollment
router.put('/me/confirm-enrollment', confirmEnrollment);

// [POST] /api/v1/candidates/me/documents
router.post(
    '/me/documents', 
    upload.single('file'), 
    handleUploadError, 
    uploadDocument
);
// [POST] /api/v1/candidates/me/submit-application
router.post('/me/submit-application', submitApplication);

module.exports = router;