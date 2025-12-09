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
  const { data, isLoading, isError, refetch } = useGetOrdersQuery({
    page,
    limit: 10,
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

  // JIKA MODE DETAIL AKTIF
  if (detailData) {
    return (
      <AdminLayout>
        <Detail order={detailData} onBack={handleBackToList} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Managemen Pesanan`}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Kelola Pesanan</h3>
      </div>

      {/* --- Filter & Search --- */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
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
      </div>

      {/* --- Table Orders --- */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Invoice</th>
                  <th>Pelanggan</th>
                  <th>Total</th>
                  <th>Kurir</th>
                  <th>Status</th>
                  <th>No. Resi</th>
                  <th className="text-end pe-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      ></div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-danger">
                      Gagal memuat data.
                    </td>
                  </tr>
                ) : data?.data?.length > 0 ? (
                  data.data.map((item) => (
                    <tr key={item.id}>
                      <td className="ps-4">
                        <div className="fw-bold text-primary">
                          {item.invoice_number}
                        </div>
                        <small className="text-muted">
                          {new Date(item.created_at).toLocaleDateString(
                            "id-ID"
                          )}
                        </small>
                      </td>
                      <td>
                        <div className="fw-semibold">{item.recipient_name}</div>
                        <small
                          className="text-muted text-truncate d-block"
                          style={{ maxWidth: "150px" }}
                        >
                          {item.shipping_district_name},{" "}
                          {item.shipping_regency_name}
                        </small>
                      </td>
                      <td className="fw-bold">
                        {formatRupiah(item.total_price)}
                      </td>
                      <td>
                        <div className="d-flex flex-column align-items-start">
                          <span className="text-uppercase fw-semibold">
                            {item.shipping_courier}
                          </span>
                          <span className="badge bg-info">
                            {item.shipping_service}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge rounded-pill ${getStatusBadge(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        {item.shipping_number ? (
                          <code className="text-dark">
                            {item.shipping_number}
                          </code>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewDetail(item)} // Panggil fungsi detail
                        >
                          <i className="bi bi-eye me-1"></i> Detail
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      Tidak ada pesanan ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Pagination --- */}
        {data?.pagination && (
          <div className="card-footer bg-white d-flex flex-column flex-sm-row justify-content-between align-items-center py-3 gap-2">
            {/* Text Info */}
            <small className="text-muted text-center text-sm-start">
              Menampilkan Halaman {data.pagination.page} dari{" "}
              {data.pagination.totalPage}
            </small>

            {/* Tombol Action */}
            <div className="d-flex">
              <button
                className="btn btn-sm btn-outline-secondary me-1"
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Prev
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={!data.pagination.hasNext}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
export default Orders;
