import React, { useState, useEffect } from 'react';
import { 
  Settings2, 
  Play, 
  CheckCircle2, 
  XCircle, 
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import api from '../../utils/api';

const OfficerAdmissions = () => {
  const [criteriaList, setCriteriaList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  
  const [selectedMajorId, setSelectedMajorId] = useState('');
  const [newScore, setNewScore] = useState('');
  const [isUpdatingScore, setIsUpdatingScore] = useState(false);
  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });

  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchCriteria = async () => {
    setLoadingList(true);
    try {
      const response = await api.get('/officer/admissions/criteria', getAuthHeader());
      const listData = response.data.data || [];
      setCriteriaList(listData);
      
      if (listData.length > 0 && !selectedMajorId) {
        setSelectedMajorId(listData[0].idChiTieu);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách ngành:', error);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedMajor = criteriaList.find(m => String(m.idChiTieu) === String(selectedMajorId));

  const handleUpdateScore = async (e) => {
    e.preventDefault();
    if (!selectedMajorId || !newScore) return;

    setIsUpdatingScore(true);
    setUpdateMessage({ type: '', text: '' });

    try {
      await api.put('/officer/admissions/criteria', {
        idChiTieu: selectedMajorId,
        diemChuan: parseFloat(newScore)
      }, getAuthHeader());
      
      setUpdateMessage({ type: 'success', text: 'Cập nhật điểm chuẩn thành công!' });
      setNewScore('');
      await fetchCriteria(); 
    } catch (error) {
      setUpdateMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Lỗi khi cập nhật điểm chuẩn.' 
      });
    } finally {
      setIsUpdatingScore(false);
    }
  };

  const handleProcessAlgorithm = async () => {
    setIsProcessing(true);
    try {
      const response = await api.post('/officer/admissions/process', {}, getAuthHeader());
      setProcessResult(response.data);
      setShowModal(true); 
      await fetchCriteria(); 
    } catch (error) {
      alert(error.response?.data?.message || 'Đã xảy ra lỗi khi chạy thuật toán xét tuyển.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Xét tuyển (UC5)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Thiết lập điểm chuẩn và thực hiện thuật toán xét tuyển thí sinh
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 text-[#b71a22] mb-5">
              <Settings2 size={24} />
              <h2 className="text-lg font-bold text-gray-900">Thiết lập Điểm chuẩn</h2>
            </div>

            <form onSubmit={handleUpdateScore} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chọn Ngành
                </label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b71a22] focus:border-transparent bg-gray-50"
                  value={selectedMajorId}
                  onChange={(e) => setSelectedMajorId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Chọn ngành --</option>
                  {criteriaList.map((major) => (
                    <option key={major.idChiTieu} value={major.idChiTieu}>
                      [{major.maNganh}] - {major.tenNganh}
                    </option>
                  ))}
                </select>
                
                {selectedMajor && (
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                    <AlertCircle size={14} className="text-blue-500" />
                    Điểm chuẩn hiện tại: <span className="font-bold text-blue-600">{selectedMajor.diemChuan || 'Chưa thiết lập'}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điểm chuẩn mới
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="40"
                  required
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#b71a22] focus:border-transparent bg-gray-50"
                  placeholder="Nhập điểm chuẩn..."
                />
              </div>

              {updateMessage.text && (
                <div className={`p-3 rounded-lg text-sm ${updateMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {updateMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingScore}
                className="w-full bg-[#b71a22] hover:bg-red-800 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isUpdatingScore ? <Loader2 size={18} className="animate-spin" /> : 'Lưu Điểm chuẩn'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 text-[#b71a22] mb-5">
              <Play size={24} />
              <h2 className="text-lg font-bold text-gray-900">Chạy Thuật toán</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Hệ thống sẽ dựa trên chỉ tiêu và điểm chuẩn đã thiết lập để tiến hành xét duyệt tự động các hồ sơ.
            </p>
            <button
              onClick={handleProcessAlgorithm}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Đang xử lý dữ liệu...
                </>
              ) : (
                <>
                  <Play size={20} />
                  Bắt đầu Xét tuyển
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-12rem)] min-h-[500px]">
          <div className="p-6 border-b border-gray-100 bg-white">
            <h2 className="text-lg font-bold text-gray-900">Danh sách Tiêu chí Ngành</h2>
          </div>
          
          <div className="flex-1 overflow-auto">
            {loadingList ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Loader2 className="animate-spin mr-2" size={24} /> Đang tải danh sách...
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Mã Ngành</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Tên Ngành</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b text-center">Chỉ tiêu</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b text-center">Điểm chuẩn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {criteriaList.map((item) => (
                    <tr key={item.idChiTieu} className="hover:bg-red-50/30 transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">{item.maNganh}</td>
                      <td className="py-4 px-6 text-sm text-gray-600">{item.tenNganh}</td>
                      <td className="py-4 px-6 text-sm text-center font-medium text-gray-700">{item.soLuong}</td>
                      <td className="py-4 px-6 text-center">
                        {item.diemChuan ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.diemChuan}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Chưa có
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {criteriaList.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-500 text-sm">
                        Chưa có dữ liệu ngành
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showModal && processResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 size={24} />
                <h3 className="text-xl font-bold text-gray-900">Xét tuyển Hoàn tất</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1.5 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-auto">
              <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100 text-green-800">
                <p className="font-medium">
                  Hệ thống đã xử lý thành công <strong className="text-lg">{processResult.processedCount}</strong> hồ sơ.
                </p>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">SBD</th>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Họ Tên</th>
                      {/* Đã thêm cột Ngành Đăng Ký */}
                      <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Ngành Đăng Ký</th>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b text-center">Điểm Tổng</th>
                      <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b text-center">Kết Quả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {processResult.details?.map((detail, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{detail.sbd}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{detail.hoTen}</td>
                        {/* Đã thêm dữ liệu Tên Ngành */}
                        <td className="py-3 px-4 text-sm font-medium text-blue-600">{detail.tenNganh}</td>
                        <td className="py-3 px-4 text-sm text-center font-semibold text-gray-700">{detail.diemTong}</td>
                        <td className="py-3 px-4 text-center">
                          {detail.trangThai === 1 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle2 size={12} /> Đậu
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700">
                              <XCircle size={12} /> Rớt
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!processResult.details || processResult.details.length === 0) && (
                      <tr>
                        {/* Đổi colSpan từ 4 thành 5 để vừa với 5 cột */}
                        <td colSpan="5" className="py-8 text-center text-gray-500 text-sm">
                          Không có chi tiết hồ sơ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-xl transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerAdmissions;