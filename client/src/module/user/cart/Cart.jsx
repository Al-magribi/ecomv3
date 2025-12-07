import React, { useState, useEffect } from "react";
import {
  useGetCartQuery,
  useUpdateCartQtyMutation,
  useDeleteCartItemMutation,
} from "../../../service/cart/ApiCart";
import Header from "../../../components/header/Header";
import Footer from "../../../components/footer/Footer";
import MobileNav from "../../../components/layout/MobileNav";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Cart = () => {
  const navigate = useNavigate();

  // 1. Fetch Data
  const { data: cartItems, isLoading, isError } = useGetCartQuery();

  const [
    deleteCartItem,
    { data, error, isLoading: delLoading, isSuccess, reset },
  ] = useDeleteCartItemMutation();

  // 2. Mutations
  const [updateQty] = useUpdateCartQtyMutation();

  // 3. State untuk Item yang Dipilih (Array of cart_id)
  const [selectedItems, setSelectedItems] = useState([]);

  // Helper: Format Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  // --- LOGIC: SELECTION ---

  // Handle Pilih Satu Item
  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Handle Pilih Semua
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Masukkan semua ID ke state
      const allIds = cartItems.map((item) => item.cart_id);
      setSelectedItems(allIds);
    } else {
      // Kosongkan state
      setSelectedItems([]);
    }
  };

  // --- LOGIC: CART ACTIONS ---

  const handleQtyChange = (item, newQty) => {
    if (newQty < 1) return;
    if (newQty > item.available_stock) {
      alert("Stok maksimal tercapai");
      return;
    }
    updateQty({ cart_id: item.cart_id, quantity: newQty });
  };

  const handleDelete = (id) => {
    if (window.confirm("Hapus item ini dari keranjang?")) {
      deleteCartItem(id);
      // Hapus juga dari selectedItems agar tidak nyangkut
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data.message);
      reset();
    }

    if (error) {
      toast.error(error.data.message);
      reset();
    }
  }, [data, error, isSuccess]);

  // --- LOGIC: CALCULATIONS ---

  // Filter item yang dipilih saja
  const selectedCartItems = cartItems?.filter((item) =>
    selectedItems.includes(item.cart_id)
  );

  // Hitung Total Belanja (Hanya dari item yang dipilih)
  const grandTotal = selectedCartItems?.reduce((acc, item) => {
    return acc + Number(item.final_price) * item.quantity;
  }, 0);

  // --- LOGIC: CHECKOUT ---

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      alert("Pilih minimal satu barang untuk di-checkout!");
      return;
    }

    // Kirim Item yang dipilih via State ke halaman Checkout
    // Kita gunakan mode 'direct' agar Checkout.jsx memakai data yang kita kirim,
    // bukan fetch ulang semua keranjang.
    navigate("/checkout", {
      state: {
        source: "direct", // Trick: anggap ini beli langsung agar checkout membaca `items`
        items: selectedCartItems,
      },
    });
  };

  // --- RENDERING ---

  if (isLoading) {
    return (
      <div className='d-flex flex-column min-vh-100 bg-light'>
        <Header />
        <div className='container mt-5 text-center'>
          <div className='spinner-border text-primary' role='status'>
            <span className='visually-hidden'>Loading...</span>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='d-flex flex-column min-vh-100 bg-light'>
        <Header />
        <div className='container mt-5'>
          <div className='alert alert-danger'>
            Gagal memuat keranjang belanja.
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className='d-flex flex-column min-vh-100 bg-light'>
        <Header />
        <div className='container mt-5 text-center'>
          <div className='card shadow-sm p-5'>
            <i className='bi bi-cart-x display-1 text-muted mb-3'></i>
            <h3>Keranjang Anda Kosong</h3>
            <p className='text-muted'>
              Yuk mulai belanja barang-barang menarik!
            </p>
            <a href='/' className='btn btn-primary mt-3'>
              Mulai Belanja
            </a>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // Cek status "Select All" checkbox
  const isAllSelected =
    cartItems.length > 0 && selectedItems.length === cartItems.length;

  return (
    <div className='d-flex flex-column min-vh-100 bg-light'>
      <Header />
      <div className='container py-3'>
        <h2 className='mb-4 fw-bold'>Keranjang Belanja</h2>

        <div className='row'>
          {/* Kolom Kiri: List Items */}
          <div className='col-lg-8'>
            <div className='card shadow-sm border-0'>
              <div className='card-body p-0'>
                <div className='table-responsive'>
                  <table className='table align-middle mb-0'>
                    <thead className='bg-light'>
                      <tr>
                        {/* CHECKBOX PILIH SEMUA */}
                        <th className='ps-4' style={{ width: "50px" }}>
                          <div className='form-check'>
                            <input
                              className='form-check-input'
                              type='checkbox'
                              checked={isAllSelected}
                              onChange={handleSelectAll}
                              style={{ cursor: "pointer" }}
                            />
                          </div>
                        </th>
                        <th>Produk</th>
                        <th className='text-center'>Harga</th>
                        <th className='text-center'>Jumlah</th>
                        <th className='text-end pe-4'>Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => (
                        <tr key={item.cart_id}>
                          {/* CHECKBOX PER ITEM */}
                          <td className='ps-4'>
                            <div className='form-check'>
                              <input
                                className='form-check-input'
                                type='checkbox'
                                checked={selectedItems.includes(item.cart_id)}
                                onChange={() => handleSelectItem(item.cart_id)}
                                style={{ cursor: "pointer" }}
                              />
                            </div>
                          </td>

                          {/* Info Produk */}
                          <td className='py-3'>
                            <div className='d-flex align-items-center'>
                              <img
                                src={
                                  item.image_url ||
                                  "https://dummyimage.com/100x100/ccc/fff"
                                }
                                alt={item.product_name}
                                className='rounded me-3'
                                style={{
                                  width: "60px",
                                  height: "60px",
                                  objectFit: "cover",
                                }}
                              />
                              <div>
                                <p className='mb-0 fw-bold text-dark'>
                                  {item.product_name}
                                </p>
                                {item.variant_name && (
                                  <small className='text-muted badge bg-light text-dark border'>
                                    {item.variant_name}
                                  </small>
                                )}
                                <div className='small text-muted mt-1'>
                                  Stok: {item.available_stock}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Harga Satuan */}
                          <td className='text-center'>
                            {formatRupiah(item.final_price)}
                          </td>

                          {/* Input Qty */}
                          <td
                            className='text-center'
                            style={{ minWidth: "120px" }}
                          >
                            <div className='input-group input-group-sm justify-content-center'>
                              <button
                                className='btn btn-outline-secondary'
                                onClick={() =>
                                  handleQtyChange(item, item.quantity - 1)
                                }
                                disabled={item.quantity <= 1}
                              >
                                -
                              </button>
                              <span className='input-group-text px-3 bg-white'>
                                {item.quantity}
                              </span>
                              <button
                                className='btn btn-outline-secondary'
                                onClick={() =>
                                  handleQtyChange(item, item.quantity + 1)
                                }
                                disabled={item.quantity >= item.available_stock}
                              >
                                +
                              </button>
                            </div>
                          </td>

                          {/* Subtotal */}
                          <td className='text-end pe-4 fw-bold'>
                            {formatRupiah(item.final_price * item.quantity)}
                          </td>

                          {/* Tombol Hapus */}
                          <td className='text-end'>
                            <button
                              className='btn btn-link text-danger p-0 me-3'
                              onClick={() => handleDelete(item.cart_id)}
                              title='Hapus'
                            >
                              <i className='bi bi-trash'></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Ringkasan Belanja */}
          <div className='col-lg-4 mt-4 mt-lg-0'>
            <div
              className='card shadow-sm border-0 sticky-top'
              style={{ top: "20px" }}
            >
              <div className='card-body'>
                <h5 className='card-title fw-bold mb-4'>Ringkasan Belanja</h5>

                <div className='d-flex justify-content-between mb-3'>
                  <span className='text-muted'>Total Item Terpilih</span>
                  <span className='fw-bold text-dark'>
                    {selectedItems.length} Barang
                  </span>
                </div>

                <hr />

                <div className='d-flex justify-content-between mb-4'>
                  <span className='fw-bold'>Total Harga</span>
                  <span className='fw-bold text-primary fs-5'>
                    {formatRupiah(grandTotal || 0)}
                  </span>
                </div>

                <button
                  className='btn btn-primary w-100 py-2 fw-bold shadow-sm'
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0} // Disable jika tidak ada yg dipilih
                >
                  Checkout ({selectedItems.length})
                </button>

                <div className='mt-3 text-center'>
                  <small className='text-muted'>
                    <i className='bi bi-shield-check'></i> Transaksi Aman &
                    Terpercaya
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
};

export default Cart;
