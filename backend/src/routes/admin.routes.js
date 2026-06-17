const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Khóa bảo mật cấp cao: Chỉ những tài khoản đăng nhập có quyền 'ADMIN' mới đi qua được cụm Route dưới đây
router.use(verifyToken);
router.use(checkRole('ADMIN'));

// --- Các UC dùng chung (Duyệt hồ sơ & Xét tuyển giống Officer) ---
router.get('/applications/pending', adminController.getPendingApplications);
router.get('/applications/:id', adminController.getApplicationDetails);
router.put('/applications/:id/status', adminController.reviewApplication);

// --- UC08: QUẢN LÝ TÀI KHOẢN CÁN BỘ (Độc quyền Admin) ---
router.get('/officers', adminController.getAllOfficers);                  // Lấy danh sách cán bộ
router.post('/officers', adminController.createOfficer);                 // Thêm mới cán bộ
router.put('/officers/:id/toggle-lock', adminController.toggleLockOfficer); // Khóa/mở khóa cán bộ

// --- UC09: QUẢN LÝ DANH MỤC (Độc quyền Admin) ---
router.post('/categories/nganh', adminController.createNganhCatalog);    // Thêm ngành học mới

// --- UC10: QUẢN LÝ CẤU HÌNH ĐỢT TUYỂN SINH & CHỈ TIÊU (Độc quyền Admin) ---
router.post('/admissions/dot', adminController.createDotTuyenSinh);      // Tạo đợt tuyển sinh mới
router.post('/admissions/chitieu', adminController.addChiTieu);          // Phân bổ chỉ tiêu ngành
router.put('/users/:id/reset-password', adminController.resetOfficerPassword);
module.exports = router;