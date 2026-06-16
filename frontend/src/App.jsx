import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CandidatePortal from './pages/candidate/CandidatePortal';
import OfficerLogin from './pages/officer/OfficerLogin';
import OfficerDashboard from './pages/officer/OfficerDashboard';
import ProtectedRoute from './components/common/ProtectedRoute';
import OfficerLayout from './components/layout/OfficerLayout';
import OfficerAdmissions from './pages/officer/OfficerAdmissions';
import OfficerOnboarding from './pages/officer/OfficerOnboarding';
import OfficerApplications from './pages/officer/OfficerApplications';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Các Route Công khai - Dành cho thí sinh */}
        <Route path="/" element={<div className="min-h-screen bg-gray-50"><CandidatePortal /></div>} />
        
        {/* Route Đăng nhập Nội bộ */}
        <Route path="/officer/login" element={<OfficerLogin />} />
        
        {/* --- CÁC ROUTE BẢO MẬT DÀNH CHO CÁN BỘ / ADMIN --- */}
        {/* 1. Bọc bằng ProtectedRoute để chặn người dùng chưa đăng nhập */}
        <Route element={<ProtectedRoute />}>
          {/* 2. Bọc bằng OfficerLayout để dùng chung bộ khung UI (Sidebar + Header) */}
          <Route element={<OfficerLayout />}>
            {/* 3. Tự động chuyển hướng từ /officer sang /officer/dashboard */}
            <Route path="/officer" element={<Navigate to="/officer/dashboard" replace />} />
            
            {/* Các trang chức năng bên trong Layout */}
            <Route path="/officer/dashboard" element={<OfficerDashboard />} />
            <Route path="/officer/admissions" element={<OfficerAdmissions />} />
            <Route path="/officer/onboarding" element={<OfficerOnboarding />} />
            <Route path="/officer/applications" element={<OfficerApplications />} />
          </Route>
        </Route>

        {/* Route dự phòng */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
