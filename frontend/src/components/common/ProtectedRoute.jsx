import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token || (role !== 'ADMIN' && role !== 'OFFICER')) {
    return <Navigate to="/officer/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
