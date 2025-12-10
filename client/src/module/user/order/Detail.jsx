import React from "react";

const Detail = ({ show, onClose, order }) => {
  if (!show || !order) return null;

  // --- HELPERS ---
  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return "bg-warning text-dark";
      case "paid":
        return "bg-info text-white";
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

  // Hitung Subtotal Item (Total Harga Barang Saja)
  const subtotalItems = order.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          {/* HEADER */}
          <div className="modal-header">
            <div>
              <h5 className="modal-title fw-bold">Detail Pesanan</h5>
              <span className="text-muted small">{order.invoice_number}</span>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          {/* BODY */}
          <div className="modal-body">
            {/* 1. STATUS BAR */}
            <div className="alert alert-light border d-flex justify-content-between align-items-center mb-4">
              <div>
                <small className="text-muted d-block">Status Pesanan</small>
                <span
                  className={`badge ${getStatusBadge(
                    order.status
                  )} text-uppercase`}
                >
                  {order.status}
                </span>
              </div>
              <div className="text-end">
                <small className="text-muted d-block">Tanggal Pemesanan</small>
                <span className="fw-bold text-dark small">
                  {formatDate(order.created_at)}
                </span>
              </div>
            </div>

            {/* 2. DETAIL PENGIRIMAN (HIGHLIGHT) */}
            <h6 className="fw-bold mb-3 text-primary">
              <i className="bi bi-truck me-2"></i>Informasi Pengiriman
            </h6>
            <div className="card mb-4 bg-light border-0">
              <div className="card-body">
                <div className="row">
                  {/* Alamat Penerima */}
                  <div className="col-md-6 mb-3 mb-md-0 border-end-md">
                    <small className="text-muted fw-bold">
                      Alamat Penerima
                    </small>
                    <p className="mb-0 fw-bold mt-1">{order.recipient_name}</p>
                    <p
                      className="mb-0 small text-secondary"
                      style={{ whiteSpace: "pre-line" }}
                    >
                      {order.shipping_address_detail} <br />
                      {order.shipping_village_name},{" "}
                      {order.shipping_district_name} <br />
                      {order.shipping_regency_name},{" "}
                      {order.shipping_province_name} <br />
                      Kode Pos: {order.shipping_postal_code}
                    </p>
                  </div>

                  {/* Jasa Pengiriman */}
                  <div className="col-md-6">
                    <small className="text-muted fw-bold">Jasa Ekspedisi</small>
                    <div className="d-flex align-items-center mt-1">
                      <div className="badge bg-white text-dark border me-2">
                        {order.shipping_courier?.toUpperCase()}
                      </div>
                      <span className="fw-bold">{order.shipping_service}</span>
                    </div>

                    {/* Placeholder No Resi (Jika nanti ada datanya) */}
                    <div className="mt-2">
                      <small className="text-muted">No. Resi:</small> <br />
                      <span className="fw-bold text-dark font-monospace">
                        {order.shipping_number || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. DAFTAR PRODUK */}
            <h6 className="fw-bold mb-3 text-primary">
              <i className="bi bi-box-seam me-2"></i>Rincian Produk
            </h6>
            <div className="border rounded p-3 mb-4">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`d-flex align-items-center ${
                    idx !== order.items.length - 1
                      ? "mb-3 pb-3 border-bottom"
                      : ""
                  }`}
                >
                  <img
                    src={item.image || "https://via.placeholder.com/80"}
                    alt={item.product_name}
                    className="rounded border"
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "cover",
                    }}
                  />
                  <div className="ms-3 flex-grow-1">
                    <h6 className="mb-1 small fw-bold">{item.product_name}</h6>
                    <p className="mb-0 small text-muted">
                      {item.variant
                        ? `Varian: ${item.variant}`
                        : "Tanpa Varian"}
                    </p>
                    <p className="mb-0 small text-muted">
                      {item.quantity} x {formatRupiah(item.price)}
                    </p>
                  </div>
                  <div className="text-end">
                    <span className="fw-bold small">
                      {formatRupiah(item.quantity * item.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 4. RINCIAN PEMBAYARAN */}
            <h6 className="fw-bold mb-3 text-primary">
              <i className="bi bi-wallet2 me-2"></i>Rincian Pembayaran
            </h6>
            <div className="border rounded p-3">
              <div className="d-flex justify-content-between mb-2 small">
                <span className="text-muted">
                  Total Harga ({order.items.length} Barang)
                </span>
                <span>{formatRupiah(subtotalItems)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 small">
                <span className="text-muted">Total Ongkos Kirim</span>
                <span>{formatRupiah(order.shipping_fee)}</span>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between fw-bold">
                <span>Total Belanja</span>
                <span className="text-primary fs-5">
                  {formatRupiah(order.total_price)}
                </span>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Tutup
            </button>
            {order.status === "pending" && (
              <button type="button" className="btn btn-primary">
                Bayar Sekarang
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
