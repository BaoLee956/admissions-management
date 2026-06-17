import React, { useState, useEffect } from 'react';
import { 
  Calendar, Target, PlusCircle, Loader2, CheckCircle2, 
  AlertCircle, Save, History, ListOrdered, Edit3, 
  Calculator, UserCheck, ShieldAlert, X, FileSpreadsheet, Upload, Lock
} from 'lucide-react';
import apiClient from '../../utils/api';

const AdminAdmissionsConfig = () => {
  const [activeTab, setActiveTab] = useState('QUOTAS'); 
  const [loadingData, setLoadingData] = useState(false);
  const [dots, setDots] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [nganhList, setNganhList] = useState([]); 

  // Form States
  const [dotForm, setDotForm] = useState({ 
    tenDot: `Xét tuyển Đại học Chính quy năm ${new Date().getFullYear()}`, 
    namHoc: new Date().getFullYear() 
  });
  const [chiTieuForm, setChiTieuForm] = useState({ maDot: '', maNganh: '', soLuong: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State dành riêng cho file Excel Import
  const [excelFile, setExcelFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Modal hiển thị kết quả chạy thuật toán
  const [resultModal, setResultModal] = useState({
    isOpen: false,
    title: '',
    type: '', 
    data: []
  });

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [resDots, resCriteria, resNganh] = await Promise.all([
        apiClient.get('/admin/admissions/dot'),
        apiClient.get('/admin/admissions/chitieu'),
        apiClient.get('/admin/categories/nganh') 
      ]);
      
      const fetchedDots = resDots.data.data || [];
      setDots(fetchedDots);
      setCriteria(resCriteria.data.data || []);
      setNganhList(resNganh.data.data || []);
      
      // TỰ ĐỘNG DÒ ĐỢT ĐANG HOẠT ĐỘNG ĐỂ GÁN VÀO FORM CHỈ TIÊU
      const activeRound = fetchedDots.find(d => d.isActive);
      if (activeRound) {
        setChiTieuForm(prev => ({ ...prev, maDot: activeRound.id }));
      } else {
        setChiTieuForm(prev => ({ ...prev, maDot: '' }));
      }

      if (resNganh.data.data?.length > 0) {
        setChiTieuForm(prev => ({ ...prev, maNganh: resNganh.data.data[0].maNganh }));
      }
    } catch (err) {
      console.error("Lỗi lấy dữ liệu cấu hình", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Tìm thông tin đợt đang mở hiện tại
  const currentActiveRound = dots.find(d => d.isActive);

  // PHÂN TÁCH DỮ LIỆU THEO Ý TƯỞNG CỦA BẠN
  const activeRoundId = currentActiveRound ? Number(currentActiveRound.id) : null;

  const currentCriteria = criteria.filter(item => {
    const itemDotId = Number(item.maDot || item.madot); // Bắt cả trường hợp db trả về chữ thường
    return itemDotId === activeRoundId;
  });

  const pastCriteria = criteria.filter(item => {
    const itemDotId = Number(item.maDot || item.madot);
    return itemDotId !== activeRoundId;
  });

  const handleCreateDot = async (e) => {
    e.preventDefault();
    if (dots.length > 0) {
      const maxYear = Math.max(...dots.map(d => parseInt(d.namHoc, 10)));
      const inputYear = parseInt(dotForm.namHoc, 10);
      if (inputYear <= maxYear) {
        alert(`Lỗi: Năm học của đợt mới (${inputYear}) phải lớn hơn năm học gần nhất trong hệ thống (${maxYear}).`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/admin/admissions/dot', dotForm);
      alert('Khởi tạo đợt tuyển sinh thành công!');
      const nextYear = parseInt(dotForm.namHoc, 10) + 1;
      setDotForm({ 
        tenDot: `Xét tuyển Đại học Chính quy năm ${nextYear}`, 
        namHoc: nextYear 
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi tạo đợt.');
    } finally { setIsSubmitting(false); }
  };

  const handleAddChiTieu = async (e) => {
    e.preventDefault();
    if (!chiTieuForm.maDot) {
      alert('Hệ thống hiện tại không có đợt tuyển sinh nào đang mở hoạt động! Vui lòng sang tab "Quản lý Đợt TS" để mở đợt mới trước.');
      return;
    }
    if (!chiTieuForm.maNganh) {
      alert('Vui lòng chọn một ngành học cụ thể.');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post('/admin/admissions/chitieu', {
        ...chiTieuForm, soLuong: parseInt(chiTieuForm.soLuong, 10)
      });
      alert('Cấu hình chỉ tiêu thành công (Đã tự động cập nhật số lượng nếu trùng ngành)!');
      setChiTieuForm(prev => ({ ...prev, soLuong: '' }));
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi cấu hình chỉ tiêu.');
    } finally { setIsSubmitting(false); }
  };

  const handleUpdateDiemChuan = async (idChiTieu, currentDiem) => {
    const newDiem = window.prompt('Nhập mức điểm chuẩn xét duyệt mới cho ngành này:', currentDiem || 0);
    if (newDiem === null || newDiem === '') return;
    try {
      await apiClient.put('/admin/admissions/chitieu/diem-chuan', { idChiTieu, diemChuan: parseFloat(newDiem) });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi cập nhật điểm chuẩn.');
    }
  };

  const handleRunAdmissions = async () => {
    if (!window.confirm('CẢNH BÁO: Thuật toán sẽ duyệt trạng thái Đậu/Rớt cho TOÀN BỘ nguyện vọng dựa trên Điểm chuẩn. Bạn có chắc chắn?')) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/admin/admissions/process');
      setResultModal({
        isOpen: true,
        title: `Kết quả Xử lý Điểm chuẩn (${res.data.processedCount} hồ sơ)`,
        type: 'ADMISSIONS',
        data: res.data.details || []
      });
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi hệ thống khi chạy xét tuyển.');
    } finally { setIsSubmitting(false); }
  };

  const handleGenerateMSSV = async () => {
    if (!window.confirm('Hệ thống sẽ cấp Mã Số Sinh Viên chính thức cho các hồ sơ đã duyệt. Tiến hành ngay?')) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/admin/admissions/generate-mssv');
      setResultModal({
        isOpen: true,
        title: res.data.message,
        type: 'MSSV',
        data: res.data.details || []
      });
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi cấp MSSV.');
    } finally { setIsSubmitting(false); }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setExcelFile(e.target.files[0]);
    }
  };

  const handleImportExcel = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      alert('Vui lòng chọn một file dữ liệu Excel trước khi nhấn nút nạp.');
      return;
    }

    const formData = new FormData();
    formData.append('file', excelFile);

    setIsImporting(true);
    try {
      const res = await apiClient.post('/admin/admissions/import-candidates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResultModal({
        isOpen: true,
        title: res.data.message,
        type: 'IMPORT',
        data: res.data.details || []
      });
      setExcelFile(null); 
      if (document.getElementById('excel-file-input')) {
        document.getElementById('excel-file-input').value = '';
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi cấu trúc dữ liệu file Excel.');
    } finally { setIsImporting(false); }
  };

  const minAllowedYear = dots.length > 0 
    ? Math.max(...dots.map(d => parseInt(d.namHoc, 10))) + 1 
    : new Date().getFullYear();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trung tâm Cấu hình Tuyển sinh</h1>
        <p className="text-sm text-slate-500 mt-1">Quản lý Đợt xét tuyển, phân bổ Chỉ tiêu, Điểm chuẩn và công cụ tự động.</p>
      </div>

      {/* THANH ĐIỀU HƯỚNG TABS CHÍNH */}
      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
        <button onClick={() => setActiveTab('QUOTAS')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'QUOTAS' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
          <Target size={18} /> Chỉ tiêu & Điểm chuẩn
        </button>
        <button onClick={() => setActiveTab('ROUNDS')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'ROUNDS' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
          <Calendar size={18} /> Quản lý Đợt TS
        </button>
        <button onClick={() => setActiveTab('TOOLS')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'TOOLS' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
          <ShieldAlert size={18} /> Công cụ Hệ thống
        </button>
      </div>

      {loadingData ? (
        <div className="flex justify-center py-20 text-indigo-600"><Loader2 className="animate-spin" size={40} /></div>
      ) : (
        <>
          {/* ========================================= */}
          {/* TAB 1: QUẢN LÝ CHỈ TIÊU (ĐÃ PHÂN CHIA) */}
          {/* ========================================= */}
          {activeTab === 'QUOTAS' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* KHỐI TRÁI: FORM THÊM CHỈ TIÊU (TỰ ĐỘNG KHÓA ĐỢT) */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit">
                <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3">
                  <PlusCircle size={18} className="text-emerald-600"/> Cấu hình Chỉ tiêu
                </h2>
                <form onSubmit={handleAddChiTieu} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Đợt tuyển sinh áp dụng</label>
                    <input 
                      type="text" 
                      disabled 
                      value={currentActiveRound ? `[Mã Đợt ${currentActiveRound.id}] - ${currentActiveRound.tenDot}` : 'KHÔNG CÓ ĐỢT ĐANG MỞ'} 
                      className="w-full px-3 py-2 bg-slate-100 border rounded-lg text-sm font-semibold text-slate-600 cursor-not-allowed border-slate-200" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Chọn Ngành xét tuyển</label>
                    <select 
                      required 
                      disabled={!currentActiveRound}
                      value={chiTieuForm.maNganh} 
                      onChange={e => setChiTieuForm({...chiTieuForm, maNganh: e.target.value})} 
                      className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium text-slate-800 outline-none focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value="">-- Chọn ngành học từ danh mục --</option>
                      {nganhList.map((nganh) => (
                        <option key={nganh.maNganh} value={nganh.maNganh}>{nganh.maNganh} - {nganh.tenNganh}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Chỉ tiêu số lượng (Không trùng ngành)</label>
                    <input 
                      type="number" 
                      required 
                      min="1" 
                      disabled={!currentActiveRound}
                      value={chiTieuForm.soLuong} 
                      onChange={e => setChiTieuForm({...chiTieuForm, soLuong: e.target.value})} 
                      placeholder="Nhập số lượng..."
                      className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-bold text-emerald-700 disabled:opacity-50" 
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !currentActiveRound} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-semibold transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} />} 
                    Lưu cấu hình ngành
                  </button>
                </form>
              </div>

              {/* KHỐI PHẢI: HAI BẢNG DANH SÁCH TÁCH BIỆT HÀN TOÀN */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* BẢNG 1: CHỈ TIÊU ĐỢT HIỆN TẠI (CHO PHÉP CHỈNH SỬA / CHỐT ĐIỂM) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-indigo-50/40 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                      <ListOrdered size={16} className="text-indigo-600"/> 
                      DANH SÁCH CHỈ TIÊU ĐỢT HIỆN TẠI ({currentActiveRound ? currentActiveRound.tenDot : 'Chưa mở đợt'})
                    </h2>
                    <span className="text-xs bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">Đang hoạt động</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Mã Ngành</th>
                          <th className="px-4 py-2.5">Tên Ngành</th>
                          <th className="px-4 py-2.5 text-center">Chỉ tiêu đợt</th>
                          <th className="px-4 py-2.5 text-center">Điểm chuẩn</th>
                          <th className="px-4 py-2.5 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentCriteria.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center py-6 text-slate-400 italic">Đợt hiện tại chưa được phân bổ chỉ tiêu ngành học nào.</td>
                          </tr>
                        ) : (
                          currentCriteria.map((item) => (
                            <tr key={item.idChiTieu} className="hover:bg-slate-50/80">
                              <td className="px-4 py-3 font-mono font-medium text-slate-600">{item.maNganh}</td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{item.tenNganh}</td>
                              <td className="px-4 py-3 text-center text-emerald-600 font-bold">{item.soLuong}</td>
                              <td className="px-4 py-3 text-center font-bold text-indigo-600 text-base">{item.diemChuan || '--'}</td>
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => handleUpdateDiemChuan(item.idChiTieu, item.diemChuan)} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors">
                                  <Edit3 size={12}/> Chốt Điểm
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* BẢNG 2: CHỈ TIÊU TRONG QUÁ KHỨ (KHÓA TOÀN DIỆN - CHỈ XEM) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden opacity-90 shadow-inner">
                  <div className="p-4 border-b border-slate-100 bg-slate-100 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <History size={16} className="text-slate-500"/> 
                      LỊCH SỬ CHỈ TIÊU CÁC ĐỢT TRONG QUÁ KHỨ (ĐÓNG BĂNG)
                    </h2>
                    <span className="text-xs bg-slate-400 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Lock size={12}/> Chỉ xem</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-500">
                      <thead className="bg-slate-50 text-slate-400 font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Mã Đợt</th>
                          <th className="px-4 py-2.5">Mã Ngành</th>
                          <th className="px-4 py-2.5">Tên Ngành</th>
                          <th className="px-4 py-2.5 text-center">Chỉ tiêu cũ</th>
                          <th className="px-4 py-2.5 text-center">Điểm chuẩn cũ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-slate-50/40">
                        {pastCriteria.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center py-6 text-slate-400 italic">Không có dữ liệu lưu trữ quá khứ.</td>
                          </tr>
                        ) : (
                          pastCriteria.map((item) => (
                            <tr key={item.idChiTieu} className="hover:bg-slate-50">
                              <td className="px-4 py-2.5 font-bold text-slate-500">#Đợt {item.maDot || item.madot}</td>
                              <td className="px-4 py-2.5 font-mono text-slate-400">{item.maNganh}</td>
                              <td className="px-4 py-2.5 font-medium text-slate-600">{item.tenNganh}</td>
                              <td className="px-4 py-2.5 text-center font-semibold text-slate-500">{item.soLuong}</td>
                              <td className="px-4 py-2.5 text-center font-bold text-slate-600">{item.diemChuan || '--'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ ĐỢT TUYỂN SINH */}
          {activeTab === 'ROUNDS' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit">
                <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3">
                  <PlusCircle size={18} className="text-indigo-600"/> Mở Đợt Mới
                </h2>
                <form onSubmit={handleCreateDot} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Tên đợt tuyển sinh</label>
                    <input type="text" required value={dotForm.tenDot} onChange={e => setDotForm({...dotForm, tenDot: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Năm học</label>
                    <input 
                      type="number" 
                      required 
                      min={minAllowedYear} 
                      value={dotForm.namHoc} 
                      onChange={e => {
                        const year = e.target.value;
                        setDotForm({ namHoc: year, tenDot: `Xét tuyển Đại học Chính quy năm ${year}` });
                      }} className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm" />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition flex justify-center items-center gap-2">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Calendar size={16} />} Kích Hoạt Đợt
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><History size={18} className="text-indigo-600"/> Lịch Sử Tuyển Sinh</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">ID Đợt</th>
                        <th className="px-4 py-3">Tên Đợt Tuyển Sinh</th>
                        <th className="px-4 py-3 text-center">Năm học</th>
                        <th className="px-4 py-3 text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dots.map((dot) => (
                        <tr key={dot.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-slate-500">#{dot.id}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{dot.tenDot}</td>
                          <td className="px-4 py-3 text-center font-medium">{dot.namHoc}</td>
                          <td className="px-4 py-3 text-right">
                            {dot.isActive ? (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Đang Mở</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-xs font-bold">Đã Đóng</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CÔNG CỤ HỆ THỐNG */}
          {activeTab === 'TOOLS' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4"><Calculator size={32} /></div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Chạy Thuật Toán Xét Tuyển</h3>
                  <p className="text-sm text-slate-500 mb-6">Hệ thống sẽ quét toàn bộ Điểm của thí sinh và so sánh với Điểm Chuẩn để chốt trạng thái ĐẬU / RỚT.</p>
                  <button onClick={handleRunAdmissions} disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition shadow-sm flex justify-center items-center gap-2">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Khởi Động Quét Dữ Liệu'}
                  </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4"><UserCheck size={32} /></div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Cấp Mã Số Sinh Viên (MSSV)</h3>
                  <p className="text-sm text-slate-500 mb-6">Tự động sinh mã MSSV chính thức cho toàn bộ thí sinh đã phê duyệt hồ sơ nhập học.</p>
                  <button onClick={handleGenerateMSSV} disabled={isSubmitting} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition shadow-sm flex justify-center items-center gap-2">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Thực Thi Cấp Mã Hàng Loạt'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><FileSpreadsheet size={24} /></div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Import Danh Sách Thí Sinh Vào Hệ Thống</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Nạp cơ sở dữ liệu thí sinh thô từ cổng thông tin Bộ GD&ĐT (Hỗ trợ cấu hình cột: SBD, CCCD, HoTen, Email, SDT, KhuVuc).</p>
                  </div>
                </div>

                <form onSubmit={handleImportExcel} className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                  <div className="w-full flex-1 relative">
                    <input id="excel-file-input" type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
                    <label htmlFor="excel-file-input" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-medium cursor-pointer hover:bg-slate-100 transition-colors">
                      <Upload size={16} className="text-slate-400" />
                      {excelFile ? excelFile.name : 'Nhấn vào đây để chọn file Excel từ máy tính...'}
                    </label>
                  </div>
                  <button type="submit" disabled={isImporting || !excelFile} className="w-full sm:w-auto min-w-[160px] inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50">
                    {isImporting ? <Loader2 size={16} className="animate-spin" /> : 'Kích hoạt nạp dữ liệu'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* POPUP MODAL HIỂN THỊ KẾT QUẢ */}
      {resultModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{resultModal.title}</h2>
              <button onClick={() => setResultModal({ ...resultModal, isOpen: false })} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50">
              {resultModal.data.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-medium italic">Không có dữ liệu thay đổi nào được ghi nhận.</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600 font-medium">
                      <tr>
                        <th className="px-4 py-3">SBD</th>
                        <th className="px-4 py-3">Họ và Tên</th>
                        {resultModal.type === 'IMPORT' ? (
                          <>
                            <th className="px-4 py-3">Email nhận OTP</th>
                            <th className="px-4 py-3 text-center">Khu Vực</th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-3">Ngành</th>
                            {resultModal.type === 'ADMISSIONS' ? (
                              <th className="px-4 py-3 text-center">Trạng thái Hệ thống</th>
                            ) : (
                              <th className="px-4 py-3 text-center text-indigo-700">MSSV Được Cấp</th>
                            )}
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {resultModal.data.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-500">{item.sbd}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{item.hoTen}</td>
                          
                          {resultModal.type === 'IMPORT' ? (
                            <>
                              <td className="px-4 py-3 text-slate-500">{item.email}</td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-indigo-600">{item.khuVuc}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]">{item.tenNganh || item.maNganh}</td>
                              {resultModal.type === 'ADMISSIONS' ? (
                                <td className="px-4 py-3 text-center">
                                  {item.trangThai === 1 ? (
                                    <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md font-bold text-xs border border-emerald-100">ĐẬU</span>
                                  ) : (
                                    <span className="inline-block px-2.5 py-1 bg-red-50 text-red-700 rounded-md font-bold text-xs border border-red-100">RỚT</span>
                                  )}
                                </td>
                              ) : (
                                <td className="px-4 py-3 text-center">
                                  <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md font-mono font-bold text-sm border border-indigo-100">{item.mssv}</span>
                                </td>
                              )}
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button onClick={() => setResultModal({ ...resultModal, isOpen: false })} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">Xác nhận & Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdmissionsConfig;