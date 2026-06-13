const express = require('express');
const router = express.Router();
const { getPendingApplications, getApplicationDetails, reviewApplication } = require('../controllers/admin.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Khóa bảo mật: Chỉ những ai có Token hợp lệ VÀ mang role 'ADMIN' mới được đi qua
router.use(verifyToken);
router.use(checkRole('ADMIN'));

// [GET] /api/v1/admin/applications/pending
router.get('/applications/pending', getPendingApplications);

// [GET] /api/v1/admin/applications/:id
router.get('/applications/:id', getApplicationDetails);

// [POST] /api/v1/admin/applications/:id/status
router.put('/applications/:id/status', reviewApplication);

module.exports = router;