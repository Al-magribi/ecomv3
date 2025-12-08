import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import LoadingScreen from "../loader/LoadingScreen";

const PublicRoute = () => {
  const { user, isLoading } = useSelector((state) => state.auth);

  // // 1. Tunggu loading selesai
  // if (isLoading) {
  //   return <LoadingScreen />;
  // }

  // 2. Jika user SUDAH ADA di store -> Lempar ke Home atau Dashboard
  if (user) {
    // Opsional: Bisa dibedakan jika admin ke dashboard, user ke home
    if (user.role === "admin")
      return <Navigate to='/admin-dashboard' replace />;
    return <Navigate to='/' replace />;
  }

  // 3. Jika belum login -> Boleh akses (Signin/Signup)
  return <Outlet />;
};

export default PublicRoute;
