import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Search, 
  Eye, 
  X, 
  FileText, 
  Loader2, 
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import api from '../../utils/api';

const OfficerApplications = () => {
  // States cho Danh sách hồ sơ (UC3)
  const [applications, setApplications] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // States cho Modal Chi tiết & Phê duyệt (UC4)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hàm tạo Authorization Header theo yêu cầu
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // 1. Tải danh sách hồ sơ chờ duyệt
  const fetchPendingApplications = async () => {
    setLoadingList(true);
    try {
      const response = await api.get('/officer/applications/pending', {
        headers: getAuthHeader()
      });
      // Giả sử API trả về mảng trực tiếp hoặc nằm trong response.data.data
      const data = response.data?.data || response.data || [];
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách hồ sơ chờ duyệt:', error);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPendingApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter danh sách theo Tên hoặc SBD
  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return applications;
    const q = searchQuery.toLowerCase();
    return applications.filter(app => 
      (app.sbd && app.sbd.toLowerCase().includes(q)) ||
      (app.hoTen && app.hoTen.toLowerCase().includes(q)) ||
      (app.thongTinChung?.hoTen && app.thongTinChung.hoTen.toLowerCase().includes(q)) ||
      (app.id && String(app.id).includes(q))
    );
  }, [applications, searchQuery]);

  // 2. Mở Modal Chi tiết & Gọi API lấy thông tin cụ thể
  const handleOpenModal = async (id) => {
    setIsModalOpen(true);
    setLoadingDetail(true);
    setSelectedApp(null);
    setReviewReason('');
    
    try {
      const response = await api.get(`/officer/applications/${id}`, {
        headers: getAuthHeader()
      });
      setSelectedApp(response.data?.data || response.data);
    } catch (error) {
      console.error('Lỗi khi tải chi tiết hồ sơ:', error);
      alert('Không thể tải chi tiết hồ sơ. Vui lòng thử lại.');
      setIsModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApp(null);
    setReviewReason('');
  };

  // 3. Phê duyệt hoặc Yêu cầu bổ sung (UC4)
  const handleReviewAction = async (statusId) => {
    // Nếu Yêu cầu bổ sung (3), bắt buộc nhập lý do
    if (statusId === 3 && !reviewReason.trim()) {
      alert('Vui lòng nhập Lý do khi Yêu cầu bổ sung hồ sơ!');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/officer/applications/${selectedApp.id}/review`, {
        trangThai: statusId,
        lyDo: reviewReason.trim()
      }, {
        headers: getAuthHeader()
      });
      
      // Xử lý thành công
      handleCloseModal();
      await fetchPendingApplications(); // Load lại bảng
    } catch (error) {
      console.error('Lỗi xử lý hồ sơ:', error);
      alert(error.response?.data?.message || 'Đã xảy ra lỗi khi duyệt hồ sơ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format Date (d/m/y)
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 text-gray-900">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Hồ sơ (UC3 & UC4)</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách và chức năng phê duyệt hồ sơ đăng ký dự tuyển</p>
        </div>
        
        {/* Badge Tông màu cam */}
        <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200 text-orange-800 px-4 py-2 rounded-xl font-bold shadow-sm">
          <Clock size={18} />
          <span>{applications.length} Hồ sơ chờ duyệt</span>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#b71a22] focus:border-transparent bg-gray-50 outline-none text-sm transition-shadow"
            placeholder="Tìm kiếm theo Họ tên hoặc SBD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* DATA GRID - TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
        <div className="flex-1 overflow-auto">
          {loadingList ? (
            // Trạng thái Đang tải
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Loader2 className="animate-spin mb-3 text-[#b71a22]" size={32} />
              <p>Đang tải danh sách hồ sơ chờ duyệt...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            // Trạng thái Trống
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="bg-gray-50 p-4 rounded-full mb-3">
                <FileCheck2 size={40} className="text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-600">Không có hồ sơ chờ duyệt</p>
              <p className="text-sm mt-1">Hoặc không tìm thấy hồ sơ khớp với từ khóa của bạn.</p>
            </div>
          ) : (
            // Bảng Dữ liệu
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">Mã Hồ Sơ</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">SBD</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">Họ Tên</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b text-center">CCCD</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b text-center">Khu Vực</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b text-center">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApps.map((app) => {
                  // Fallback thông tin trong trường hợp data chưa đồng nhất
                  const info = app.thongTinChung || app;
                  return (
                    <tr key={app.id} className="hover:bg-red-50/20 transition-colors">
                      <td className="py-4 px-6 text-sm font-bold text-[#b71a22]">#{app.id}</td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-700">{info.sbd || 'N/A'}</td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">{info.hoTen}</td>
                      <td className="py-4 px-6 text-sm text-center text-gray-600">{info.cccd}</td>
                      <td className="py-4 px-6 text-sm text-center text-gray-600 font-medium">
                        {info.khuVucUuTien || 'KV3'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleOpenModal(app.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-medium transition-all shadow-sm"
                        >
                          <Eye size={16} />
                          Xem & Duyệt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= MODAL CHI TIẾT & PHÊ DUYỆT (UC4) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900">
                Chi tiết Hồ sơ <span className="text-[#b71a22]">#{selectedApp?.id || '...'}</span>
              </h3>
              <button 
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-800 hover:bg-gray-200 p-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50/30">
              {loadingDetail || !selectedApp ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Loader2 className="animate-spin mb-2" size={32} />
                  <p>Đang tải thông tin chi tiết...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* CỘT TRÁI: Thông tin thí sinh */}
                  <div className="space-y-6">
                    <h4 className="text-lg font-bold text-gray-800 border-b pb-2">Thông tin Thí sinh</h4>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Họ và Tên</p>
                          <p className="font-bold text-gray-900">{selectedApp.thongTinChung?.hoTen}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Số báo danh</p>
                          <p className="font-bold text-gray-900">{selectedApp.thongTinChung?.sbd}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">CCCD / CMND</p>
                          <p className="font-medium text-gray-800">{selectedApp.thongTinChung?.cccd}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Giới tính</p>
                          <p className="font-medium text-gray-800">
                            {selectedApp.thongTinChung?.gioiTinh === 1 || selectedApp.thongTinChung?.gioiTinh === 'Nam' ? 'Nam' : 'Nữ'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-50">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ngày sinh</p>
                          <p className="font-medium text-gray-800">{formatDate(selectedApp.thongTinChung?.ngaySinh)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Khu vực ưu tiên</p>
                          <p className="font-bold text-[#b71a22] bg-red-50 inline-block px-2 py-0.5 rounded text-sm">
                            {selectedApp.thongTinChung?.khuVucUuTien || 'Không có'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-50">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Liên hệ</p>
                        <p className="text-sm font-medium text-gray-800 mb-1">{selectedApp.thongTinChung?.email}</p>
                        <p className="text-sm font-medium text-gray-800">{selectedApp.thongTinChung?.soDienThoai}</p>
                      </div>

                    </div>
                  </div>

                  {/* CỘT PHẢI: Giấy tờ minh chứng & Lý do */}
                  <div className="space-y-6 flex flex-col">
                    <h4 className="text-lg font-bold text-gray-800 border-b pb-2">Hồ sơ Minh chứng</h4>
                    
                    {/* Danh sách giấy tờ */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex-1 space-y-3 max-h-[250px] overflow-y-auto">
                      {selectedApp.giayToMinhChung && selectedApp.giayToMinhChung.length > 0 ? (
                        selectedApp.giayToMinhChung.map((doc, idx) => (
                          <a 
                            key={idx}
                            href={doc.duongDanFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors group cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center text-gray-500 group-hover:text-blue-600">
                              <FileText size={20} />
                            </div>
                            <span className="flex-1 text-sm font-medium truncate">
                              {doc.loaiGiayTo || `Tài liệu đính kèm ${idx + 1}`}
                            </span>
                            <Eye size={18} className="text-gray-400 group-hover:text-blue-500" />
                          </a>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-400 flex flex-col items-center">
                          <AlertCircle size={32} className="mb-2 text-gray-300" />
                          <p>Không có giấy tờ minh chứng nào.</p>
                        </div>
                      )}
                    </div>

                    {/* Form Lý do (Bắt buộc nếu Từ chối/Bổ sung) */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Lý do (Yêu cầu nhập nếu Yêu cầu bổ sung)
                      </label>
                      <textarea
                        rows="3"
                        placeholder="Nhập ghi chú hoặc lý do cần bổ sung hồ sơ..."
                        value={reviewReason}
                        onChange={(e) => setReviewReason(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#b71a22] focus:border-transparent outline-none resize-none bg-white text-sm"
                      ></textarea>
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Action Buttons) */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-end items-center gap-3">
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>

              <button
                onClick={() => handleReviewAction(3)}
                disabled={isSubmitting || loadingDetail || !selectedApp}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-50 hover:bg-red-100 text-[#b71a22] font-bold rounded-xl transition-colors border border-red-200 disabled:opacity-50"
              >
                Yêu cầu bổ sung
              </button>

              <button
                onClick={() => handleReviewAction(2)}
                disabled={isSubmitting || loadingDetail || !selectedApp}
                className="w-full sm:w-auto px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
                Phê Duyệt
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default OfficerApplications;
