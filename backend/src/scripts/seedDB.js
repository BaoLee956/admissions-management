require('dotenv').config();
const { pool } = require('../config/database');

const seedCandidates = async () => {
    const loaiGiayToData = [
        { MaLoai: 'CCCD', TenLoai: 'Căn cước công dân', BatBuoc: true },
        { MaLoai: 'HOC_BA', TenLoai: 'Học bạ THPT', BatBuoc: true },
        { MaLoai: 'GIAY_BAO', TenLoai: 'Giấy chứng nhận tốt nghiệp', BatBuoc: true }
    ];
    
    const candidates = [
        { SBD: 'TS001', CCCD: '001082000001', HoTen: 'Nguyễn Văn An', NgaySinh: '2005-01-15', GioiTinh: 'Nam', Email: 'nguyenvanan.test@yopmail.com', SDT: '0901111222', KhuVuc: 'KV1' },
        { SBD: 'TS002', CCCD: '001082000002', HoTen: 'Trần Thị Bình', NgaySinh: '2005-02-20', GioiTinh: 'Nữ', Email: 'tranthibinh.test@yopmail.com', SDT: '0902222333', KhuVuc: 'KV2' },
        { SBD: 'TS003', CCCD: '001082000003', HoTen: 'Lê Hoàng Cường', NgaySinh: '2005-03-25', GioiTinh: 'Nam', Email: 'lehoangcuong.test@yopmail.com', SDT: '0903333444', KhuVuc: 'KV3' },
        { SBD: 'TS004', CCCD: '001082000004', HoTen: 'Phạm Thị Dung', NgaySinh: '2005-04-10', GioiTinh: 'Nữ', Email: 'phamthidung.test@yopmail.com', SDT: '0904444555', KhuVuc: 'KV2NT' },
        { SBD: 'TS005', CCCD: '001082000005', HoTen: 'Hoàng Văn Em', NgaySinh: '2005-05-05', GioiTinh: 'Nam', Email: 'hoangvanem.test@yopmail.com', SDT: '0905555666', KhuVuc: 'KV1' },
        { SBD: 'TS006', CCCD: '001082000006', HoTen: 'Vũ Thị Phượng', NgaySinh: '2005-06-18', GioiTinh: 'Nữ', Email: 'vuthiphuong.test@yopmail.com', SDT: '0906666777', KhuVuc: 'KV2' },
        { SBD: 'TS007', CCCD: '001082000007', HoTen: 'Đặng Văn Giang', NgaySinh: '2005-07-22', GioiTinh: 'Nam', Email: 'dangvangiang.test@yopmail.com', SDT: '0907777888', KhuVuc: 'KV3' },
        { SBD: 'TS008', CCCD: '001082000008', HoTen: 'Bùi Thị Hồng', NgaySinh: '2005-08-30', GioiTinh: 'Nữ', Email: 'buithihong.test@yopmail.com', SDT: '0908888999', KhuVuc: 'KV1' },
        { SBD: 'TS009', CCCD: '001082000009', HoTen: 'Đỗ Văn Ích', NgaySinh: '2005-09-12', GioiTinh: 'Nam', Email: 'dovanich.test@yopmail.com', SDT: '0909999000', KhuVuc: 'KV2' },
        { SBD: 'TS010', CCCD: '001082000010', HoTen: 'Ngô Kiều Oanh', NgaySinh: '2005-10-08', GioiTinh: 'Nữ', Email: 'hellotuilabao@gmail.com', SDT: '0900000111', KhuVuc: 'KV3' },
    ];

    try {
        console.log('⏳ Đang tiến hành đồng bộ dữ liệu thí sinh mẫu vào Database...');
        for (const loai of loaiGiayToData) {
            const queryLoai = `
                INSERT INTO LoaiGiayTo (MaLoai, TenLoai, BatBuoc)
                VALUES ($1, $2, $3)
                ON CONFLICT (MaLoai) DO UPDATE SET 
                    TenLoai = EXCLUDED.TenLoai,
                    BatBuoc = EXCLUDED.BatBuoc;
            `;
            await pool.query(queryLoai, [loai.MaLoai, loai.TenLoai, loai.BatBuoc]);
        }
        console.log('✅ Đã nạp thành công Danh mục Loại Giấy tờ!');

        for (const candidate of candidates) {
            // Câu lệnh UPSERT: Chèn mới, nếu trùng SBD thì cập nhật TOÀN BỘ các trường còn lại
            const query = `
                INSERT INTO ThiSinh (SBD, CCCD, HoTen, NgaySinh, GioiTinh, Email, SDT, KhuVuc)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (SBD) DO UPDATE SET 
                    CCCD = EXCLUDED.CCCD,
                    HoTen = EXCLUDED.HoTen,
                    NgaySinh = EXCLUDED.NgaySinh,
                    GioiTinh = EXCLUDED.GioiTinh,
                    Email = EXCLUDED.Email,
                    SDT = EXCLUDED.SDT,
                    KhuVuc = EXCLUDED.KhuVuc;
            `;
            
            const isMale = candidate.GioiTinh === 'Nam'; 

            const values = [
                candidate.SBD, candidate.CCCD, candidate.HoTen, candidate.NgaySinh,
                isMale, 
                candidate.Email, candidate.SDT, candidate.KhuVuc
            ];
            
            await pool.query(query, values);
        }

        console.log('✅ Đã nạp và cập nhật thành công 10 thí sinh mẫu!');
    } catch (error) {
        console.error('❌ Lỗi khi nạp dữ liệu (Seed Data):', error.message);
    } finally {
        await pool.end();
        console.log('👋 Đã đóng kết nối Database.');
    }
};

seedCandidates();