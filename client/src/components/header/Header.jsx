import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom"; // Tambah useSearchParams
import { useDoLogoutMutation } from "../../service/auth/ApiAuth";
import { toast } from "react-toastify";
import { setSignOut } from "../../utils/authentication";
import { useGetCartQuery } from "../../service/cart/ApiCart";

// Hapus props search/setSearch karena kita akan pakai local state & URL
const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Untuk membaca URL

  // 1. Buat state lokal untuk input pencarian
  const [keyword, setKeyword] = useState("");

  const [doLogout, { isSuccess, error, data }] = useDoLogoutMutation();

  const { data: cart, isLoading } = useGetCartQuery();

  // 2. Sinkronisasi input dengan URL (agar saat di-refresh isi search tidak hilang)
  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setKeyword(query);
    } else {
      setKeyword("");
    }
  }, [searchParams]);

  const handleLogout = () => {
    doLogout();
  };

  // 3. Logic Submit: Paksa navigasi ke "/" dengan query param
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      // Ini akan mengarahkan user dari manapun (Profile/Order) kembali ke Home
      navigate(`/?q=${encodeURIComponent(keyword)}`);
    } else {
      // Jika kosong, kembalikan ke home bersih
      navigate("/");
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data.message);
      setSignOut();
    }
    if (error) {
      toast.error(error?.data?.message || "Logout gagal");
    }
  }, [data, error, isSuccess, navigate]);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top py-2">
      <div className="container">
        <Link
          className="navbar-brand d-none d-lg-flex align-items-center me-4"
          to="/"
        >
          <img
            src="/logo.png"
            alt="Logo"
            width="40"
            height="40"
            className="d-inline-block align-text-top me-2 object-fit-contain"
          />
          <span className="fw-bold text-primary fs-4">TOSERBA</span>
        </Link>

        {/* Form Search */}
        <form
          className="d-flex flex-grow-1 align-items-center"
          onSubmit={handleSearchSubmit}
        >
          <div className="input-group">
            <span className="input-group-text bg-light border-end-0 text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input
              className="form-control border-start-0 bg-light py-2"
              type="search"
              placeholder="Cari barang di Toserba..."
              aria-label="Search"
              // Gunakan state lokal 'keyword'
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </form>

        {/* Action Buttons (Cart & Auth) tetap sama seperti sebelumnya... */}
        <div className="d-flex align-items-center gap-3 ms-2 ms-lg-4">
          {!user ? (
            <>
              <div className="d-none d-lg-flex gap-2">
                <Link
                  to="/signin"
                  className="btn btn-outline-primary fw-bold px-3"
                >
                  Masuk
                </Link>
                <Link to="/signup" className="btn btn-primary fw-bold px-3">
                  Daftar
                </Link>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/cart"
                className="btn btn-light position-relative border-0"
              >
                <i className="bi bi-cart3 fs-5"></i>
                {cart?.length > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {cart?.length}
                    {isLoading && (
                      <span className="visually-hidden">Loading...</span>
                    )}
                  </span>
                )}
              </Link>

              <div className="vr d-none d-lg-block mx-2"></div>

              <div className="dropdown d-none d-lg-flex">
                <button
                  className="btn btn-light d-flex align-items-center gap-2 border-0 dropdown-toggle remove-arrow"
                  type="button"
                  id="userDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <div
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px" }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span
                    className="d-none d-lg-block fw-bold small text-truncate"
                    style={{ maxWidth: "100px" }}
                  >
                    {user?.name}
                  </span>
                </button>
                <ul
                  className="dropdown-menu dropdown-menu-end shadow border-0 mt-2"
                  aria-labelledby="userDropdown"
                >
                  <li>
                    <div className="dropdown-header d-lg-none fw-bold text-primary">
                      Halo, {user?.name}
                    </div>
                  </li>

                  {user?.role === "user" ? (
                    <>
                      <li>
                        <Link className="dropdown-item py-2" to="/profile">
                          <i className="bi bi-person me-2"></i> Profil
                        </Link>
                      </li>

                      <li>
                        <Link className="dropdown-item py-2" to="/orders">
                          <i className="bi bi-bag-check me-2"></i> Pesanan
                        </Link>
                      </li>
                    </>
                  ) : (
                    <li>
                      <Link
                        className="dropdown-item py-2"
                        to="/admin-dashboard"
                      >
                        <i className="bi bi-speedometer2 me-2"></i> Dashboard
                      </Link>
                    </li>
                  )}
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button
                      className="dropdown-item py-2 text-danger"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right me-2"></i> Keluar
                    </button>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
