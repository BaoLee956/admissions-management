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
  Loader2 
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
      // CHUẨN HÓA: Lấy đúng mảng dữ liệu từ response.data.data
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

  // Gọi API Cấp MSSV Hàng loạt
  const handleGenerateMSSV = async () => {
    setIsGenerating(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post('/officer/onboarding/generate-mssv', {}, getAuthHeader());
      setMessage({ type: 'success', text: res.data.message || 'Cấp mã MSSV thành công!' });
      await fetchStudents(); // Tự động reload lại bảng sau khi cấp thành công
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Lỗi khi thực hiện cấp mã.' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = (hoTen) => {
    alert(`Tính năng in Giấy báo nhập học cho sinh viên ${hoTen} đang được xây dựng!`);
  };

  // Logic Thống kê
  const totalAdmitted = students.length;
  const totalGenerated = students.filter(s => s.daCapMa === 1).length;
  const totalPending = totalAdmitted - totalGenerated;

  // Logic Tìm kiếm
  const filteredStudents = students.filter(s => 
    s.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.sbd.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tiếp nhận Sinh viên (UC6)</h1>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý quy trình nhập học, cấp thẻ sinh viên và in giấy báo
        </p>
      </div>

      {/* Thông báo lỗi/thành công */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Thống kê Tổng quan (Overview Cards) */}
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

      {/* Action Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#b71a22] focus:border-transparent bg-gray-50"
            placeholder="Tìm kiếm theo Tên hoặc SBD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={handleGenerateMSSV}
          disabled={isGenerating || totalPending === 0}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#b71a22] hover:bg-red-800 text-white font-medium rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
          Thực hiện Cấp MSSV Hàng loạt
        </button>
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 py-20">
            <Loader2 className="animate-spin" size={32} />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 py-20">
            <Search size={48} className="text-gray-300" />
            <p className="text-lg font-medium text-gray-600">Không tìm thấy dữ liệu</p>
            <p className="text-sm">Không có sinh viên nào khớp với tìm kiếm của bạn.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">SBD</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Họ Tên</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã Ngành</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên Ngành</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Trạng Thái</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStudents.map((student, idx) => (
                  <tr key={idx} className="hover:bg-red-50/30 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-gray-900">{student.sbd}</td>
                    <td className="py-4 px-6 text-sm text-gray-700 font-medium">{student.hoTen}</td>
                    <td className="py-4 px-6 text-sm text-gray-500">{student.maNganh}</td>
                    <td className="py-4 px-6 text-sm text-blue-600 font-medium">{student.tenNganh}</td>
                    <td className="py-4 px-6 text-center">
                      {student.daCapMa === 1 ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
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
                        onClick={() => handlePrint(student.hoTen)}
                        disabled={student.daCapMa === 0}
                        title={student.daCapMa === 0 ? "Chưa có MSSV để in" : "In giấy báo nhập học"}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-[#b71a22] hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-colors"
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