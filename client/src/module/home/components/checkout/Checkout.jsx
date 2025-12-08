import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useGetCartQuery } from "../../../../service/cart/ApiCart";
import {
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
} from "../../../../service/order/ApiOrder";
import { useGetMidConfigQuery } from "../../../../service/config/ApiConfig"; // Pastikan path benar
import Header from "../../../../components/header/Header";
import Footer from "../../../../components/footer/Footer";

// Import Sub-Components
import AddressSection from "./AddressSection";
import OrderItems from "./OrderItems";
import ShippingMethod from "./ShippingMethod";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // --- REDUX STATE ---
  const { user } = useSelector((state) => state.auth);

  // Ambil config midtrans (clientKey & baseUrl)
  const { data: midtransConfig, isLoading: isConfigLoading } =
    useGetMidConfigQuery();

  // --- API MUTATION ---
  const [createOrder, { isLoading: isCreatingOrder }] =
    useCreateOrderMutation();
  const [updateOrderStatus, { isSuccess: updateSuccess }] =
    useUpdateOrderStatusMutation();

  // --- LOCAL STATE ---
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [shippingFee, setShippingFee] = useState(0);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [isSnapLoaded, setIsSnapLoaded] = useState(false); // State untuk memastikan Snap sudah load

  // Ambil alamat aktif
  const activeAddress =
    user?.addresses?.find((addr) => addr.is_primary) || user?.addresses?.[0];

  // --- DATA SOURCE: CART ---
  const { data: cartData, isLoading: isCartLoading } = useGetCartQuery(
    undefined,
    { skip: location.state?.source === "direct" }
  );

  // EFFECT: REDIRECT AFTER PAYMENT
  const handleRedirect = (url) => {
    navigate(url, { replace: true });
  };

  // --- EFFECT: LOAD SNAP SCRIPT (FIXED) ---
  useEffect(() => {
    // Hanya jalankan jika config sudah ada
    if (midtransConfig?.clientKey && midtransConfig?.midtransBaseUrl) {
      const midtransClientKey = midtransConfig.clientKey;
      const scriptSrc = `${midtransConfig.midtransBaseUrl}/snap/snap.js`;
      const scriptId = "midtrans-script";

      // Cek apakah script sudah ada agar tidak double
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.src = scriptSrc;
        script.id = scriptId;
        script.setAttribute("data-client-key", midtransClientKey);

        // Callback saat script berhasil di-load
        script.onload = () => {
          setIsSnapLoaded(true);
        };

        document.body.appendChild(script);
      } else {
        // Jika sudah ada sebelumnya, set loaded true
        setIsSnapLoaded(true);
      }
    }
  }, [midtransConfig]); // Dependency array diisi midtransConfig

  // --- EFFECT: INISIALISASI ITEM ---
  useEffect(() => {
    if (!location.state) {
      navigate("/");
      return;
    }
    if (location.state.source === "direct") {
      setCheckoutItems(location.state.items || []);
    } else if (location.state.source === "cart" && cartData) {
      setCheckoutItems(cartData);
    }
  }, [location.state, cartData, navigate]);

  // --- KALKULASI TOTAL ---
  const subTotal = checkoutItems.reduce((acc, item) => {
    return acc + Number(item.final_price) * item.quantity;
  }, 0);

  const grandTotal = subTotal + shippingFee;

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const handleShippingChange = (serviceData, courierCode) => {
    if (serviceData) {
      setSelectedService(serviceData);
      setShippingFee(serviceData.cost);
    } else {
      setSelectedService(null);
      setShippingFee(0);
    }
    if (courierCode) {
      setSelectedCourier(courierCode);
    }
  };

  // --- HANDLER BAYAR ---
  const handlePayment = async () => {
    if (!activeAddress) return alert("Alamat pengiriman belum diatur.");
    if (!selectedCourier || !selectedService) return alert("Pilih pengiriman.");

    // Validasi tambahan: Pastikan script Snap sudah siap
    if (!isSnapLoaded && !window.snap) {
      return alert(
        "Sistem pembayaran sedang memuat, silakan tunggu sebentar..."
      );
    }

    const payload = {
      items: checkoutItems,
      shipping_fee: shippingFee,
      courier: selectedCourier,
      shipping_service: selectedService.service,
      shipping_etd: selectedService.etd,
      address: activeAddress,
    };

    try {
      // 1. Request Token ke Backend
      const response = await createOrder(payload).unwrap();
      console.log("Order Created:", response);

      // 2. Jalankan Midtrans Snap
      if (response.token && window.snap) {
        window.snap.pay(response.token, {
          onSuccess: function (result) {
            updateOrderStatus({
              inv: result.order_id,
              status: "completed",
              method: result.payment_type || "unknown",
            });

            handleRedirect(result.finish_redirect_url);
          },
          onPending: function (result) {
            updateOrderStatus({
              inv: result.order_id,
              status: "pending",
              method: result.payment_type || "unknown",
            });

            handleRedirect(result.finish_redirect_url);
          },
          onError: function (result) {
            updateOrderStatus({
              inv: result.order_id,
              status: result.transaction_status || "failed",
              method: result.payment_type || "unknown",
            });

            handleRedirect(result.finish_redirect_url);
          },
          onClose: function () {
            alert(
              "Anda menutup popup pembayaran sebelum menyelesaikan transaksi."
            );
          },
        });
      } else {
        console.error("Snap Token:", response.token);
        console.error("Window Snap:", window.snap);
        alert("Gagal memuat sistem pembayaran. Coba refresh halaman.");
      }
    } catch (error) {
      console.error("Create Order Failed:", error);
      alert(
        error?.data?.message || "Terjadi kesalahan saat memproses pesanan."
      );
    }
  };

  if (isCartLoading || isConfigLoading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary"></div>
        <p className="mt-2">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />
      <div className="container py-4">
        <h2 className="mb-4 fw-bold">Pengiriman & Pembayaran</h2>
        <div className="row g-4">
          <div className="col-lg-8">
            <AddressSection activeAddress={activeAddress} />
            <OrderItems items={checkoutItems} formatRupiah={formatRupiah} />
            <ShippingMethod
              activeAddress={activeAddress}
              items={checkoutItems}
              onShippingSelect={handleShippingChange}
              formatRupiah={formatRupiah}
            />
          </div>

          <div className="col-lg-4">
            <div
              className="card shadow-sm border-0 sticky-top z-3"
              style={{ top: "20px" }}
            >
              <div className="card-header bg-white py-3">
                <h5 className="mb-0 fw-bold">Ringkasan Belanja</h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">
                    Total Harga ({checkoutItems.length} barang)
                  </span>
                  <span>{formatRupiah(subTotal)}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Total Ongkos Kirim</span>
                  <span
                    className={
                      shippingFee > 0 ? "text-dark fw-bold" : "text-danger"
                    }
                  >
                    {shippingFee > 0 ? formatRupiah(shippingFee) : "-"}
                  </span>
                </div>

                {selectedService && (
                  <div className="d-flex justify-content-between mb-3 small text-muted">
                    <span>Estimasi Tiba</span>
                    <span>{selectedService.etd} Hari</span>
                  </div>
                )}

                <hr style={{ borderStyle: "dashed" }} />

                <div className="d-flex justify-content-between mb-4 align-items-center">
                  <span className="fw-bold fs-5">Total Tagihan</span>
                  <span className="fw-bold fs-4 text-primary">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>

                <button
                  className="btn btn-primary w-100 py-3 fw-bold shadow"
                  onClick={handlePayment}
                  disabled={
                    !selectedCourier ||
                    !selectedService ||
                    isCreatingOrder ||
                    !isSnapLoaded
                  }
                >
                  {isCreatingOrder ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Memproses...
                    </>
                  ) : (
                    "BAYAR SEKARANG"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
