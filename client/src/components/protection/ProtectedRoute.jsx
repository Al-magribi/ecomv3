import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import LoadingScreen from "../loader/LoadingScreen";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isLoading } = useSelector((state) => state.auth);

  // 1. TUNGGU DATA USER (Penting: agar tidak redirect prematur)
  if (isLoading) {
    return <LoadingScreen />;
  }

  // 2. JIKA TIDAK ADA USER -> LEMPAR KE SIGNIN
  if (!user) {
    return <Navigate to='/signin' replace />;
  }

  // 3. JIKA ROLE TIDAK SESUAI -> LEMPAR KE HALAMAN UTAMA (UNAUTHORIZED)
  // Asumsi: user.role berisi string 'admin' atau 'user'
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to='/' replace />;
  }

  // 4. JIKA LOLOS -> TAMPILKAN HALAMAN
  return <Outlet />;
};

export default ProtectedRoute;
