import { useEffect, useState } from "react";
import { useGetMyOrdersQuery } from "../../../service/order/ApiOrder";
import { Link } from "react-router-dom";
import Header from "../../../components/header/Header";
import Footer from "../../../components/footer/Footer";
import Detail from "./Detail";
import MobileNav from "../../../components/layout/MobileNav";
import Review from "./Review";

const Order = () => {
  // --- STATE ---
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 5; // Menampilkan 5 pesanan per halaman
  const [debounced, setDebounced] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null); // Menyimpan order yg diklik
  const [showDetailModal, setShowDetailModal] = useState(false);

  // --- RTK QUERY ---
  const {
    data: orderData,
    isLoading,
    isError,
  } = useGetMyOrdersQuery(
    {
      page,
      limit,
      search: debounced,
    },
    { pollingInterval: 30000 }
  );

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

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset ke halaman 1 saat mencari
  };

  const handleShowDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // --- RENDER CONTENT ---
  return (
    <div className='d-flex flex-column min-vh-100 bg-light'>
      <title>Pesanan</title>
      <Header />
      <div className='container py-3'>
        {/* HEADER & SEARCH */}
        <div className='d-flex flex-column flex-md-row justify-content-between align-items-center mb-4'>
          <h4 className='fw-bold mb-3 mb-md-0'>
            <i className='bi bi-bag-check-fill text-primary me-2'></i>
            Riwayat Pesanan
          </h4>
          <div className='input-group' style={{ maxWidth: "300px" }}>
            <span className='input-group-text bg-white border-end-0'>
              <i className='bi bi-search text-muted'></i>
            </span>
            <input
              type='text'
              className='form-control border-start-0 ps-0'
              placeholder='Cari Invoice / Produk...'
              value={search}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading && (
          <div className='text-center py-5'>
            <div className='spinner-border text-primary' role='status'></div>
            <p className='mt-2 text-muted'>Memuat pesanan...</p>
          </div>
        )}

        {/* ERROR STATE */}
        {isError && (
          <div className='alert alert-danger text-center'>
            Gagal mengambil data pesanan. Silakan coba lagi.
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && !isError && orderData?.data.length === 0 && (
          <div className='text-center py-5 bg-light rounded-3'>
            <i className='bi bi-cart-x fs-1 text-muted'></i>
            <h5 className='mt-3'>Belum ada pesanan</h5>
            <p className='text-muted'>Yuk mulai belanja produk impianmu!</p>
            <Link to='/products' className='btn btn-primary'>
              Belanja Sekarang
            </Link>
          </div>
        )}

        {/* ORDER LIST */}
        <div className='row g-4'>
          {orderData?.data.map((order) => (
            <div key={order.id} className='col-12'>
              <div className='card shadow-sm border-0 overflow-hidden'>
                {/* CARD HEADER */}
                <div className='card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom'>
                  <div>
                    <span className='fw-bold me-2'>{order.invoice_number}</span>
                    <span className='text-muted small d-block d-md-inline'>
                      <i className='bi bi-calendar me-1'></i>
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                  <span
                    className={`badge rounded-pill px-3 py-2 ${getStatusBadge(
                      order.status
                    )} text-uppercase`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* CARD BODY (ITEMS) */}
                <div className='card-body'>
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className='d-flex align-items-center mb-3 last:mb-0'
                    >
                      {/* Thumbnail */}
                      <img
                        src={item.image || "https://via.placeholder.com/80"}
                        alt={item.product_name}
                        className='rounded border'
                        style={{
                          width: "70px",
                          height: "70px",
                          objectFit: "cover",
                        }}
                      />

                      {/* Item Details */}
                      <div className='ms-3 flex-grow-1'>
                        <h6
                          className='mb-1 fw-semibold text-truncate'
                          style={{ maxWidth: "250px" }}
                        >
                          {item.product_name}
                        </h6>
                        <p className='mb-0 small text-muted'>
                          {item.variant
                            ? `Varian: ${item.variant}`
                            : "Produk Satuan"}
                          <span className='mx-2'>•</span>
                          {item.quantity} x {formatRupiah(item.price)}
                        </p>
                      </div>

                      {/* Subtotal Item (Optional, hidden on small screens) */}
                      <div className='text-end d-none d-sm-block'>
                        <span className='fw-bold text-dark'>
                          {formatRupiah(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CARD FOOTER */}
                <div className='card-footer bg-light d-flex justify-content-between align-items-center py-3'>
                  <div>
                    <small className='text-muted d-block'>Total Belanja</small>
                    <span className='fw-bold fs-5 text-primary'>
                      {formatRupiah(order.total_price)}
                    </span>
                  </div>

                  <div className='d-flex gap-2'>
                    <button
                      className='btn btn-outline-secondary btn-sm'
                      onClick={() => handleShowDetail(order)} // <--- Panggil handler
                    >
                      Detail
                    </button>
                    {/* Tampilkan tombol Bayar hanya jika status pending */}
                    {order.status === "pending" && (
                      <button className='btn btn-primary btn-sm'>
                        Bayar Sekarang
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        {!isLoading && orderData?.pagination?.totalPage > 1 && (
          <div className='d-flex justify-content-center mt-5'>
            <nav>
              <ul className='pagination'>
                {/* Prev Button */}
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button
                    className='page-link'
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </button>
                </li>

                {/* Page Numbers */}
                {[...Array(orderData.pagination.totalPage)].map((_, i) => (
                  <li
                    key={i + 1}
                    className={`page-item ${page === i + 1 ? "active" : ""}`}
                  >
                    <button
                      className='page-link'
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}

                {/* Next Button */}
                <li
                  className={`page-item ${
                    !orderData.pagination.hasNext ? "disabled" : ""
                  }`}
                >
                  <button
                    className='page-link'
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      <Detail
        show={showDetailModal}
        onClose={handleCloseDetail}
        order={selectedOrder}
      />

      <Footer />

      <MobileNav />
    </div>
  );
};

export default Order;
