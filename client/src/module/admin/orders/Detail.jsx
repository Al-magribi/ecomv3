import React, { useState } from "react";
import { toast } from "react-toastify";
import { useAdminUpdateOrderMutation } from "../../../service/order/ApiOrder";

const Detail = ({ order, onBack }) => {
  // --- State untuk Form Update ---
  const [status, setStatus] = useState(order.status);
  const [resi, setResi] = useState(order.shipping_number || "");

  // --- API Mutation ---
  const [updateOrder, { isLoading: isUpdating }] =
    useAdminUpdateOrderMutation();

  // --- Helpers ---
  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (s) => {
    switch (s) {
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

  // --- Handlers ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (status === "shipped" && !resi) {
      toast.warning("Nomor Resi wajib diisi jika status dikirim (Shipped)");
      return;
    }

    try {
      await updateOrder({
        inv: order.invoice_number,
        status: status,
        shipping_number: resi,
      }).unwrap();
      toast.success("Pesanan berhasil diperbarui");
    } catch (error) {
      console.error(error);
      toast.error("Gagal memperbarui pesanan");
    }
  };

  return (
    <div className='fade-in'>
      {/* --- Header --- */}
      {/* Container Utama: Column di Mobile, Row di Desktop */}
      <div className='d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-4 gap-3'>
        {/* Bagian Kiri: Tombol Back & Judul */}
        <div className='d-flex align-items-center w-100 w-md-auto'>
          <button
            className='btn btn-outline-secondary me-3 flex-shrink-0'
            onClick={onBack}
          >
            <i className='bi bi-arrow-left me-md-2'></i>
            {/* Tampilkan teks 'Kembali' hanya di layar sm ke atas */}
            <span className='d-none d-sm-inline'>Kembali</span>
          </button>

          <div className='flex-grow-1 min-w-0'>
            <h4 className='mb-0 fw-bold'>Detail Pesanan</h4>
            <small className='text-muted d-block'>
              Invoice:{" "}
              <span className='text-primary fw-bold text-break'>
                {order.invoice_number}
              </span>
            </small>
          </div>
        </div>

        {/* Bagian Kanan: Badge Status */}
        {/* Di mobile, badge akan rata kanan (align-self-end), di desktop rata tengah vertikal */}
        <div className='align-self-end align-self-md-auto'>
          <span
            className={`badge rounded-pill fs-6 px-3 py-2 ${getStatusBadge(
              order.status
            )}`}
          >
            {order.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className='row g-4'>
        {/* --- KOLOM KANAN: Info & Aksi Admin --- */}
        <div className='col-lg-12'>
          <div className='row g-3'>
            {/* 1. Admin Control Panel (Update Status) */}
            <div className='col-sm-12 col-md-4'>
              <div className='card border-0 shadow-sm mb-4 bg-primary bg-opacity-10'>
                <div className='card-header bg-transparent py-3 fw-bold text-primary'>
                  <i className='bi bi-gear-wide-connected me-2'></i> Kontrol
                  Admin
                </div>
                <div className='card-body'>
                  <form onSubmit={handleUpdate}>
                    <div className='mb-3'>
                      <label className='form-label fw-bold small'>
                        Update Status
                      </label>
                      <select
                        className='form-select'
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value='pending'>Pending</option>
                        <option value='processing'>Processing</option>
                        <option value='shipped'>Shipped</option>
                        <option value='completed'>Completed</option>
                        <option value='cancelled'>Cancelled</option>
                      </select>
                    </div>

                    {/* Input Resi hanya aktif jika status shipped/completed */}
                    <div className='mb-3'>
                      <label className='form-label fw-bold small'>
                        Nomor Resi (Akan dikirim ke User)
                      </label>
                      <input
                        type='text'
                        className='form-control'
                        placeholder='Contoh: JP1234567890'
                        value={resi}
                        onChange={(e) => setResi(e.target.value)}
                        disabled={!["shipped", "completed"].includes(status)}
                      />
                    </div>

                    <div className='d-grid'>
                      <button
                        type='submit'
                        className='btn btn-primary'
                        disabled={isUpdating}
                      >
                        {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* 2. Informasi Pelanggan */}
            <div className='col-sm-12 col-md-4'>
              <div className='card border-0 shadow-sm mb-4'>
                <div className='card-header bg-white py-3 fw-bold'>
                  <i className='bi bi-person me-2'></i> Informasi Pelanggan
                </div>
                <div className='card-body'>
                  <div className='mb-3'>
                    <small className='text-muted d-block'>Nama Akun</small>
                    <span className='fw-bold'>{order.user_account_name}</span>
                  </div>

                  <div className='mb-3'>
                    <small className='text-muted d-block'>No Tlp</small>
                    <span className='fw-bold'>{order.user_phone}</span>
                  </div>
                  <div className='mb-3'>
                    <small className='text-muted d-block'>Tanggal Order</small>
                    <span className='fw-bold'>
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Informasi Pengiriman */}
            <div className='col-sm-12 col-md-4'>
              <div className='card border-0 shadow-sm'>
                <div className='card-header bg-white py-3 fw-bold'>
                  <i className='bi bi-truck me-2'></i> Alamat Pengiriman
                </div>
                <div className='card-body'>
                  <p className='fw-bold mb-1'>{order.recipient_name}</p>
                  <p className='mb-2 text-muted small'>
                    {order.shipping_address_detail}
                  </p>
                  <p className='mb-0 small'>
                    {order.shipping_village_name},{" "}
                    {order.shipping_district_name} <br />
                    {order.shipping_regency_name} -{" "}
                    {order.shipping_province_name} <br />
                    <strong>Kode Pos: {order.shipping_postal_code}</strong>
                  </p>
                  <hr />
                  <div className='d-flex justify-content-between align-items-center'>
                    <small className='text-muted'>Kurir:</small>
                    <span className='badge bg-light text-dark border'>
                      {order.shipping_courier?.toUpperCase()} -{" "}
                      {order.shipping_service}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- KOLOM KIRI: Daftar Barang --- */}
        <div className='col-lg-12'>
          <div className='card border-0 shadow-sm mb-4'>
            <div className='card-header bg-white py-3 fw-bold'>
              <i className='bi bi-box-seam me-2'></i> Item Pesanan
            </div>
            <div className='table-responsive'>
              <table className='table table-hover align-middle mb-0'>
                <thead className='table-light'>
                  <tr>
                    <th>Produk</th>
                    <th className='text-center'>Qty</th>
                    <th className='text-end'>Harga Satuan</th>
                    <th className='text-end'>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className='d-flex align-items-center'>
                          <img
                            src={item.image || "https://via.placeholder.com/50"}
                            alt={item.product_name}
                            className='rounded border me-3'
                            width='50'
                            height='50'
                            style={{ objectFit: "cover" }}
                          />
                          <div>
                            <div className='fw-bold'>{item.product_name}</div>
                            {item.variant && (
                              <small className='text-muted'>
                                Varian: {item.variant}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className='text-center'>{item.quantity}</td>
                      <td className='text-end'>{formatRupiah(item.price)}</td>
                      <td className='text-end fw-bold'>
                        {formatRupiah(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className='table-light'>
                  <tr>
                    <td colSpan='3' className='text-end'>
                      Subtotal Produk
                    </td>
                    <td className='text-end fw-bold'>
                      {formatRupiah(order.total_price - order.shipping_fee)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan='3' className='text-end'>
                      Ongkos Kirim ({order.shipping_courier?.toUpperCase()} -{" "}
                      {order.shipping_service})
                    </td>
                    <td className='text-end fw-bold'>
                      {formatRupiah(order.shipping_fee)}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan='3'
                      className='text-end fs-5 fw-bold text-primary'
                    >
                      Grand Total
                    </td>
                    <td className='text-end fs-5 fw-bold text-primary'>
                      {formatRupiah(order.total_price)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
