import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = () => {
  const { user } = useSelector((state) => state.auth);

  // Check if user is logged in and is an admin (check both properties for compatibility)
  if (!user || !(user.isAdmin || user.role === 'admin')) {
    // If not logged in or not an admin, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If admin, render the child routes
  return <Outlet />;
};

export default AdminRoute; 