import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  Search, 
  Wand2, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Download
} from 'lucide-react';
import api from '../../utils/api';

const OfficerOnboarding = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/officer/onboarding/students', getAuthHeader());
      const studentData = response.data.data || [];
      setStudents(studentData);
    } catch (error) {
      console.error('Lỗi khi tải danh sách đủ điều kiện nhập học:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1. Chức năng Cấp MSSV Hàng loạt
  const handleGenerateMSSV = async () => {
    setIsGenerating(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post('/officer/onboarding/generate-mssv', {}, getAuthHeader());
      setMessage({ type: 'success', text: res.data.message || 'Cấp mã MSSV thành công!' });
      await fetchStudents(); 
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Lỗi khi thực hiện cấp mã.' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Chức năng Sinh mẫu HTML động để in Giấy báo nhập học
  const handlePrint = (student) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <title>Giấy Báo Nhập Học - ${student.hoTen}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman:wght@400;700&display=swap');
                body {
                    font-family: 'Times New Roman', Times, serif;
                    line-height: 1.5;
                    margin: 0;
                    padding: 40px 60px;
                    color: #000;
                }
                .header-container {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 40px;
                    text-align: center;
                }
                .header-left { width: 40%; }
                .header-right { width: 55%; }
                .title {
                    text-align: center;
                    font-size: 24px;
                    font-weight: bold;
                    color: #b71a22;
                    margin: 30px 0;
                    text-transform: uppercase;
                }
                .content { font-size: 16px; text-align: justify; }
                .highlight { font-weight: bold; font-size: 18px; }
                .footer { margin-top: 50px; display: flex; justify-content: flex-end; text-align: center; }
                .signature-box { width: 40%; }
                @media print {
                    @page { margin: 2cm; size: A4 portrait; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="header-container">
                <div class="header-left">
                    <div style="font-weight: bold;">BỘ THÔNG TIN VÀ TRUYỀN THÔNG</div>
                    <div style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; display: inline-block;">
                        HỌC VIỆN CÔNG NGHỆ<br>BƯU CHÍNH VIỄN THÔNG
                    </div>
                </div>
                <div class="header-right">
                    <div style="font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                    <div style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; display: inline-block;">
                        Độc lập - Tự do - Hạnh phúc
                    </div>
                </div>
            </div>

            <div class="title">
                GIẤY BÁO TRÚNG TUYỂN VÀ GỌI NHẬP HỌC<br>
                <span style="font-size: 16px; color: #000; font-weight: normal;">Hệ Đại học Chính quy</span>
            </div>

            <div class="content">
                <p>Hội đồng Tuyển sinh Học viện Công nghệ Bưu chính Viễn thông trân trọng thông báo:</p>
                <table style="width: 100%; margin-top: 20px; border-collapse: collapse; font-size: 16px;">
                    <tr>
                        <td style="padding: 8px 0; width: 30%;">Anh/Chị:</td>
                        <td style="padding: 8px 0;" class="highlight">${student.hoTen}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;">Số báo danh:</td>
                        <td style="padding: 8px 0;" class="highlight">${student.sbd}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;">Đã trúng tuyển vào Ngành:</td>
                        <td style="padding: 8px 0;" class="highlight">${student.tenNganh}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;">Mã số sinh viên (MSSV):</td>
                        <td style="padding: 8px 0; color: #b71a22;" class="highlight">${student.mssv || 'Chưa cấp'}</td>
                    </tr>
                </table>

                <p style="margin-top: 30px;">
                    Yêu cầu Anh/Chị mang theo giấy báo này cùng với các hồ sơ minh chứng bản gốc đến làm thủ tục nhập học theo đúng thời gian và địa điểm quy định của nhà trường.
                </p>
            </div>

            <div class="footer">
                <div class="signature-box">
                    <p>Hồ Chí Minh, ngày ${day} tháng ${month} năm ${year}</p>
                    <p style="font-weight: bold; margin-bottom: 80px;">CHỦ TỊCH HỘI ĐỒNG TUYỂN SINH</p>
                    <p style="font-weight: bold;">(Đã ký)</p>
                </div>
            </div>
        </body>
        </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }, 500);
  };

  // 3. Chức năng Xuất danh sách sinh viên ra file Excel (.xls) theo bộ lọc hiện tại
  const handleExportExcel = () => {
    if (filteredStudents.length === 0) {
      alert('Danh sách hiện tại đang trống, không có dữ liệu để xuất Excel!');
      return;
    }

    // ĐÃ BỔ SUNG CẤU HÌNH FONT CHỮ TIMES NEW ROMAN VÀ CỠ CHỮ 12 CHO TOÀN BỘ BẢNG
    const htmlTable = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
          <meta charset="utf-8" />
          <style>
              body, table, th, td { font-family: "Times New Roman", Times, serif; font-size: 12pt; }
              th { background-color: #1f2937; color: white; font-weight: bold; border: 1px solid #ccc; text-align: left; padding: 8px; }
              td { border: 1px solid #ccc; padding: 6px; }
          </style>
      </head>
      <body>
          <table>
              <thead>
                  <tr>
                      <th>Số Báo Danh (SBD)</th>
                      <th>Họ và Tên</th>
                      <th>Mã Ngành</th>
                      <th>Tên Ngành</th>
                      <th>Mã Số Sinh Viên (MSSV)</th>
                      <th>Trạng Thái</th>
                  </tr>
              </thead>
              <tbody>
                  ${filteredStudents.map(student => `
                      <tr>
                          <td>${student.sbd}</td>
                          <td>${student.hoTen}</td>
                          <td>${student.maNganh}</td>
                          <td>${student.tenNganh}</td>
                          <td style="font-weight: bold; color: ${student.mssv ? '#15803d' : '#000'}">${student.mssv || 'Chưa cấp'}</td>
                          <td>${student.daCapMa === 1 ? 'Đã cấp MSSV' : 'Chờ cấp mã'}</td>
                      </tr>
                  `).join('')}
              </tbody>
          </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    
    const formattedDate = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    link.setAttribute('download', `Danh_sach_tiep_nhan_sinh_vien_${formattedDate}.xls`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Logic Thống kê số liệu
  const totalAdmitted = students.length;
  const totalGenerated = students.filter(s => s.daCapMa === 1).length;
  const totalPending = totalAdmitted - totalGenerated;

  // Logic Tìm kiếm thời gian thực
  const filteredStudents = students.filter(s => 
    s.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.sbd.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 text-gray-900">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tiếp nhận Sinh viên (UC6)</h1>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý quy trình nhập học, cấp thẻ sinh viên và in giấy báo
        </p>
      </div>

      {/* Thông báo trạng thái hệ thống */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Khối thẻ Thống kê Tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Đủ điều kiện nhập học</p>
            <p className="text-2xl font-bold text-gray-900">{totalAdmitted}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Đã cấp MSSV</p>
            <p className="text-2xl font-bold text-gray-900">{totalGenerated}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
            <UserMinus size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Chờ cấp mã</p>
            <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
          </div>
        </div>
      </div>

      {/* Thanh công cụ (Action Bar) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Ô tìm kiếm */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#b71a22] focus:border-transparent bg-gray-50 outline-none text-sm"
            placeholder="Tìm kiếm theo Tên hoặc SBD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Cụm nút hành động bên phải */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={handleExportExcel}
            disabled={loading || filteredStudents.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Download size={18} />
            Xuất Excel
          </button>

          <button
            onClick={handleGenerateMSSV}
            disabled={isGenerating || totalPending === 0}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#b71a22] hover:bg-red-800 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shrink-0"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
            Thực hiện Cấp MSSV Hàng loạt
          </button>
        </div>
      </div>

      {/* Bảng Hiển thị Danh sách Dữ liệu */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 py-20">
            <Loader2 className="animate-spin text-[#b71a22]" size={32} />
            <p>Đang tải dữ liệu sinh viên nhập học...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 py-20">
            <Search size={48} className="text-gray-300" />
            <p className="text-lg font-medium text-gray-600">Không tìm thấy dữ liệu</p>
            <p className="text-sm">Không có sinh viên nào khớp với từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">SBD</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Họ Tên</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Mã Ngành</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Tên Ngành</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Trạng Thái / MSSV</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStudents.map((student, idx) => (
                  <tr key={student.sbd || idx} className="hover:bg-red-50/20 transition-colors">
                    <td className="py-4 px-6 text-sm font-bold text-gray-900">{student.sbd}</td>
                    <td className="py-4 px-6 text-sm text-gray-700 font-semibold">{student.hoTen}</td>
                    <td className="py-4 px-6 text-sm text-gray-500 font-mono">{student.maNganh}</td>
                    <td className="py-4 px-6 text-sm text-indigo-600 font-semibold">{student.tenNganh}</td>
                    <td className="py-4 px-6 text-center">
                      {student.daCapMa === 1 ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 shadow-sm">
                          {student.mssv}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                          Chờ cấp mã
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handlePrint(student)}
                        disabled={student.daCapMa === 0}
                        title={student.daCapMa === 0 ? "Chưa có sinh viên chính thức để in" : "In giấy báo nhập học"}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-[#b71a22] hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors shadow-sm border border-transparent hover:border-red-100"
                      >
                        <Printer size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerOnboarding;