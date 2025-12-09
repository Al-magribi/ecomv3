import React, { useEffect, useState } from "react";
import AdminLayout from "../layout/AdminLayout";
import { useGetUsersQuery } from "../../../service/reports/ApiReport";

const Users = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  const {
    data: response,
    isLoading,
    error,
  } = useGetUsersQuery({
    page,
    search: debounced,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Helper format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Helper format alamat lengkap
  const formatAddress = (user) => {
    if (!user.address_detail)
      return (
        <span className="text-muted fst-italic">Belum ada alamat utama</span>
      );
    return (
      <span className="text-dark small">
        {user.address_detail}, {user.village_name}, {user.district_name},{" "}
        {user.regency_name}, {user.province_name}{" "}
        <strong>({user.postal_code})</strong>
      </span>
    );
  };

  return (
    <AdminLayout title="Daftar Pengguna">
      <div className="container-fluid p-0">
        {/* Header & Search */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
          <p className="text-muted mb-2 mb-md-0">
            Total Pelanggan:{" "}
            <strong>{response?.pagination?.totalData || 0}</strong>
          </p>
          <div className="input-group" style={{ maxWidth: "400px" }}>
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Cari nama, email, atau penerima..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Memuat data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-danger shadow-sm">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Gagal memuat data. Silakan refresh halaman.
          </div>
        )}

        {/* DATA GRID (Card Layout) */}
        {!isLoading && !error && response && (
          <div className="row g-3">
            {response.data.map((user) => (
              <div key={user.id} className="col-12 col-md-6 col-lg-4 col-xl-4">
                <div className="card h-100 shadow-sm border-0">
                  <div className="card-body">
                    {/* User Header: Avatar (Inisial) & Name */}
                    <div className="d-flex align-items-center mb-3">
                      <div
                        className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center me-3"
                        style={{
                          width: "45px",
                          height: "45px",
                          fontSize: "1.2rem",
                          flexShrink: 0,
                        }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <h6 className="card-title fw-bold mb-0 text-truncate">
                          {user.name}
                        </h6>
                        <small className="text-muted">
                          Bergabung: {formatDate(user.created_at)}
                        </small>
                      </div>
                      <div className="ms-auto">
                        {user.is_active ? (
                          <span className="badge bg-success bg-opacity-10 text-success rounded-pill">
                            Aktif
                          </span>
                        ) : (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill">
                            Non-Aktif
                          </span>
                        )}
                      </div>
                    </div>

                    <hr className="my-2 opacity-10" />

                    {/* Contact Info */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-1">
                        <i className="bi bi-envelope text-primary me-2"></i>
                        <span className="text-muted small text-truncate">
                          {user.email}
                        </span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className="bi bi-telephone text-success me-2"></i>
                        <span className="text-muted small">
                          {user.phone || "-"}
                        </span>
                      </div>
                    </div>

                    {/* Address Section */}
                    <div className="bg-light p-2 rounded">
                      <h6 className="small fw-bold text-muted mb-1">
                        <i className="bi bi-geo-alt-fill me-1 text-danger"></i>
                        Alamat Utama
                      </h6>
                      <div style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
                        {formatAddress(user)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {response.data.length === 0 && (
              <div className="col-12 text-center py-5 text-muted">
                <i className="bi bi-people display-4 mb-3 d-block"></i>
                Belum ada data pengguna yang ditemukan.
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!isLoading &&
          !error &&
          response &&
          response.pagination.totalPage > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav>
                <ul className="pagination shadow-sm">
                  <li
                    className={`page-item ${
                      !response.pagination.hasPrev ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link border-0"
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  <li className="page-item disabled">
                    <span className="page-link border-0 fw-bold text-dark">
                      Hal {response.pagination.page} /{" "}
                      {response.pagination.totalPage}
                    </span>
                  </li>
                  <li
                    className={`page-item ${
                      !response.pagination.hasNext ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link border-0"
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
      </div>
    </AdminLayout>
  );
};

export default Users;
