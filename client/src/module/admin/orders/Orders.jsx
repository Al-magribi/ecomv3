import React, { useState } from "react";
import AdminLayout from "../layout/AdminLayout";
import { useGetOrdersQuery } from "../../../service/order/ApiOrder";
import Detail from "./Detail";

const Orders = () => {
  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [detailData, setDetailData] = useState(null);

  // API Hooks
  // Menggunakan limit 12 agar pas dibagi kolom 2, 3, atau 4
  const { data, isLoading, isError, refetch } = useGetOrdersQuery({
    page,
    limit: 12,
    search,
  });

  const handleViewDetail = (order) => {
    setDetailData(order);
  };

  const handleBackToList = () => {
    setDetailData(null);
    refetch(); // Refresh data saat kembali agar status terbaru muncul
  };

  // Helper: Format Rupiah
  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Helper: Badge Status
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return "bg-warning text-dark";
      case "paid": // TAMBAHAN STATUS PAID
        return "bg-success";
      case "processing":
        return "bg-info text-dark";
      case "shipped":
        return "bg-primary";
      case "completed":
        return "bg-success";
      case "cancelled":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  // --- RENDER DETAIL VIEW ---
  if (detailData) {
    return (
      <AdminLayout>
        <Detail order={detailData} onBack={handleBackToList} />
      </AdminLayout>
    );
  }

  // --- RENDER LIST VIEW ---
  return (
    <AdminLayout title={`Managemen Pesanan`}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Kelola Pesanan</h3>
      </div>

      {/* --- Filter & Search --- */}
      <div className="row mb-4">
        <div className="col-12 col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Cari Invoice / Nama Pelanggan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* --- Content Area --- */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Memuat pesanan...</p>
        </div>
      ) : isError ? (
        <div className="alert alert-danger text-center">
          Gagal memuat data. Silakan coba lagi.
        </div>
      ) : (
        <>
          {/* --- Grid Card Layout --- */}
          <div className="row g-3">
            {data?.data?.length > 0 ? (
              data.data.map((item) => (
                <div key={item.id} className="col-12 col-md-6 col-lg-4">
                  <div className="card h-100 shadow-sm border-0 hover-shadow">
                    {/* Card Header: Invoice & Status */}
                    <div className="card-header bg-white border-bottom-0 pt-3 pb-0 d-flex justify-content-between align-items-start">
                      <div>
                        <div className="fw-bold text-primary">
                          #{item.invoice_number}
                        </div>
                        <small
                          className="text-muted"
                          style={{ fontSize: "0.8rem" }}
                        >
                          <i className="bi bi-calendar me-1"></i>
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </small>
                      </div>
                      <span
                        className={`badge rounded-pill ${getStatusBadge(
                          item.status
                        )}`}
                        style={{ fontSize: "0.7rem" }}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Card Body: Info Pelanggan & Kurir */}
                    <div className="card-body">
                      {/* Info Pelanggan */}
                      <div className="mb-3 d-flex align-items-start">
                        <div className="me-2 mt-1 text-secondary">
                          <i className="bi bi-person-circle"></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">
                            {item.recipient_name}
                          </div>
                          <small className="text-muted lh-sm d-block">
                            {item.shipping_district_name},{" "}
                            {item.shipping_regency_name}
                          </small>
                        </div>
                      </div>

                      {/* Info Pengiriman */}
                      <div className="bg-light p-2 rounded small">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted">Kurir:</span>
                          <span className="fw-semibold text-uppercase">
                            {item.shipping_courier} - {item.shipping_service}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Resi:</span>
                          <span className="font-monospace text-dark">
                            {item.shipping_number || "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Total & Action */}
                    <div className="card-footer bg-white border-top-0 d-flex justify-content-between align-items-center pb-3 pt-0">
                      <div>
                        <small
                          className="text-muted d-block"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Total Pesanan
                        </small>
                        <span className="fw-bold fs-5 text-dark">
                          {formatRupiah(item.total_price)}
                        </span>
                      </div>
                      <button
                        className="btn btn-outline-primary btn-sm rounded-pill px-3"
                        onClick={() => handleViewDetail(item)}
                      >
                        Detail <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12 text-center py-5 text-muted">
                <i className="bi bi-inbox display-4 d-block mb-3"></i>
                Tidak ada pesanan ditemukan.
              </div>
            )}
          </div>

          {/* --- Pagination --- */}
          {data?.pagination && data.data.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
              <small className="text-muted">
                Halaman {data.pagination.page} dari {data.pagination.totalPage}
              </small>
              <div>
                <button
                  className="btn btn-sm btn-outline-secondary me-1"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  <i className="bi bi-chevron-left"></i> Prev
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={!data.pagination.hasNext}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default Orders;
