const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Áp dụng middleware kiểm tra token và quyền cho toàn bộ router này
router.use(verifyToken);
router.use(checkRole(['OFFICER', 'ADMIN']));

// ==========================================
// Routes cho UC 3 & UC 4: Quản lý và Duyệt hồ sơ
// ==========================================
// [GET] Danh sách hồ sơ chờ duyệt (UC3)
router.get('/applications/pending', adminController.getPendingApplications);
// [GET] Chi tiết một hồ sơ kèm giấy tờ (UC4)
router.get('/applications/:id', adminController.getApplicationDetails);
// [PUT] Phê duyệt hoặc từ chối hồ sơ (UC4)
router.put('/applications/:id/review', adminController.reviewApplication);


// ==========================================
// Routes cho UC 5: Xét tuyển
// ==========================================
router.get('/admissions/criteria', adminController.getAllCriteria);
router.put('/admissions/criteria', adminController.updateDiemChuan);
router.post('/admissions/process', adminController.processAdmissions);


// ==========================================
// Routes cho UC 6: Tiếp nhận sinh viên
// ==========================================
router.get('/onboarding/students', adminController.getAdmittedStudents);
router.post('/onboarding/generate-mssv', adminController.generateStudentIds);
router.get('/dashboard/stats', adminController.getDashboardStats);

module.exports = router;