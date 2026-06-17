const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');

// ========================================================
// 1. NHÓM API QUẢN LÝ VÀ DUYỆT HỒ SƠ (UC 3 & UC 4)
// ========================================================

// [GET] Lấy danh sách hồ sơ
const getPendingApplications = async (req, res) => {
    try {
        // CẬP NHẬT: Ép kiểu chuẩn tên cột AS "maHoSo" và JOIN thêm bảng để lấy thông tin ngành, ngày nộp
        const query = `
            SELECT 
                hs.MaHoSo AS "maHoSo",
                ts.SBD AS "sbd", 
                ts.HoTen AS "hoTen", 
                n.TenNganh AS "tenNganh", 
                hs.TrangThai AS "trangThai", 
                hs.NgayNop AS "ngayNop"
            FROM HoSoNhapHoc hs
            JOIN ThiSinh ts ON hs.SBD = ts.SBD
            LEFT JOIN NguyenVong nv ON ts.SBD = nv.SBD AND nv.TrangThai = 1
            LEFT JOIN ChiTieuTuyenSinh ct ON nv.ID_ChiTieu = ct.ID
            LEFT JOIN Nganh n ON ct.MaNganh = n.MaNganh
            WHERE hs.TrangThai = 1
            ORDER BY hs.NgayNop DESC
        `;
        const result = await pool.query(query);
        res.status(200).json({
            message: 'Lấy danh sách hồ sơ thành công.',
            tongSo: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Lỗi tại getPendingApplications:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};

// [GET] Lấy chi tiết hồ sơ và danh sách minh chứng
const getApplicationDetails = async (req, res) => {
    const { id } = req.params; // id chính là MaHoSo truyền từ URL
    
    // CHỐT CHẶN AN TOÀN: Bắt lỗi Frontend truyền undefined
    if (!id || id === 'undefined' || isNaN(id)) {
        return res.status(400).json({ error: 'Mã hồ sơ không hợp lệ hoặc bị rỗng.' });
    }
    
    try {
        // 1. Lấy thông tin chung của hồ sơ, thí sinh và ngành trúng tuyển
        const hsQuery = `
            SELECT 
                hs.MaHoSo as "maHoSo", hs.TrangThai as "trangThai", hs.NgayNop as "ngayNop", hs.GhiChu as "ghiChu",
                ts.SBD as "sbd", ts.HoTen as "hoTen", ts.CCCD as "cccd", ts.Email as "email", ts.SDT as "sdt",
                n.TenNganh as "tenNganh"
            FROM HoSoNhapHoc hs
            JOIN ThiSinh ts ON hs.SBD = ts.SBD
            -- Kết nối để lấy Tên ngành trúng tuyển
            LEFT JOIN NguyenVong nv ON ts.SBD = nv.SBD AND nv.TrangThai = 1
            LEFT JOIN ChiTieuTuyenSinh ct ON nv.ID_ChiTieu = ct.ID
            LEFT JOIN Nganh n ON ct.MaNganh = n.MaNganh
            WHERE hs.MaHoSo = $1
            LIMIT 1
        `;
        const hsResult = await pool.query(hsQuery, [id]);

        if (hsResult.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy thông tin hồ sơ này trên hệ thống.' });
        }

        const hoSoInfo = hsResult.rows[0];

        // 2. Lấy danh sách các giấy tờ/file minh chứng đã đính kèm
        const docsQuery = `
            SELECT 
                g.ID as "id", 
                g.MaLoai as "maLoai", 
                l.TenLoai as "tenLoai", 
                g.DuongDanFile as "duongDanFile", 
                g.TrangThaiFile as "trangThaiFile"
            FROM GiayToDinhKem g
            LEFT JOIN LoaiGiayTo l ON g.MaLoai = l.MaLoai
            WHERE g.MaHoSo = $1
        `;
        const docsResult = await pool.query(docsQuery, [id]);

        // 3. Trả dữ liệu gộp về cho giao diện
        res.status(200).json({
            data: {
                ...hoSoInfo,          // Rải phẳng các trường thông tin chung
                documents: docsResult.rows // Đính kèm mảng documents
            }
        });

    } catch (error) {
        console.error('Lỗi khi lấy chi tiết hồ sơ:', error);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ khi tải chi tiết hồ sơ.' });
    }
};

// [PUT] Duyệt hồ sơ
const reviewApplication = async (req, res) => {
    const { id } = req.params; 
    const { trangThai, lyDo } = req.body; 

    if (![2, 3].includes(trangThai)) {
        return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Trạng thái không hợp lệ.' } });
    }

    try {
        // Lấy thông tin email và tên thí sinh để gửi thư
        const checkQuery = `
            SELECT hs.TrangThai, ts.SBD, ts.HoTen, ts.Email 
            FROM HoSoNhapHoc hs JOIN ThiSinh ts ON hs.SBD = ts.SBD 
            WHERE hs.MaHoSo = $1
        `;
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
        if (checkResult.rows[0].trangthai !== 1) return res.status(400).json({ message: 'Hồ sơ này đã được xử lý trước đó.' });

        const tsInfo = checkResult.rows[0];

        // Cập nhật Database
        const updateQuery = `UPDATE HoSoNhapHoc SET TrangThai = $1, GhiChu = $2 WHERE MaHoSo = $3 RETURNING MaHoSo, TrangThai;`;
        const updateResult = await pool.query(updateQuery, [trangThai, lyDo || null, id]);

        // === LOGIC GỬI EMAIL TỰ ĐỘNG NẾU LÀ YÊU CẦU BỔ SUNG ===
        if (trangThai === 3 && tsInfo.email) {
            // Cấu hình Email gửi đi (Bạn nên dùng Mật khẩu ứng dụng của Gmail)
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'baog96005@gmail.com',
                    pass: 'ejtgnmgpqacrdkic'
                }
            });

            const mailOptions = {
                from: '"Hội đồng Tuyển sinh PTIT" <no-reply@ptit.edu.vn>',
                to: tsInfo.email,
                subject: `[PTIT] Yêu cầu bổ sung hồ sơ nhập học - SBD: ${tsInfo.sbd}`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h3 style="color: #b71a22;">Chào ${tsInfo.hoten},</h3>
                        <p>Hội đồng tuyển sinh đã kiểm tra hồ sơ minh chứng trực tuyến của bạn và nhận thấy có một số thông tin cần được cập nhật/bổ sung.</p>
                        <p><strong>Lý do từ Cán bộ tuyển sinh:</strong></p>
                        <div style="background-color: #fcf8f8; padding: 15px; border-left: 4px solid #b71a22; margin: 10px 0;">
                            <i>${lyDo}</i>
                        </div>
                        <p>Hệ thống đã mở lại Cổng nộp hồ sơ cho bạn. Vui lòng đăng nhập vào <a href="http://localhost:5173/" style="color: #b71a22; font-weight: bold;">Cổng Tuyển Sinh</a> để tải lên lại các giấy tờ theo đúng yêu cầu trên.</p>
                        <p>Trân trọng,<br>Hội đồng Tuyển sinh.</p>
                    </div>
                `
            };

            // Chạy ngầm việc gửi mail để không làm chậm thao tác của cán bộ
            transporter.sendMail(mailOptions).catch(err => console.error("Lỗi gửi email:", err));
        }

        const messageAlert = trangThai === 2 ? '✅ Đã PHÊ DUYỆT hồ sơ thành công.' : '❌ Đã TỪ CHỐI / Yêu cầu bổ sung hồ sơ.';
        res.status(200).json({
            message: messageAlert,
            data: { maHoSo: updateResult.rows[0].mahoso, trangThaiMoi: updateResult.rows[0].trangthai, lyDo: lyDo || null }
        });
    } catch (error) {
        console.error('Lỗi tại reviewApplication:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};

// ========================================================
// 2. NHÓM API XÉT TUYỂN & CẤP MSSV (UC 5 & UC 6)
// ========================================================

// [PUT] Thiết lập điểm chuẩn
const updateDiemChuan = async (req, res) => {
    const { idChiTieu, diemChuan } = req.body;
    try {
        const result = await pool.query(
            `UPDATE ChiTieuTuyenSinh SET DiemChuan = $1 WHERE ID = $2 RETURNING *`,
            [diemChuan, idChiTieu]
        );
        res.status(200).json({ message: "Cập nhật điểm chuẩn thành công", data: result.rows[0] });
    } catch (error) {
        console.error('Lỗi khi cập nhật điểm chuẩn:', error);
        res.status(500).json({ error: "Lỗi hệ thống khi cập nhật điểm chuẩn" });
    }
};

// [POST] Chạy thuật toán xét tuyển
const processAdmissions = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); 

        // 1. TÌM ĐỢT TUYỂN SINH ĐANG MỞ
        const activeDotRes = await client.query('SELECT MaDot FROM DotTuyenSinh WHERE IsActive = true LIMIT 1');
        if (activeDotRes.rows.length === 0) {
            throw new Error("Hệ thống không có đợt tuyển sinh nào đang mở.");
        }
        const activeDotId = activeDotRes.rows[0].madot;

        // 2. Reset trạng thái Đợt hiện tại
        await client.query(`
            UPDATE NguyenVong 
            SET TrangThai = 2 
            WHERE ID_ChiTieu IN (SELECT ID FROM ChiTieuTuyenSinh WHERE MaDot = $1)
        `, [activeDotId]);

        // 3. LẤY THÔNG TIN CHỈ TIÊU & ĐIỂM CHUẨN ADMIN ĐÃ SET (ĐIỂM SÀN)
        const criteriaRes = await client.query('SELECT ID, SoLuong, DiemChuan FROM ChiTieuTuyenSinh WHERE MaDot = $1', [activeDotId]);
        const quotas = {};
        const adminCutoffs = {}; // Mức điểm tối thiểu (Điểm sàn)
        const finalCutoffs = {}; // Điểm chuẩn thực tế cuối cùng
        
        criteriaRes.rows.forEach(row => {
            quotas[row.id] = row.soluong;
            // Nếu Admin chưa chốt điểm thì mặc định là 0
            const diemSan = row.diemchuan !== null ? parseFloat(row.diemchuan) : 0;
            adminCutoffs[row.id] = diemSan;
            finalCutoffs[row.id] = diemSan; // Mặc định giữ nguyên con số Admin đã set
        });

        // 4. Lấy toàn bộ nguyện vọng
        const nvQuery = `
            SELECT nv.SBD, nv.ID_ChiTieu, nv.DiemTong, nv.ThuTuUuTien
            FROM NguyenVong nv
            JOIN ChiTieuTuyenSinh ct ON nv.ID_ChiTieu = ct.ID
            WHERE ct.MaDot = $1
            ORDER BY nv.DiemTong DESC, nv.ThuTuUuTien ASC
        `;
        const nvRes = await client.query(nvQuery, [activeDotId]);

        const admittedStudents = new Set(); 
        const passedAspirations = []; 

        // 5. CHẠY THUẬT TOÁN XÉT DUYỆT
        for (const nv of nvRes.rows) {
            const { sbd, id_chitieu, diemtong } = nv;

            if (admittedStudents.has(sbd)) continue; 

            const diemTongNumber = parseFloat(diemtong);

            // BẢO VỆ ĐIỂM SÀN: Dưới mức Admin chốt -> Rớt ngay lập tức
            if (diemTongNumber < adminCutoffs[id_chitieu]) {
                continue; 
            }

            // Nếu qua Điểm sàn VÀ ngành còn chỗ
            if (quotas[id_chitieu] > 0) { 
                admittedStudents.add(sbd); 
                passedAspirations.push({ sbd, id_chitieu }); 
                
                quotas[id_chitieu]--; 

                // CHỈ CẬP NHẬT ĐIỂM CHUẨN LÊN MỨC MỚI nếu slot cuối cùng của chỉ tiêu bị lấp đầy
                if (quotas[id_chitieu] === 0) {
                    finalCutoffs[id_chitieu] = diemTongNumber;
                }
            }
        }

        // 6. LƯU KẾT QUẢ VÀO DATABASE
        for (const pass of passedAspirations) {
            await client.query(
                'UPDATE NguyenVong SET TrangThai = 1 WHERE SBD = $1 AND ID_ChiTieu = $2',
                [pass.sbd, pass.id_chitieu]
            );
        }

        for (const id_chitieu in finalCutoffs) {
            await client.query(
                'UPDATE ChiTieuTuyenSinh SET DiemChuan = $1 WHERE ID = $2',
                [finalCutoffs[id_chitieu], id_chitieu]
            );
        }

        // 7. LẤY DANH SÁCH CHI TIẾT
        const detailQuery = `
            SELECT 
                ts.SBD as "sbd", 
                ts.HoTen as "hoTen", 
                ct.MaNganh AS "tenNganh", 
                nv.TrangThai as "trangThai"
            FROM NguyenVong nv
            JOIN ThiSinh ts ON nv.SBD = ts.SBD
            JOIN ChiTieuTuyenSinh ct ON nv.ID_ChiTieu = ct.ID
            WHERE ct.MaDot = $1
            ORDER BY nv.TrangThai ASC, nv.DiemTong DESC
        `;
        const detailsRes = await client.query(detailQuery, [activeDotId]);

        await client.query('COMMIT'); 
        
        res.status(200).json({
            message: 'Thuật toán đã xử lý xong, tôn trọng hoàn toàn Điểm sàn của Admin!',
            processedCount: detailsRes.rows.length,
            details: detailsRes.rows
        });

    } catch (error) {
        await client.query('ROLLBACK'); 
        console.error('Lỗi chạy thuật toán:', error);
        res.status(500).json({ error: error.message || 'Lỗi hệ thống khi chạy xét tuyển.' });
    } finally {
        client.release();
    }
};

// [GET] Lấy danh sách thí sinh ĐỦ ĐIỀU KIỆN NHẬP HỌC (Đã đậu điểm + Đã duyệt hồ sơ)
const getAdmittedStudents = async (req, res) => {
    try {
        const query = `
            SELECT 
                ts.sbd as "sbd", ts.hoten as "hoTen", n.manganh as "maNganh",
                n.tennganh as "tenNganh", sv.mssv as "mssv",
                CASE WHEN sv.mssv IS NOT NULL THEN 1 ELSE 0 END as "daCapMa"
            FROM nguyenvong nv
            JOIN thisinh ts ON nv.sbd = ts.sbd
            JOIN chitieutuyensinh ct ON nv.id_chitieu = ct.id
            JOIN nganh n ON ct.manganh = n.manganh
            JOIN hosonhaphoc hs ON ts.sbd = hs.sbd 
            LEFT JOIN sinhvien sv ON hs.mahoso = sv.mahoso 
            WHERE nv.trangthai = 1 AND hs.trangthai = 2
            ORDER BY n.manganh ASC, ts.sbd ASC;
        `;
        const result = await pool.query(query);
        res.status(200).json({ data: result.rows });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách trúng tuyển hợp lệ:', error);
        res.status(500).json({ error: "Lỗi hệ thống khi lấy danh sách trúng tuyển" });
    }
};

// [POST] Cấp mã MSSV hàng loạt
const generateStudentIds = async (req, res) => {
    const client = await pool.connect(); 
    try {
        await client.query('BEGIN');
        
        const pendingQuery = `
            SELECT hs.MaHoSo, ts.SBD, ts.HoTen, ct.MaNganh 
            FROM HoSoNhapHoc hs
            JOIN ThiSinh ts ON hs.SBD = ts.SBD
            JOIN NguyenVong nv ON ts.SBD = nv.SBD AND nv.TrangThai = 1
            JOIN ChiTieuTuyenSinh ct ON nv.ID_ChiTieu = ct.ID
            WHERE hs.TrangThai = 2 
              AND NOT EXISTS (SELECT 1 FROM SinhVien sv WHERE sv.MaHoSo = hs.MaHoSo)
        `;
        const pendingStudents = await client.query(pendingQuery);

        let generatedDetails = []; 

        for (let student of pendingStudents.rows) {
            const yearPrefix = new Date().getFullYear().toString().slice(-2); 
            const seqQuery = `
                SELECT COUNT(*) + 1 as next_seq FROM SinhVien sv
                JOIN HoSoNhapHoc h ON sv.MaHoSo = h.MaHoSo
                JOIN NguyenVong n ON h.SBD = n.SBD AND n.TrangThai = 1
                JOIN ChiTieuTuyenSinh c ON n.ID_ChiTieu = c.ID
                WHERE c.MaNganh = $1
            `;
            const seqResult = await client.query(seqQuery, [student.manganh]);
            const nextSeq = seqResult.rows[0].next_seq.toString().padStart(4, '0');
            const newMSSV = `${yearPrefix}${student.manganh}${nextSeq}`; 

            await client.query(`INSERT INTO SinhVien (MSSV, MaHoSo) VALUES ($1, $2)`, [newMSSV, student.mahoso]);
            
            generatedDetails.push({
                sbd: student.sbd,
                hoTen: student.hoten,
                maNganh: student.manganh,
                mssv: newMSSV
            });
        }
        await client.query('COMMIT');
        
        res.status(200).json({ 
            message: `Cấp mã MSSV thành công cho ${generatedDetails.length} sinh viên.`,
            details: generatedDetails 
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Lỗi cấp MSSV:', error);
        res.status(500).json({ error: "Lỗi cấp MSSV. Đã rollback dữ liệu." });
    } finally {
        client.release();
    }
};

// [GET] Lấy danh sách chỉ tiêu và điểm chuẩn hiện tại
const getAllCriteria = async (req, res) => {
    try {
        let query = `
            SELECT 
                ct.ID as "idChiTieu", 
                ct.MaDot as "maDot", 
                d.TenDot as "tenDot",
                d.IsActive as "isActive",
                ct.MaNganh as "maNganh", 
                n.TenNganh as "tenNganh",
                ct.SoLuong as "soLuong", 
                ct.DiemChuan as "diemChuan"
            FROM ChiTieuTuyenSinh ct
            JOIN Nganh n ON ct.MaNganh = n.MaNganh
            JOIN DotTuyenSinh d ON ct.MaDot = d.MaDot
        `;

        // ĐỊNH TUYẾN THÔNG MINH: Nếu Cán bộ gọi API này, CHỈ lấy đợt đang mở
        if (req.originalUrl.includes('/officer/')) {
            query += ` WHERE d.IsActive = true`;
        }

        // Sắp xếp Đợt mới nhất lên đầu, sau đó xếp theo Mã ngành
        query += ` ORDER BY d.MaDot DESC, ct.MaNganh ASC`;

        const result = await pool.query(query);
        res.status(200).json({ data: result.rows });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách chỉ tiêu:', error);
        res.status(500).json({ error: "Lỗi hệ thống khi lấy danh sách chỉ tiêu" });
    }
};

// 1. [GET] Dành cho CÁN BỘ: Thống kê tác nghiệp hàng ngày
const getDashboardStats = async (req, res) => {
    try {
        // 1. Lấy danh sách Tổng thí sinh
        const listTongThiSinh = await pool.query('SELECT SBD as "sbd", HoTen as "hoTen", CCCD as "cccd", Email as "email" FROM ThiSinh ORDER BY SBD ASC');
        
        // 2. Lấy danh sách Đã trúng tuyển
        const listTrungTuyen = await pool.query(`
            SELECT DISTINCT ts.SBD as "sbd", ts.HoTen as "hoTen", ts.Email as "email", ts.SDT as "sdt" 
            FROM ThiSinh ts JOIN NguyenVong nv ON ts.SBD = nv.SBD 
            WHERE nv.TrangThai = 1 ORDER BY ts.SBD ASC
        `);

        // 3. Lấy danh sách Tổng hồ sơ
        const listHoSo = await pool.query(`
            SELECT hs.MaHoSo as "maHoSo", ts.SBD as "sbd", ts.HoTen as "hoTen", hs.TrangThai as "trangThai", hs.NgayNop as "ngayNop", ts.Email as "email"
            FROM HoSoNhapHoc hs JOIN ThiSinh ts ON hs.SBD = ts.SBD ORDER BY hs.NgayNop DESC
        `);

        // 4. Lấy danh sách Chưa nộp hồ sơ
        const listChuaNop = await pool.query(`
            SELECT DISTINCT ts.SBD as "sbd", ts.HoTen as "hoTen", ts.Email as "email", ts.SDT as "sdt"
            FROM ThiSinh ts JOIN NguyenVong nv ON ts.SBD = nv.SBD 
            WHERE nv.TrangThai = 1 AND ts.SBD NOT IN (SELECT SBD FROM HoSoNhapHoc)
            ORDER BY ts.SBD ASC
        `);

        // 5. Lấy danh sách Đã cấp MSSV
        const listDaCapMssv = await pool.query(`
            SELECT ts.SBD as "sbd", ts.HoTen as "hoTen", sv.MSSV as "mssv", ts.Email as "email"
            FROM SinhVien sv 
            JOIN HoSoNhapHoc hs ON sv.MaHoSo = hs.MaHoSo 
            JOIN ThiSinh ts ON hs.SBD = ts.SBD
            ORDER BY sv.MSSV ASC
        `);

        // Gán số lượng (Metrics)
        const tongThiSinh = listTongThiSinh.rows.length;
        const trungTuyen = listTrungTuyen.rows.length;
        const tongHoSo = listHoSo.rows.length;
        const chuaNop = listChuaNop.rows.length;
        const daCapMssv = listDaCapMssv.rows.length;

        // Xử lý biểu đồ trạng thái
        const trangThaiRes = await pool.query(`SELECT TrangThai, COUNT(*) as count FROM HoSoNhapHoc GROUP BY TrangThai`);
        let hoSoChoDuyet = 0;
        const bieuDoTrangThai = trangThaiRes.rows.map(row => {
            const count = parseInt(row.count);
            let name = 'Khác';
            if (row.trangthai === 0) name = 'Đang chuẩn bị (Nháp)';
            if (row.trangthai === 1) { name = 'Chờ phê duyệt'; hoSoChoDuyet = count; }
            if (row.trangthai === 2) name = 'Đã phê duyệt (Đủ)';
            if (row.trangthai === 3) name = 'Yêu cầu bổ sung';
            return { name, value: count, trangThai: row.trangthai };
        });

        // Xử lý lịch sử hoạt động
        const lichSuRes = await pool.query(`
            SELECT hs.MaHoSo, ts.SBD, ts.HoTen, hs.TrangThai, hs.NgayNop
            FROM HoSoNhapHoc hs JOIN ThiSinh ts ON hs.SBD = ts.SBD
            ORDER BY hs.NgayNop DESC LIMIT 8
        `);

        res.status(200).json({
            data: {
                metrics: { tongThiSinh, tongHoSo, chuaNop, hoSoChoDuyet, trungTuyen, daCapMssv },
                charts: { trangThai: bieuDoTrangThai },
                activities: lichSuRes.rows,
                // BỔ SUNG: Trả về danh sách chi tiết cho Frontend làm Popup
                details: {
                    tongThiSinh: listTongThiSinh.rows,
                    trungTuyen: listTrungTuyen.rows,
                    chuaNop: listChuaNop.rows,
                    tongHoSo: listHoSo.rows,
                    daCapMssv: listDaCapMssv.rows,
                    hoSoChoDuyet: listHoSo.rows.filter(h => h.trangThai === 1) // Lọc riêng hồ sơ đang chờ duyệt
                }
            }
        });
    } catch (error) {
        console.error('Lỗi lấy thống kê dashboard Cán bộ:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};

// 2. [GET] Dành cho ADMIN: Thống kê phân tích BI
const getAdminDashboardStats = async (req, res) => {
    try {
        const activeDotRes = await pool.query('SELECT MaDot, TenDot FROM DotTuyenSinh WHERE IsActive = true LIMIT 1');
        if (activeDotRes.rows.length === 0) return res.status(200).json({ data: null, message: 'Chưa có đợt.' });
        
        const maDot = activeDotRes.rows[0].madot;
        const tenDot = activeDotRes.rows[0].tendot;

        const tongThiSinhRes = await pool.query('SELECT COUNT(*) FROM ThiSinh');
        const tongThiSinh = parseInt(tongThiSinhRes.rows[0].count);

        const chiTieuRes = await pool.query('SELECT SUM(SoLuong) as tong_chi_tieu FROM ChiTieuTuyenSinh WHERE MaDot = $1', [maDot]);
        const tongChiTieu = parseInt(chiTieuRes.rows[0].tong_chi_tieu || 0);

        const trungTuyenRes = await pool.query(`
            SELECT COUNT(DISTINCT nv.SBD) FROM NguyenVong nv JOIN ChiTieuTuyenSinh ct ON nv.ID_ChiTieu = ct.ID 
            WHERE nv.TrangThai = 1 AND ct.MaDot = $1
        `, [maDot]);
        const trungTuyen = parseInt(trungTuyenRes.rows[0].count);

        const hoSoRes = await pool.query('SELECT COUNT(*) FROM HoSoNhapHoc');
        const tongHoSo = parseInt(hoSoRes.rows[0].count);

        const mssvRes = await pool.query('SELECT COUNT(*) FROM SinhVien');
        const daCapMssv = parseInt(mssvRes.rows[0].count);

        const funnelData = [
            { stage: '1. Đăng ký', value: tongThiSinh }, { stage: '2. Đậu NV', value: trungTuyen },
            { stage: '3. Tạo HS', value: tongHoSo }, { stage: '4. Nhập học', value: daCapMssv }
        ];

        const passFailData = [
            { name: 'Trúng tuyển', value: trungTuyen, fill: '#10B981' },
            { name: 'Không trúng tuyển', value: tongThiSinh - trungTuyen > 0 ? tongThiSinh - trungTuyen : 0, fill: '#EF4444' }
        ];

        const topCompetitiveRes = await pool.query(`
            SELECT n.MaNganh, ct.SoLuong as "chiTieu", COUNT(nv.SBD) as "soNguoiDK"
            FROM ChiTieuTuyenSinh ct JOIN Nganh n ON ct.MaNganh = n.MaNganh LEFT JOIN NguyenVong nv ON ct.ID = nv.ID_ChiTieu
            WHERE ct.MaDot = $1 GROUP BY n.MaNganh, ct.SoLuong ORDER BY "soNguoiDK" DESC LIMIT 5
        `, [maDot]);
        const topCompetitiveData = topCompetitiveRes.rows.map(row => ({
            name: row.manganh, 'Đăng ký': parseInt(row.soNguoiDK), 'Chỉ tiêu': parseInt(row.chiTieu),
            tiLeChoi: parseFloat((row.soNguoiDK / (row.chiTieu || 1)).toFixed(2))
        }));

        const phoDiemRes = await pool.query(`
            SELECT DiemTong FROM NguyenVong nv JOIN ChiTieuTuyenSinh ct ON nv.ID_ChiTieu = ct.ID
            WHERE ct.MaDot = $1 AND nv.ThuTuUuTien = 1
        `, [maDot]);
        const phoDiemCounts = { '<15': 0, '15-18': 0, '18-21': 0, '21-24': 0, '24-27': 0, '>27': 0 };
        phoDiemRes.rows.forEach(r => {
            const diem = parseFloat(r.diemtong);
            if (diem < 15) phoDiemCounts['<15']++; else if (diem < 18) phoDiemCounts['15-18']++;
            else if (diem < 21) phoDiemCounts['18-21']++; else if (diem < 24) phoDiemCounts['21-24']++;
            else if (diem < 27) phoDiemCounts['24-27']++; else phoDiemCounts['>27']++;
        });
        const phoDiemData = Object.keys(phoDiemCounts).map(k => ({ range: k, count: phoDiemCounts[k] }));

        const khuVucRes = await pool.query(`
            SELECT ct.MaNganh, ts.KhuVuc, COUNT(ts.SBD) FROM NguyenVong nv
            JOIN ChiTieuTuyenSinh ct ON nv.ID_ChiTieu = ct.ID JOIN ThiSinh ts ON nv.SBD = ts.SBD
            WHERE ct.MaDot = $1 GROUP BY ct.MaNganh, ts.KhuVuc
        `, [maDot]);
        const khuVucMap = {};
        khuVucRes.rows.forEach(r => {
            if (!khuVucMap[r.manganh]) khuVucMap[r.manganh] = { name: r.manganh, KV1: 0, KV2: 0, KV2NT: 0, KV3: 0 };
            khuVucMap[r.manganh][r.khuvuc] = parseInt(r.count);
        });

        res.status(200).json({
            data: {
                activeDot: tenDot,
                kpis: {
                    tongThiSinh, tongChiTieu, trungTuyen,
                    tiLeChoi: tongChiTieu > 0 ? (tongThiSinh / tongChiTieu).toFixed(2) : 0,
                    tiLeLapDay: tongChiTieu > 0 ? Math.round((trungTuyen / tongChiTieu) * 100) : 0
                },
                charts: { funnel: funnelData, passFail: passFailData, topCompetitive: topCompetitiveData, phoDiem: phoDiemData, khuVuc: Object.values(khuVucMap) }
            }
        });
    } catch (error) { res.status(500).json({ message: 'Lỗi hệ thống.' }); }
};

// ========================================================
// 3. CÁC UC ĐỘC QUYỀN CHO ADMIN (UC 8, 9, 10)
// ========================================================

// --- UC08: QUẢN LÝ TÀI KHOẢN CÁN BỘ ---
const getAllOfficers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT MaNhanVien AS "id", HoTen AS "name", Email AS "email", IsLocked AS "isLocked" 
             FROM NhanVien WHERE MaNhom = 2 ORDER BY MaNhanVien ASC`
        );
        res.status(200).json({ data: result.rows });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi không thể lấy danh sách cán bộ.' });
    }
};

const createOfficer = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu.' });
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const result = await pool.query(
            `INSERT INTO NhanVien (HoTen, Email, MatKhau, MaNhom) VALUES ($1, $2, $3, 2) RETURNING MaNhanVien, HoTen, Email`,
            [name, email, hashedPassword]
        );
        res.status(201).json({ message: 'Tạo tài khoản cán bộ thành công!', data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') return res.status(400).json({ message: 'Email này đã tồn tại trên hệ thống.' });
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo tài khoản.' });
    }
};

const toggleLockOfficer = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `UPDATE NhanVien SET IsLocked = NOT IsLocked WHERE MaNhanVien = $1 RETURNING MaNhanVien, IsLocked`,
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
        res.status(200).json({ message: 'Cập nhật trạng thái khóa tài khoản thành công.', data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật khóa tài khoản.' });
    }
};

// --- UC09: QUẢN LÝ DANH MỤC NGÀNH/KHOA ---
const createNganhCatalog = async (req, res) => {
    const { maNganh, tenNganh, maKhoa } = req.body;
    try {
        const checkExist = await pool.query('SELECT MaNganh FROM Nganh WHERE MaNganh = $1', [maNganh.toUpperCase()]);
        if (checkExist.rows.length > 0) {
            return res.status(400).json({ error: 'Mã ngành này đã tồn tại trong hệ thống!' });
        }

        await pool.query(
            `INSERT INTO Nganh (MaNganh, TenNganh, MaKhoa) VALUES ($1, $2, $3)`,
            [maNganh.toUpperCase(), tenNganh, maKhoa]
        );
        res.status(201).json({ message: 'Thêm ngành học vào danh mục thành công.' });
    } catch (error) {
        console.error('Lỗi thêm ngành:', error);
        res.status(500).json({ error: 'Lỗi hệ thống khi thêm ngành danh mục.' });
    }
};

const updateNganhCatalog = async (req, res) => {
    const { id } = req.params; 
    const { tenNganh, maKhoa } = req.body;
    try {
        await pool.query(
            `UPDATE Nganh SET TenNganh = $1, MaKhoa = $2 WHERE MaNganh = $3`,
            [tenNganh, maKhoa, id]
        );
        res.status(200).json({ message: 'Cập nhật thông tin ngành thành công.' });
    } catch (error) {
        console.error('Lỗi cập nhật ngành:', error);
        res.status(500).json({ error: 'Lỗi hệ thống khi cập nhật thông tin ngành.' });
    }
};

const deleteNganhCatalog = async (req, res) => {
    const { id } = req.params;
    try {
        const checkUsage = await pool.query('SELECT ID FROM ChiTieuTuyenSinh WHERE MaNganh = $1 LIMIT 1', [id]);
        if (checkUsage.rows.length > 0) {
            return res.status(400).json({ error: 'Không thể xóa! Ngành học này đang được sử dụng trong các Đợt Tuyển Sinh.' });
        }

        await pool.query(`DELETE FROM Nganh WHERE MaNganh = $1`, [id]);
        res.status(200).json({ message: 'Đã xóa ngành học khỏi hệ thống thành công.' });
    } catch (error) {
        console.error('Lỗi xóa ngành:', error);
        res.status(500).json({ error: 'Lỗi hệ thống khi xóa ngành.' });
    }
};

// --- UC10: QUẢN LÝ ĐỢT TUYỂN SINH VÀ CHỈ TIÊU ---
const createDotTuyenSinh = async (req, res) => {
    const { tenDot, namHoc } = req.body;
    try {
        await pool.query(`UPDATE DotTuyenSinh SET IsActive = FALSE`);
        const result = await pool.query(
            `INSERT INTO DotTuyenSinh (TenDot, NamHoc, IsActive) VALUES ($1, $2, TRUE) RETURNING *`,
            [tenDot, namHoc]
        );
        res.status(201).json({ message: 'Khởi tạo đợt tuyển sinh mới thành công.', data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi khởi tạo đợt tuyển sinh.' });
    }
};

const addChiTieu = async (req, res) => {
    const { maDot, maNganh, soLuong } = req.body;
    try {
        const checkQuery = 'SELECT ID FROM ChiTieuTuyenSinh WHERE MaDot = $1 AND MaNganh = $2';
        const checkResult = await pool.query(checkQuery, [maDot, maNganh]);

        if (checkResult.rows.length > 0) {
            const updateQuery = 'UPDATE ChiTieuTuyenSinh SET SoLuong = $1 WHERE MaDot = $2 AND MaNganh = $3 RETURNING *';
            const updateResult = await pool.query(updateQuery, [soLuong, maDot, maNganh]);
            res.status(200).json({ message: 'Đã cập nhật lại số lượng chỉ tiêu thành công.', data: updateResult.rows[0] });
        } else {
            const insertQuery = 'INSERT INTO ChiTieuTuyenSinh (MaDot, MaNganh, SoLuong) VALUES ($1, $2, $3) RETURNING *';
            const insertResult = await pool.query(insertQuery, [maDot, maNganh, soLuong]);
            res.status(201).json({ message: 'Phân bổ chỉ tiêu mới thành công.', data: insertResult.rows[0] });
        }
    } catch (error) {
        console.error('Lỗi khi cấu hình chỉ tiêu:', error);
        res.status(500).json({ message: 'Lỗi khi cấu hình chỉ tiêu.' });
    }
};
const resetOfficerPassword = async (req, res) => {
    const { id } = req.params; 

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash('123456', saltRounds);

        const updateQuery = 'UPDATE NhanVien SET MatKhau = $1 WHERE MaNhanVien = $2 RETURNING *';
        const result = await pool.query(updateQuery, [hashedPassword, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản cán bộ.' });
        }

        res.status(200).json({ message: 'Đặt lại mật khẩu thành công (Mật khẩu mới: 123456).' });
    } catch (error) {
        console.error('Lỗi tại resetOfficerPassword:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};

const getAllDots = async (req, res) => {
    try {
        const query = `
            SELECT MaDot as "id", TenDot as "tenDot", NamHoc as "namHoc", IsActive as "isActive" 
            FROM DotTuyenSinh ORDER BY MaDot DESC
        `;
        const result = await pool.query(query);
        res.status(200).json({ data: result.rows });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đợt:', error);
        res.status(500).json({ error: "Lỗi hệ thống khi lấy danh sách đợt" });
    }
};

const getAllNganh = async (req, res) => {
    try {
        const query = 'SELECT MaNganh AS "maNganh", TenNganh AS "tenNganh", MaKhoa AS "maKhoa" FROM Nganh ORDER BY TenNganh ASC';
        const result = await pool.query(query);
        res.status(200).json({ data: result.rows });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách ngành:', error);
        res.status(500).json({ error: "Lỗi hệ thống khi lấy danh sách ngành" });
    }
};

const importCandidates = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Vui lòng đính kèm một file Excel (.xlsx hoặc .xls).' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN'); 

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = xlsx.utils.sheet_to_json(sheet);

        const importedDetails = [];

        for (const row of rawData) {
            const sbd = row['SBD'] || row['Số báo danh'];
            const cccd = row['CCCD'] || row['Số CCCD'] || row['CMND'];
            const hoTen = row['HoTen'] || row['Họ tên'] || row['Họ và tên'];
            const ngaySinh = row['NgaySinh'] || row['Ngày sinh'];
            const gioiTinh = row['GioiTinh'] || row['Giới tính'] === 'Nam' || row['Giới tính'] === true;
            const email = row['Email'];
            const sdt = row['SDT'] || row['Số điện thoại'] || row['SĐT'];
            const khuVuc = row['KhuVuc'] || row['Khu vực'] || 'KV3';

            if (!sbd || !cccd || !hoTen || !email) continue;

            const insertThiSinhQuery = `
                INSERT INTO ThiSinh (SBD, CCCD, HoTen, NgaySinh, GioiTinh, Email, SDT, KhuVuc)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (SBD) DO UPDATE 
                SET CCCD = EXCLUDED.CCCD, HoTen = EXCLUDED.HoTen, NgaySinh = EXCLUDED.NgaySinh, 
                    GioiTinh = EXCLUDED.GioiTinh, Email = EXCLUDED.Email, SDT = EXCLUDED.SDT, KhuVuc = EXCLUDED.KhuVuc
                RETURNING *;
            `;
            const tsResult = await client.query(insertThiSinhQuery, [sbd, cccd, hoTen, ngaySinh, gioiTinh, email, sdt, khuVuc]);
            const savedSBD = tsResult.rows[0].sbd;

            const scoreColumns = Object.keys(row).filter(key => key.toUpperCase().startsWith('DIEM_'));
            
            for (const col of scoreColumns) {
                const maMon = col.split('_')[1].toUpperCase(); 
                const diem = parseFloat(row[col]);
                
                if (!isNaN(diem)) {
                    await client.query('DELETE FROM ChiTietDiem WHERE SBD = $1 AND MaMon = $2', [savedSBD, maMon]);
                    await client.query('INSERT INTO ChiTietDiem (SBD, MaMon, Diem) VALUES ($1, $2, $3)', [savedSBD, maMon, diem]);
                }
            }

            const maNganh = row['MaNganh'] || row['Mã ngành'];
            const diemTong = parseFloat(row['DiemTong'] || row['Điểm tổng']);

            if (maNganh && !isNaN(diemTong)) {
                const activeDotRes = await client.query('SELECT MaDot FROM DotTuyenSinh WHERE IsActive = true LIMIT 1');
                
                if (activeDotRes.rows.length > 0) {
                    const activeDotId = activeDotRes.rows[0].madot;

                    const checkChiTieu = await client.query(
                        'SELECT ID FROM ChiTieuTuyenSinh WHERE MaDot = $1 AND MaNganh = $2', 
                        [activeDotId, maNganh.toUpperCase()]
                    );

                    if (checkChiTieu.rows.length > 0) {
                        const idChiTieu = checkChiTieu.rows[0].id;
                        
                        await client.query('DELETE FROM NguyenVong WHERE SBD = $1 AND ThuTuUuTien = 1', [savedSBD]);
                        await client.query('DELETE FROM NguyenVong WHERE SBD = $1 AND ID_ChiTieu = $2', [savedSBD, idChiTieu]);
                        
                        await client.query(
                            'INSERT INTO NguyenVong (SBD, ID_ChiTieu, ThuTuUuTien, DiemTong, TrangThai) VALUES ($1, $2, $3, $4, 0)', 
                            [savedSBD, idChiTieu, 1, diemTong]
                        );
                    } else {
                        console.warn(`[Cảnh báo] Bỏ qua nguyện vọng của SBD ${savedSBD}: Ngành ${maNganh} chưa được mở chỉ tiêu trong đợt này.`);
                    }
                }
            }

            importedDetails.push({
                sbd: savedSBD,
                hoTen: tsResult.rows[0].hoten,
                email: tsResult.rows[0].email,
                khuVuc: tsResult.rows[0].khuvuc
            });
        }

        await client.query('COMMIT');
        
        res.status(200).json({
            message: `Đã nhập thành công ${importedDetails.length} hồ sơ (Bao gồm thông tin cá nhân, điểm thành phần và nguyện vọng).`,
            details: importedDetails 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Lỗi thực thi import file Excel:', error);
        res.status(500).json({ error: 'Lỗi máy chủ khi bóc tách file Excel. Chi tiết: ' + error.message });
    } finally {
        client.release();
    }
};

const getAllKhoa = async (req, res) => {
    try {
        const result = await pool.query('SELECT MaKhoa AS "maKhoa", TenKhoa AS "tenKhoa" FROM Khoa ORDER BY TenKhoa ASC');
        res.status(200).json({ data: result.rows });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách khoa." });
    }
};

const createKhoa = async (req, res) => {
    const { maKhoa, tenKhoa } = req.body;
    try {
        await pool.query('INSERT INTO Khoa (MaKhoa, TenKhoa) VALUES ($1, $2)', [maKhoa.toUpperCase(), tenKhoa]);
        res.status(201).json({ message: 'Thêm khoa thành công.' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi thêm khoa.' });
    }
};

const updateKhoa = async (req, res) => {
    const { id } = req.params; 
    const { tenKhoa } = req.body;
    try {
        await pool.query(
            'UPDATE Khoa SET TenKhoa = $1 WHERE MaKhoa = $2',
            [tenKhoa, id.toUpperCase()]
        );
        res.status(200).json({ message: 'Cập nhật thông tin Khoa thành công.' });
    } catch (error) {
        console.error('Lỗi cập nhật khoa:', error);
        res.status(500).json({ error: 'Lỗi hệ thống khi cập nhật thông tin khoa.' });
    }
};

const deleteKhoa = async (req, res) => {
    const { id } = req.params;
    try {
        const checkUsage = await pool.query('SELECT MaNganh FROM Nganh WHERE MaKhoa = $1 LIMIT 1', [id]);
        if (checkUsage.rows.length > 0) {
            return res.status(400).json({ 
                error: 'Không thể xóa! Khoa này đang có các ngành học trực thuộc. Hãy xóa hoặc chuyển ngành sang khoa khác trước.' 
            });
        }

        await pool.query('DELETE FROM Khoa WHERE MaKhoa = $1', [id]);
        res.status(200).json({ message: 'Đã xóa khoa khỏi danh mục hệ thống thành công.' });
    } catch (error) {
        console.error('Lỗi xóa khoa:', error);
        res.status(500).json({ error: 'Lỗi hệ thống khi xóa khoa.' });
    }
};

module.exports = {
    getPendingApplications,
    getApplicationDetails,
    reviewApplication,
    getAllCriteria,
    updateDiemChuan,
    processAdmissions,
    generateStudentIds,
    getAdmittedStudents,
    getDashboardStats,
    // Xuất bản thêm các hàm Admin độc quyền
    getAllOfficers,
    createOfficer,
    toggleLockOfficer,
    createNganhCatalog,
    createDotTuyenSinh,
    addChiTieu,
    resetOfficerPassword,
    getAllDots,
    getAllNganh,
    importCandidates,
    updateNganhCatalog,
    deleteNganhCatalog,
    getAllKhoa,
    createKhoa,
    updateKhoa,
    deleteKhoa,
    getAdminDashboardStats
};