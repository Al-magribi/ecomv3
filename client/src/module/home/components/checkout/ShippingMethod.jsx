import React, { useState, useEffect } from "react";
import {
  useGetCouriersQuery,
  useGetShippingCostQuery,
} from "../../../../service/order/ApiOrder";

const ShippingMethod = ({
  activeAddress,
  items,
  onShippingSelect,
  formatRupiah,
}) => {
  const [selectedCourier, setSelectedCourier] = useState("");

  // Hitung Berat Total
  const totalWeight = items.reduce((acc, item) => {
    const itemWeight = item.weight ? Number(item.weight) : 1000;
    return acc + itemWeight * item.quantity;
  }, 0);

  // --- API SOURCES ---
  const { data: couriers } = useGetCouriersQuery();

  // API Ongkir (Realtime)
  const {
    data: shippingResponse,
    isFetching: isShippingLoading,
    error: shippingError,
  } = useGetShippingCostQuery(
    {
      courier: selectedCourier,
      destination: activeAddress?.village_name,
      weight: totalWeight,
    },
    {
      skip: !selectedCourier || !activeAddress || totalWeight === 0,
    }
  );

  const shippingCosts = shippingResponse?.costs || [];

  // Handle ketika user memilih kurir
  const handleCourierChange = (e) => {
    const val = e.target.value;
    setSelectedCourier(val);
    // Reset service di parent
    onShippingSelect(null, val);
  };

  // Handle ketika user memilih layanan (REG/YES)
  const handleServiceChange = (e) => {
    const serviceData = JSON.parse(e.target.value);
    // Kirim data lengkap ke parent
    onShippingSelect(serviceData, selectedCourier);
  };

  const couriesOpts = couriers?.map((c) => ({
    value: c.code,
    label: c.courier,
  }));

  return (
    <div className='card shadow-sm border-0 mb-4'>
      <div className='card-header bg-white py-3'>
        <h5 className='mb-0 fw-bold'>
          <i className='bi bi-truck me-2'></i>Metode Pengiriman
        </h5>
      </div>
      <div className='card-body'>
        {/* DROP DOWN 1: Pilih Kurir */}
        <div className='mb-3'>
          <label className='form-label fw-bold'>Pilih Kurir</label>
          <select
            className='form-select'
            value={selectedCourier}
            onChange={handleCourierChange}
            disabled={!activeAddress}
          >
            <option value='' disabled>
              -- Pilih Kurir --
            </option>
            {couriesOpts?.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Indikator Loading */}
        {isShippingLoading && (
          <div className='alert alert-info py-2 small'>
            <div className='spinner-border spinner-border-sm me-2'></div>
            Mengecek biaya kirim ke {activeAddress?.village_name}...
          </div>
        )}

        {/* Error Handling */}
        {shippingError && (
          <div className='alert alert-danger py-2 small'>
            Gagal:{" "}
            {shippingError.data?.message || "Cek koneksi atau nama daerah."}
          </div>
        )}

        {/* Info Lokasi (Opsional) */}
        {shippingResponse?.location_details && !isShippingLoading && (
          <div className='alert alert-success py-2 small mb-3'>
            <i className='bi bi-geo me-1'></i>
            Lokasi terdeteksi:{" "}
            <strong>{shippingResponse.location_details.label}</strong>
          </div>
        )}

        {/* DROP DOWN 2: Pilih Layanan (Service) */}
        {shippingCosts.length > 0 && (
          <div className='mb-3 animate__animated animate__fadeIn'>
            <label className='form-label fw-bold'>Pilih Layanan</label>
            <select
              className='form-select'
              onChange={handleServiceChange}
              defaultValue=''
            >
              <option value='' disabled>
                -- Pilih Layanan --
              </option>
              {shippingCosts.map((service, idx) => {
                const valueData = JSON.stringify({
                  service: service.service,
                  cost: service.cost,
                  etd: service.etd,
                });

                return (
                  <option key={idx} value={valueData}>
                    {service.description || service.service} -{" "}
                    {formatRupiah(service.cost)} (Estimasi {service.etd} Hari)
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Pesan Kosong */}
        {!isShippingLoading &&
          selectedCourier &&
          shippingCosts.length === 0 &&
          !shippingError && (
            <div className='text-muted small'>
              Tidak ada layanan pengiriman yang tersedia untuk rute ini.
            </div>
          )}
      </div>
    </div>
  );
};

export default ShippingMethod;
