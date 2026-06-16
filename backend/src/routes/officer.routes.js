const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Áp dụng middleware kiểm tra token và quyền OFFICER/ADMIN cho toàn bộ router này
router.use(verifyToken);
router.use(checkRole(['OFFICER', 'ADMIN']));

// ... (Các route UC3, UC4 duyệt hồ sơ hiện tại của bạn)

// Routes cho UC 5: Xét tuyển
router.put('/admissions/criteria', adminController.updateDiemChuan);
router.post('/admissions/process', adminController.processAdmissions);

// Routes cho UC 6: Tiếp nhận sinh viên
router.post('/onboarding/generate-mssv', adminController.generateStudentIds);

module.exports = router;