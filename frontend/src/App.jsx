import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- Imports Thí sinh & Auth ---
import CandidatePortal from './pages/candidate/CandidatePortal';
import OfficerLogin from './pages/officer/OfficerLogin';
import ProtectedRoute from './components/common/ProtectedRoute';

// --- Imports Layouts ---
import OfficerLayout from './components/layout/OfficerLayout';
import AdminLayout from './components/layout/AdminLayout';

// --- Imports Pages Cán bộ ---
import OfficerDashboard from './pages/officer/OfficerDashboard';
import OfficerAdmissions from './pages/officer/OfficerAdmissions';
import OfficerOnboarding from './pages/officer/OfficerOnboarding';
import OfficerApplications from './pages/officer/OfficerApplications';

// --- Imports Pages Admin ---
import AdminOfficers from './pages/admin/AdminOfficers';
import AdminAdmissionsConfig from './pages/admin/AdminAdmissionsConfig';
import AdminMajors from './pages/admin/AdminMajors';
import AdminOverview from './pages/admin/AdminOverview';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Các Route Công khai - Dành cho thí sinh */}
        <Route path="/" element={<div className="min-h-screen bg-gray-50"><CandidatePortal /></div>} />
        
        {/* Route Đăng nhập Nội bộ */}
        <Route path="/officer/login" element={<OfficerLogin />} />
        
        {/* --- CÁC ROUTE BẢO MẬT DÀNH CHO CÁN BỘ / ADMIN --- */}
        <Route element={<ProtectedRoute />}>
          
          {/* 1. CỤM ROUTE CHO CÁN BỘ */}
          <Route element={<OfficerLayout />}>
            <Route path="/officer" element={<Navigate to="/officer/dashboard" replace />} />
            <Route path="/officer/dashboard" element={<OfficerDashboard />} />
            <Route path="/officer/admissions" element={<OfficerAdmissions />} />
            <Route path="/officer/onboarding" element={<OfficerOnboarding />} />
            <Route path="/officer/applications" element={<OfficerApplications />} />
          </Route>

          {/* 2. CỤM ROUTE CHO ADMIN */}
          <Route path="/admin" element={<AdminLayout />}>
            {/* Nếu vào /admin thì tự động đẩy sang dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="officers" element={<AdminOfficers />} />
            <Route path="categories" element={<AdminMajors />} />
            <Route path="admissions-config" element={<AdminAdmissionsConfig />} />
            
          </Route>

        </Route>

        {/* Route dự phòng - Nhập sai link thì về trang chủ */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;