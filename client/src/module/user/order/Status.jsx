import React, { useEffect, useState } from "react";
import Header from "../../../components/header/Header";
import Footer from "../../../components/footer/Footer";
import { useParams, useNavigate } from "react-router-dom";
import { useGetOrderStatusQuery } from "../../../service/order/ApiOrder";

const Status = () => {
  const { inv } = useParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(15); // Diperpanjang jadi 10 detik agar user sempat baca

  // Fetch Data
  const {
    data: order,
    isLoading,
    error,
  } = useGetOrderStatusQuery(inv, { skip: !inv });

  // Logic Redirect
  useEffect(() => {
    if (!isLoading && order) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      if (countdown === 0) {
        navigate("/");
      }
      return () => clearInterval(timer);
    }
  }, [countdown, isLoading, order, navigate]);

  // Helpers
  const formatRupiah = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "settlement":
      case "completed":
      case "capture":
      case "success":
        return {
          color: "success",
          icon: "bi-check-circle-fill",
          text: "Pembayaran Berhasil",
          desc: "Terima kasih! Pesanan Anda sedang kami proses.",
        };
      case "pending":
        return {
          color: "warning",
          icon: "bi-hourglass-split",
          text: "Menunggu Pembayaran",
          desc: "Mohon selesaikan pembayaran Anda.",
        };
      case "expire":
      case "cancel":
      case "deny":
        return {
          color: "danger",
          icon: "bi-x-circle-fill",
          text: "Pembayaran Gagal",
          desc: "Transaksi gagal atau kadaluarsa.",
        };
      default:
        return {
          color: "secondary",
          icon: "bi-info-circle-fill",
          text: status || "Status Unknown",
          desc: "Silakan cek riwayat pesanan.",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex flex-column min-vh-100 bg-light">
        <Header />
        <div className="container py-5 text-center flex-grow-1 d-flex align-items-center justify-content-center">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="d-flex flex-column min-vh-100 bg-light">
        <Header />
        <div className="container py-5 text-center flex-grow-1">
          <div className="alert alert-danger">
            Pesanan tidak ditemukan atau error server.
          </div>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const items = order.items || [];

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />

      <div className="container py-5 flex-grow-1 d-flex justify-content-center">
        <div
          className="card shadow-lg border-0 rounded-4 w-100"
          style={{ maxWidth: "550px" }}
        >
          {/* HEADER STATUS */}
          <div
            className={`card-header bg-${statusConfig.color} text-white text-center py-4 rounded-top-4`}
          >
            <i
              className={`bi ${statusConfig.icon} mb-2`}
              style={{ fontSize: "3.5rem" }}
            ></i>
            <h4 className="fw-bold m-0">{statusConfig.text}</h4>
            <p className="small opacity-75 mt-2 mb-0">{statusConfig.desc}</p>
          </div>

          <div className="card-body p-4">
            {/* INFO TRANSAKSI */}
            <div className="mb-4">
              <h6 className="fw-bold text-muted text-uppercase small mb-3">
                Detail Transaksi
              </h6>
              <div className="d-flex justify-content-between mb-2 small">
                <span className="text-muted">No. Invoice</span>
                <span className="fw-bold text-dark">
                  {order.invoice_number}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-2 small">
                <span className="text-muted">Tanggal</span>
                <span className="fw-bold text-dark">
                  {formatDate(order.created_at)}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-2 small">
                <span className="text-muted">Kurir</span>
                <span className="fw-bold text-dark text-uppercase">
                  {order.shipping_courier} ({order.shipping_service})
                </span>
              </div>
            </div>

            <hr className="border-secondary-subtle" />

            {/* LIST PRODUK */}
            <div className="mb-4">
              <h6 className="fw-bold text-muted text-uppercase small mb-3">
                Rincian Produk
              </h6>
              <div
                className="list-group list-group-flush overflow-auto"
                style={{ maxHeight: "200px" }}
              >
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="list-group-item px-0 py-2 d-flex align-items-center border-0"
                  >
                    <img
                      src={
                        item.image_url ||
                        "https://dummyimage.com/100x100/ccc/fff"
                      }
                      alt={item.product_name}
                      className="rounded border"
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                      }}
                    />
                    <div className="ms-3 flex-grow-1 lh-1">
                      <span className="d-block fw-bold text-dark small mb-1">
                        {item.product_name}
                      </span>
                      {item.variant_name && (
                        <span
                          className="d-block text-muted x-small"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Varian: {item.variant_name}
                        </span>
                      )}
                      <span
                        className="text-muted x-small"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {item.quantity} x {formatRupiah(item.price)}
                      </span>
                    </div>
                    <div className="fw-bold small text-dark">
                      {formatRupiah(item.quantity * item.price)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ongkir Item (Optional Display) */}
              <div className="d-flex justify-content-between mt-2 pt-2 border-top border-dashed">
                <span className="small text-muted">Ongkos Kirim</span>
                <span className="small fw-bold">
                  {formatRupiah(order.shipping_fee || 0)}
                </span>
              </div>
            </div>

            {/* TOTAL */}
            <div className="alert alert-secondary d-flex justify-content-between align-items-center mb-4 border-0">
              <span className="fw-bold text-secondary">Total Bayar</span>
              <span className="fw-bold text-primary fs-5">
                {formatRupiah(order.total_price)}
              </span>
            </div>

            {/* TOMBOL & REDIRECT */}
            <div className="text-center">
              <div className="mb-3">
                <small className="text-muted fst-italic">
                  Mengalihkan otomatis dalam {countdown}...
                </small>
              </div>
              <button
                onClick={() => navigate("/")}
                className="btn btn-outline-dark w-100"
              >
                Kembali ke Beranda Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Status;
