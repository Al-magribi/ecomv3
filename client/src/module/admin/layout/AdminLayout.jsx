import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
// Pastikan path ini sesuai dengan slice auth Anda, contoh:
// import { logout } from "../../service/auth/AuthSlice";

const AdminLayout = ({ children, title }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    // dispatch(logout()); // Aktifkan jika ada action logout
    localStorage.clear();
    window.location.href = "/signin";
  };

  const menus = [
    { path: "/admin-dashboard", label: "Dashboard", icon: "bi-speedometer2" },
    { path: "/admin-products", label: "Produk", icon: "bi-box-seam" },
    { path: "/admin-orders", label: "Pesanan", icon: "bi-cart-check" },
    { path: "/admin-reports", label: "Laporan", icon: "bi-bar-chart-line" },
    { path: "/admin-config", label: "Konfigurasi", icon: "bi-sliders2" },
  ];

  // Komponen Sidebar Content
  const SidebarContent = () => (
    <div className='d-flex flex-column h-100 p-3 text-white bg-dark'>
      <Link
        to='/admin-dashboard'
        className='d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none'
      >
        <i className='bi bi-shop fs-4 me-2'></i>
        <span className='fs-5 fw-bold'>Administrator</span>
      </Link>
      <hr />
      <ul className='nav nav-pills flex-column mb-auto'>
        {menus.map((menu, index) => (
          <li className='nav-item mb-1' key={index}>
            <NavLink
              to={menu.path}
              className={({ isActive }) =>
                `nav-link text-white d-flex align-items-center gap-2 ${
                  isActive ? "active bg-primary" : ""
                }`
              }
            >
              <i className={`bi ${menu.icon}`}></i>
              {menu.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <hr />
      <div className='dropdown'>
        <a
          href='#'
          className='d-flex align-items-center text-white text-decoration-none dropdown-toggle'
          id='dropdownUser1'
          data-bs-toggle='dropdown'
          aria-expanded='false'
        >
          <img
            src='https://ui-avatars.com/api/?name=Admin&background=random'
            alt=''
            width='32'
            height='32'
            className='rounded-circle me-2'
          />
          <strong>Admin</strong>
        </a>
        <ul
          className='dropdown-menu dropdown-menu-dark text-small shadow'
          aria-labelledby='dropdownUser1'
        >
          <li>
            <Link className='dropdown-item' to='/profile'>
              Profile
            </Link>
          </li>
          <li>
            <hr className='dropdown-divider' />
          </li>
          <li>
            <button className='dropdown-item' onClick={handleLogout}>
              Sign out
            </button>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className='container-fluid p-0 overflow-hidden'>
      <title>{title}</title>
      <div className='row g-0'>
        {/* --- Sidebar for Desktop (Hidden on Mobile) --- */}
        <div className='col-md-3 col-lg-2 d-none d-md-block vh-100 sticky-top bg-dark'>
          <SidebarContent />
        </div>

        {/* --- Main Content Area --- */}
        <div className='col-md-9 col-lg-10 d-flex flex-column vh-100 overflow-auto bg-light'>
          {/* Mobile Header / Navbar */}
          <nav className='navbar navbar-dark bg-dark d-md-none sticky-top px-3'>
            <button
              className='navbar-toggler'
              type='button'
              data-bs-toggle='offcanvas'
              data-bs-target='#mobileSidebar'
              aria-controls='mobileSidebar'
            >
              <span className='navbar-toggler-icon'></span>
            </button>
            <span className='navbar-brand mb-0 h1'>Toserba Admin</span>
          </nav>

          {/* Offcanvas Sidebar for Mobile */}
          <div
            className='offcanvas offcanvas-start bg-dark text-white'
            tabIndex='-1'
            id='mobileSidebar'
            aria-labelledby='mobileSidebarLabel'
          >
            <div className='offcanvas-header'>
              <h5 className='offcanvas-title' id='mobileSidebarLabel'>
                Menu
              </h5>
              <button
                type='button'
                className='btn-close btn-close-white'
                data-bs-dismiss='offcanvas'
                aria-label='Close'
              ></button>
            </div>
            <div className='offcanvas-body p-0'>
              <SidebarContent />
            </div>
          </div>

          {/* Page Content */}
          <main className='p-4 flex-grow-1'>{children}</main>

          <footer className='bg-white text-center py-3 text-muted border-top'>
            <small>&copy; {new Date().getFullYear()} Toserba System.</small>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
