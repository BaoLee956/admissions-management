const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');

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
router.post('/categories/nganh', adminController.createNganhCatalog); 
router.put('/categories/nganh/:id', adminController.updateNganhCatalog);
router.delete('/categories/nganh/:id', adminController.deleteNganhCatalog);
router.get('/categories/khoa', adminController.getAllKhoa);   // Lấy danh sách khoa
router.post('/categories/khoa', adminController.createKhoa);         // Thêm khoa mới
router.put('/categories/khoa/:id', adminController.updateKhoa);      // Sửa khoa
router.delete('/categories/khoa/:id', adminController.deleteKhoa);   // Xóa khoa

// --- UC10: QUẢN LÝ CẤU HÌNH ĐỢT TUYỂN SINH & CHỈ TIÊU (Độc quyền Admin) ---
router.get('/admissions/dot', adminController.getAllDots);
router.post('/admissions/dot', adminController.createDotTuyenSinh);      // Tạo đợt tuyển sinh mới
router.post('/admissions/chitieu', adminController.addChiTieu);
router.get('/admissions/chitieu', adminController.getAllCriteria);
router.put('/admissions/chitieu/diem-chuan', adminController.updateDiemChuan);
router.post('/admissions/process', adminController.processAdmissions);
router.post('/admissions/generate-mssv', adminController.generateStudentIds);
router.get('/categories/nganh', adminController.getAllNganh);
router.post(
    '/admissions/import-candidates', 
    upload.single('file'),
    adminController.importCandidates
);          //    Phân bổ chỉ tiêu ngành
router.put('/users/:id/reset-password', adminController.resetOfficerPassword);
module.exports = router;