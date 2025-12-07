import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useDoLogoutMutation } from "../../service/auth/ApiAuth";
import { toast } from "react-toastify";
import { setSignOut } from "../../utils/authentication";

const MobileNav = () => {
  const { user } = useSelector((state) => state.auth);

  const [doLogout, { isSuccess, error, data }] = useDoLogoutMutation();

  const handleLogout = () => {
    doLogout();
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data.message);
      setSignOut();
    }
    if (error) {
      toast.error(error?.data?.message || "Logout gagal");
    }
  }, [data, error, isSuccess]);

  // Style untuk item navigasi agar seragam
  const navItemStyle = "col text-center text-decoration-none text-dark py-2";
  const iconStyle = "bi fs-5 d-block mb-1"; // fs-5: font-size icon
  const labelStyle = "d-block small"; // small: ukuran font teks kecil (10-12px)

  return (
    <nav className='navbar fixed-bottom navbar-light bg-white border-top shadow-lg d-lg-none'>
      <div className='container-fluid d-flex justify-content-between px-0'>
        {user && (
          <div className={`col text-center text-danger`} onClick={handleLogout}>
            <i className={`${iconStyle} bi-arrow-left-square-fill`}></i>
            <span className={labelStyle}>Keluar</span>
          </div>
        )}

        {/* Menu Home (Aktif) */}
        <Link to='/' className={`${navItemStyle} text-primary`}>
          <i className={`${iconStyle} bi-house-door-fill`}></i>
          <span className={labelStyle}>Home</span>
        </Link>

        {!user && (
          <Link
            to='/signin'
            className={`col text-center text-decoration-none text-primary`}
          >
            <i className={`${iconStyle} bi-arrow-right-square-fill`}></i>
            <span className={labelStyle}>Masuk</span>
          </Link>
        )}

        {user && (
          <>
            {/* Menu Transaksi */}
            <Link to='/orders' className={navItemStyle}>
              <i className={`${iconStyle} bi-receipt`}></i>
              <span className={labelStyle}>Pesanan</span>
            </Link>

            {/* Menu Akun */}
            <Link to='/profile' className={navItemStyle}>
              <i className={`${iconStyle} bi-person`}></i>
              <span className={labelStyle}>Akun</span>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default MobileNav;
