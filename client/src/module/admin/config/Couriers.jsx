import React from "react";
import {
  useGetCouriersQuery,
  useUpdateCourierMutation,
} from "../../../service/order/ApiOrder";
import { toast } from "react-toastify";

const Couriers = () => {
  // 1. Ambil data dari RTK Query
  const { data: couriers, isLoading, error, refetch } = useGetCouriersQuery();

  // 2. Setup Mutation untuk update
  const [updateCourier, { isLoading: isUpdating }] = useUpdateCourierMutation();

  // Fungsi untuk handle perubahan switch
  const handleToggleStatus = async (id, currentStatus, name) => {
    try {
      // Panggil API update (isactive dibalik nilainya)
      await updateCourier({ id, isactive: !currentStatus }).unwrap();
      toast.success(`Status kurir ${name} berhasil diperbarui`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui status kurir");
    }
  };

  return (
    <div className="container-fluid">
      {/* State Loading */}
      {isLoading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Memuat data kurir...</p>
        </div>
      )}

      {/* State Error */}
      {error && (
        <div className="alert alert-danger shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Terjadi kesalahan saat mengambil data kurir.
        </div>
      )}

      {/* State Data Ada - Tampilan Card Grid */}
      {!isLoading && !error && couriers && (
        <div className="row g-3">
          {couriers.map((item) => (
            <div key={item.id} className="col-12 col-md-6 col-lg-4">
              <div
                className={`card h-100 shadow-sm ${
                  item.isactive
                    ? "bg-success bg-opacity-10"
                    : "bg-secondary bg-opacity-10"
                }`}
              >
                <div className="card-body d-flex flex-column justify-content-between">
                  {/* Bagian Atas: Nama & Kode */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h6 className="fw-bold text-dark mb-1">{item.courier}</h6>
                      <span className="text-muted small">
                        Kode: <code>{item.code}</code>
                      </span>
                    </div>
                    <div className="icon-box">
                      {/* Ikon Dekoratif */}
                      <i
                        className={`bi bi-truck fs-4 ${
                          item.isactive ? "text-success" : "text-secondary"
                        }`}
                      ></i>
                    </div>
                  </div>

                  {/* Bagian Bawah: Toggle Switch */}
                  <div className="d-flex align-items-center justify-content-between border-top pt-3 mt-2">
                    <span className="small fw-bold text-secondary">
                      {item.isactive ? "Matikan" : "Aktifkan"}
                    </span>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id={`switch-${item.id}`}
                        checked={item.isactive}
                        disabled={isUpdating}
                        onChange={() =>
                          handleToggleStatus(
                            item.id,
                            item.isactive,
                            item.courier
                          )
                        }
                        style={{ cursor: "pointer", transform: "scale(1.3)" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {couriers.length === 0 && (
            <div className="col-12">
              <div className="alert alert-info text-center">
                Tidak ada data kurir yang tersedia.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Couriers;
