import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  UploadCloud, 
  LogOut,
  ChevronLeft,
  ChevronDown,
  AlertCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import apiClient from '../../utils/api';

const CandidatePortal = () => {
  // --- States ---
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(59);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [admissionResult, setAdmissionResult] = useState(null);
  
  // Data states
  const [formData, setFormData] = useState({
    sbd: '',
    cccd: '',
    otp: ''
  });
  
  const [files, setFiles] = useState({
    cccd: null,
    hocBa: null,
    giayBao: null
  });

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if(message.text) setMessage({ type: '', text: '' });
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await apiClient.post('/auth/candidates/otp', { 
        sbd: formData.sbd, 
        cccd: formData.cccd 
      });
      setStep(2);
      setCountdown(59);
      setMessage({ type: 'success', text: 'Mã OTP đã được gửi về email của bạn.' });
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || 'Có lỗi xảy ra khi yêu cầu OTP. Vui lòng kiểm tra lại SBD và CCCD.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdmissionResult = async () => {
    try {
      const res = await apiClient.get('/candidates/me/admission-result');
      const data = res.data.data || res.data;
      setAdmissionResult(data);
      if (data.daXacNhanNhapHoc) {
        setStep(4);
      } else {
        setStep(3);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || 'Không thể tải kết quả xét tuyển.';
      setMessage({ type: 'error', text: errorMsg });
      setStep(1); // Go back if fetch fails
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await apiClient.post('/auth/candidates/verify', { 
        sbd: formData.sbd, 
        cccd: formData.cccd, 
        otp: formData.otp 
      });
      
      const token = res.data.token || res.data.data?.token;
      if (token) {
        localStorage.setItem('candidateToken', token);
        // Tự động gắn token vào header cho các request tiếp theo (nếu chưa cấu hình interceptor)
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      await fetchAdmissionResult();
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAdmission = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await apiClient.put('/candidates/me/confirm-enrollment', { daXacNhanNhapHoc: true });
      setStep(4);
      setMessage({ type: 'success', text: 'Xác nhận nhập học thành công! Vui lòng hoàn thiện hồ sơ.' });
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || 'Có lỗi xảy ra khi xác nhận nhập học.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileDrop = (e, type) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFiles(prev => ({ ...prev, [type]: droppedFile }));
    }
  };

  const handleFileSelect = (e, type) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFiles(prev => ({ ...prev, [type]: selectedFile }));
    }
  };

  const handleSubmitDocuments = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      // 1. Upload files
      const uploadPromises = Object.entries(files).map(async ([key, file]) => {
        if (!file) return null;
        const fmData = new FormData();
        fmData.append('maLoai', key);
        fmData.append('file', file);
        return apiClient.post('/candidates/me/documents', fmData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      });

      await Promise.all(uploadPromises);

      // 2. Submit application
      await apiClient.post('/candidates/me/submit-application');
      
      setMessage({ type: 'success', text: 'Nộp hồ sơ minh chứng thành công! Cảm ơn bạn.' });
      
      // Reset form sau khi gửi
      setFiles({ cccd: null, hocBa: null, giayBao: null });
      alert("Chốt gửi hồ sơ thành công!");
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || 'Quá trình tải lên hồ sơ thất bại. Vui lòng thử lại.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // Countdown timer for OTP
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // --- Renders ---
  
  const renderMessage = () => {
    if (!message.text) return null;
    const isError = message.type === 'error';
    return (
      <div className={`mb-6 p-4 rounded-xl flex items-start text-sm animate-in fade-in slide-in-from-top-2 ${isError ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
        {isError ? <AlertCircle size={18} className="mr-2 mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mr-2 mt-0.5 shrink-0" />}
        <span>{message.text}</span>
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-8">
        <img 
          src="/ptit-logo.png" 
          alt="PTIT Logo" 
          className="h-20 w-auto object-contain mx-auto mb-4" 
        />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Cổng Tuyển Sinh PTIT</h1>
        <p className="text-gray-500">Vui lòng nhập thông tin để tra cứu kết quả</p>
      </div>

      {renderMessage()}

      <form onSubmit={handleRequestOTP} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Số Báo Danh</label>
          <input 
            type="text" 
            name="sbd"
            value={formData.sbd}
            onChange={handleInputChange}
            placeholder="VD: TS010"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-colors shadow-sm outline-none"
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Căn Cước Công Dân</label>
          <input 
            type="text" 
            name="cccd"
            value={formData.cccd}
            onChange={handleInputChange}
            placeholder="12 số CCCD"
            maxLength={12}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-colors shadow-sm outline-none"
            required
            disabled={isLoading}
          />
        </div>
        <button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-700 hover:bg-red-800 text-white font-medium py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center group disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
            <>
              Nhận mã OTP xác thực
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </>
          )}
        </button>
      </form>
    </div>
  );

  const renderStep2 = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Xác Thực OTP</h2>
      </div>

      {renderMessage()}

      <form onSubmit={handleVerifyOTP} className="space-y-8 mt-2">
        <div>
          <input 
            type="text" 
            name="otp"
            value={formData.otp}
            onChange={handleInputChange}
            placeholder="• • • • • •"
            maxLength={6}
            className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-colors shadow-inner text-center text-3xl tracking-[1em] font-semibold outline-none"
            required
            disabled={isLoading}
          />
          <div className="text-center mt-3 text-sm text-gray-500">
            {countdown > 0 ? (
              <span>Mã có hiệu lực trong <strong className="text-red-600">00:{countdown.toString().padStart(2, '0')}s</strong></span>
            ) : (
              <button type="button" className="text-red-600 font-medium hover:underline" onClick={handleRequestOTP} disabled={isLoading}>
                Gửi lại mã OTP
              </button>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-700 hover:bg-red-800 text-white font-medium py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex justify-center disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Xác nhận OTP'}
          </button>
          
          <button 
            type="button"
            onClick={() => { setStep(1); setMessage({type:'', text:''}); }}
            className="w-full text-gray-500 hover:text-gray-800 font-medium py-2 flex items-center justify-center transition-colors"
            disabled={isLoading}
          >
            <ChevronLeft size={18} className="mr-1" /> Quay lại
          </button>
        </div>
      </form>
    </div>
  );

  const renderStep3 = () => {
    if (!admissionResult) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Loader2 className="animate-spin text-red-600 mb-4" size={40} />
          <p>Đang tải kết quả xét tuyển...</p>
        </div>
      );
    }

    const isPassed = admissionResult.trangThai === 'TRUNG_TUYEN';
    // Fallbacks if data is missing
    const hoTen = admissionResult.hoTen || 'Thí sinh';
    const nganhTrungTuyen = admissionResult.nganhTrungTuyen || 'Chưa có thông tin';
    const diemChuan = admissionResult.diemChuan || '---';
    const diemCuaBan = admissionResult.diemCuaBan || '---';
    const diemToan = admissionResult.diemToan || '---';
    const diemLy = admissionResult.diemLy || '---';
    const diemHoa = admissionResult.diemHoa || '---';
    const diemUuTien = admissionResult.diemUuTien || '0.00';

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
          <h2 className={`text-3xl font-bold mb-2 ${isPassed ? 'text-gray-800' : 'text-red-600'}`}>
            {isPassed ? `Chúc mừng, ${hoTen}!` : `Rất tiếc, ${hoTen}!`}
          </h2>
          <p className="text-gray-500">
            {isPassed ? 'Dưới đây là kết quả xét tuyển của bạn' : 'Bạn chưa đủ điểm trúng tuyển đợt này'}
          </p>
        </div>

        {renderMessage()}

        <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 mb-6 relative overflow-hidden transition-all duration-500">
          <div className={`absolute top-0 left-0 w-1 h-full ${isPassed ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider font-medium mb-1">Ngành xét tuyển</p>
              <h3 className="text-xl font-bold text-red-700 line-clamp-2">{nganhTrungTuyen}</h3>
            </div>
            {isPassed ? (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-sm whitespace-nowrap ml-2">
                <CheckCircle2 size={14} className="mr-1" /> TRÚNG TUYỂN
              </span>
            ) : (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-sm whitespace-nowrap ml-2">
                <XCircle size={14} className="mr-1" /> KHÔNG TRÚNG TUYỂN
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Điểm chuẩn</p>
              <p className="text-lg font-semibold text-gray-800">{diemChuan}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Điểm của bạn</p>
              <p className={`text-lg font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                {diemCuaBan}
              </p>
            </div>
          </div>

          {!showDetails ? (
            <button 
              type="button"
              onClick={() => setShowDetails(true)}
              className="w-full mt-2 py-3 border border-red-600 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all flex items-center justify-center group"
            >
              Xem chi tiết điểm thành phần
              <ChevronDown size={18} className="ml-2 group-hover:translate-y-1 transition-transform" />
            </button>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 mt-6">
              <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Bảng Điểm Chi Tiết</h4>
              <div className="overflow-hidden rounded-xl border border-gray-200 mb-6 shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-600">Thành phần</th>
                      <th className="px-4 py-3 font-medium text-gray-600 text-right">Điểm số</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {admissionResult.diemChiTiet && admissionResult.diemChiTiet.length > 0 ? (
                      admissionResult.diemChiTiet.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-800">{item.mon}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-800">{item.diem}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="px-4 py-6 text-center text-gray-500 italic">Đang cập nhật điểm thành phần...</td>
                      </tr>
                    )}
                    <tr className="bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-500 text-xs italic">Điểm ưu tiên (KV/ĐT)</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-500 text-xs">{diemUuTien}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-red-50 border-t border-red-100">
                    <tr>
                      <td className="px-4 py-3 font-bold text-red-800 uppercase text-xs">Tổng điểm xét tuyển</td>
                      <td className="px-4 py-3 text-right font-bold text-red-800 text-base">{diemCuaBan}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {isPassed && (
                <button 
                  onClick={handleConfirmAdmission}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.23)] hover:-translate-y-0.5 transition-all duration-300 animate-pulse relative overflow-hidden group disabled:opacity-70 disabled:animate-none flex justify-center"
                >
                  {isLoading ? <Loader2 className="animate-spin z-10" size={24} /> : (
                    <>
                      <span className="relative z-10">XÁC NHẬN NHẬP HỌC</span>
                      <div className="absolute inset-0 h-full w-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500"></div>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDropzone = (id, label, fileKey) => {
    const isUploaded = !!files[fileKey];
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div 
          className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50
            ${isUploaded ? 'border-green-500 bg-green-50/30' : 'border-gray-300 bg-gray-50/50 hover:border-red-400'}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleFileDrop(e, fileKey)}
          onClick={() => document.getElementById(`fileUpload-${fileKey}`).click()}
        >
          <input 
            id={`fileUpload-${fileKey}`} 
            type="file" 
            className="hidden" 
            onChange={(e) => handleFileSelect(e, fileKey)}
            disabled={isLoading}
          />
          {isUploaded ? (
            <>
              <CheckCircle2 className="text-green-500 mb-2" size={28} />
              <p className="text-sm font-medium text-green-700 truncate max-w-full px-2">{files[fileKey].name}</p>
              <p className="text-xs text-green-600 mt-1">Nhấn để thay đổi file</p>
            </>
          ) : (
            <>
              <UploadCloud className="text-gray-400 mb-2" size={28} />
              <p className="text-sm text-gray-600 font-medium">Kéo thả file vào đây hoặc <span className="text-red-600">tải lên</span></p>
              <p className="text-xs text-gray-400 mt-1">Hỗ trợ PDF, JPG, PNG (Tối đa 5MB)</p>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const uploadedCount = Object.values(files).filter(f => f !== null).length;
    const progressPercent = (uploadedCount / 3) * 100;

    return (
      <div className="animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Hoàn thiện hồ sơ minh chứng</h2>
          <p className="text-sm text-gray-500">Vui lòng tải lên các giấy tờ cần thiết để hoàn tất</p>
        </div>
        
        {renderMessage()}

        {/* Progress bar */}
        <div className="mb-8 mt-2">
          <div className="flex justify-between text-xs font-medium text-gray-600 mb-2">
            <span>Tiến độ hoàn thành</span>
            <span className="text-red-600">{uploadedCount}/3 file</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-600 h-2 rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-2 mb-8">
          {renderDropzone('cccd', '1. Căn cước công dân (Mặt trước & sau)', 'cccd')}
          {renderDropzone('hocBa', '2. Học bạ THPT (Bản scan có công chứng)', 'hocBa')}
          {renderDropzone('giayBao', '3. Giấy chứng nhận tốt nghiệp tạm thời', 'giayBao')}
        </div>

        <button 
          onClick={handleSubmitDocuments}
          disabled={uploadedCount < 3 || isLoading}
          className={`w-full font-bold py-4 px-4 rounded-xl transition-all duration-300 shadow-md flex justify-center
            ${(uploadedCount === 3 && !isLoading)
              ? 'bg-red-700 hover:bg-red-800 text-white hover:shadow-lg hover:-translate-y-0.5' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          {isLoading ? <Loader2 className="animate-spin text-gray-500" size={24} /> : 'CHỐT GỬI HỒ SƠ'}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between font-sans selection:bg-red-200 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-red-700 rounded-b-[3rem] shadow-lg z-0"></div>
      
      {/* Main Content Area */}
      <div className="flex-grow flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 z-10">
        {/* Main Card */}
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(220,_38,_38,_0.07)] p-8 sm:p-10 border border-gray-100 mb-4">
          
          {/* Header Actions (Logout/Reset) */}
          {step > 1 && (
            <button 
              onClick={() => {
                if(window.confirm("Bạn muốn quay lại từ đầu?")) {
                  setStep(1); 
                  setFormData({sbd:'', cccd:'', otp:''}); 
                  setFiles({cccd:null, hocBa:null, giayBao:null});
                  setAdmissionResult(null);
                  setMessage({type: '', text: ''});
                }
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors"
              title="Thoát"
              disabled={isLoading}
            >
              <LogOut size={20} />
            </button>
          )}

          {/* Step Indicator (dots) */}
          <div className="flex justify-center space-x-2 mb-8">
            {[1, 2, 3, 4].map(idx => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === step ? 'w-8 bg-red-600' : 
                  idx < step ? 'w-2 bg-green-400' : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Content based on step */}
          <div className="min-h-[400px] flex flex-col justify-center">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </div>
        </div>
      </div>
      
      {/* Footer Text */}
      <footer className="w-full bg-white border-t border-gray-200 py-4 text-center mt-auto z-10 relative">
        <div className="text-sm text-gray-500">
          <p>© 2026 Học viện Công nghệ Bưu chính Viễn thông.</p>
          <p>Hỗ trợ kỹ thuật: 1900 xxxx</p>
        </div>
      </footer>
    </div>
  );
};

export default CandidatePortal;
