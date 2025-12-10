import React, { useState, useEffect } from "react";
import {
  useGetProvincesQuery,
  useGetRegenciesQuery,
  useGetDistrictsQuery,
  useGetVillagesQuery,
  useSaveAddressMutation,
} from "../../../service/address/ApiAddress"; // Sesuaikan path import
import { toast } from "react-toastify";

const ModalAddress = ({ show, onClose, initialData, userDefaultName }) => {
  // --- 1. STATE FORM ---
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    recipient_name: "",
    phone: "",
    detail: "",
    postal_code: "",
    province_id: "",
    regency_id: "",
    district_id: "",
    village_id: "",
    is_primary: false,
  });

  // --- 2. RTK QUERY HOOKS (CHAINED) ---

  // A. Fetch Provinsi (Selalu jalan)
  const { data: provinces, isLoading: loadProv } = useGetProvincesQuery();

  // B. Fetch Kota (Jalan jika province_id ada)
  const { data: regencies, isLoading: loadCity } = useGetRegenciesQuery(
    formData.province_id,
    { skip: !formData.province_id } // Skip jika provinsi belum dipilih
  );

  // C. Fetch Kecamatan (Jalan jika regency_id ada)
  const { data: districts, isLoading: loadDist } = useGetDistrictsQuery(
    formData.regency_id,
    { skip: !formData.regency_id }
  );

  // D. Fetch Desa (Jalan jika district_id ada)
  const { data: villages, isLoading: loadVill } = useGetVillagesQuery(
    formData.district_id,
    { skip: !formData.district_id }
  );

  // E. Mutation Save
  const [saveAddress, { isLoading: isSaving, data, error, isSuccess }] =
    useSaveAddressMutation();

  // --- 3. EFFECT: INISIALISASI DATA (EDIT / NEW) ---
  useEffect(() => {
    if (show) {
      if (initialData) {
        // MODE EDIT: Isi form dengan data lama
        setFormData({
          id: initialData.id,
          title: initialData.title || "",
          recipient_name: initialData.recipient_name || "",
          phone: initialData.phone || "",
          detail: initialData.detail || "",
          postal_code: initialData.postal_code || "",
          province_id: initialData.province_id
            ? initialData.province_id.trim()
            : "",
          regency_id: initialData.regency_id
            ? initialData.regency_id.trim()
            : "",
          district_id: initialData.district_id
            ? initialData.district_id.trim()
            : "",
          village_id: initialData.village_id
            ? initialData.village_id.trim()
            : "",
          is_primary: initialData.is_primary || false,
        });
      } else {
        // MODE TAMBAH BARU: Reset form
        setFormData({
          id: null,
          title: "",
          recipient_name: userDefaultName || "",
          phone: "",
          detail: "",
          postal_code: "",
          province_id: "",
          regency_id: "",
          district_id: "",
          village_id: "",
          is_primary: false,
        });
      }
    }
  }, [show, initialData, userDefaultName]);

  // --- 4. HANDLERS ---

  // Handle Text Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Checkbox
  const handleCheck = (e) => {
    setFormData({ ...formData, is_primary: e.target.checked });
  };

  // Handle Wilayah Change (Dengan Reset Logic)
  const handleProvinceChange = (e) => {
    setFormData({
      ...formData,
      province_id: e.target.value,
      regency_id: "", // Reset anak-anaknya
      district_id: "",
      village_id: "",
    });
  };

  const handleRegencyChange = (e) => {
    setFormData({
      ...formData,
      regency_id: e.target.value,
      district_id: "", // Reset anak-anaknya
      village_id: "",
    });
  };

  const handleDistrictChange = (e) => {
    setFormData({
      ...formData,
      district_id: e.target.value,
      village_id: "", // Reset anaknya
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Panggil API Save (Create/Update otomatis dihandle backend based on ID)
    saveAddress(formData);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data.message);
      onClose();
    }

    if (error) {
      toast.error(error.data.message);
    }
  }, [data, error, isSuccess]);

  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {initialData ? "Edit Alamat" : "Tambah Alamat Baru"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={isSaving}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                {/* --- DATA PENERIMA --- */}
                <div className="col-md-6">
                  <label className="form-label fw-bold">Label Alamat</label>
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    placeholder="Contoh: Rumah, Kantor"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Nama Penerima</label>
                  <input
                    type="text"
                    name="recipient_name"
                    className="form-control"
                    value={formData.recipient_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Nomor Telepon</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Kode Pos</label>
                  <input
                    type="text"
                    name="postal_code"
                    className="form-control"
                    value={formData.postal_code}
                    onChange={handleChange}
                  />
                </div>

                {/* --- WILAYAH DROPDOWNS --- */}
                <div className="col-12">
                  <hr className="text-muted" />
                </div>
                <div className="col-12">
                  <h6 className="fw-bold text-primary">Data Wilayah</h6>
                </div>

                {/* 1. PROVINSI */}
                <div className="col-md-6">
                  <label className="form-label">Provinsi</label>
                  <select
                    className="form-select"
                    name="province_id"
                    value={formData.province_id}
                    onChange={handleProvinceChange}
                    disabled={loadProv}
                    required
                  >
                    <option value="">-- Pilih Provinsi --</option>
                    {provinces?.map((prov) => (
                      <option key={prov.id} value={prov.id}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. KOTA / KABUPATEN */}
                <div className="col-md-6">
                  <label className="form-label">Kota / Kabupaten</label>
                  <select
                    className="form-select"
                    name="regency_id"
                    value={formData.regency_id}
                    onChange={handleRegencyChange}
                    disabled={!formData.province_id || loadCity}
                    required
                  >
                    <option value="">-- Pilih Kota/Kab --</option>
                    {regencies?.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. KECAMATAN */}
                <div className="col-md-6">
                  <label className="form-label">Kecamatan</label>
                  <select
                    className="form-select"
                    name="district_id"
                    value={formData.district_id}
                    onChange={handleDistrictChange}
                    disabled={!formData.regency_id || loadDist}
                    required
                  >
                    <option value="">-- Pilih Kecamatan --</option>
                    {districts?.map((dist) => (
                      <option key={dist.id} value={dist.id}>
                        {dist.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. DESA / KELURAHAN */}
                <div className="col-md-6">
                  <label className="form-label">Desa / Kelurahan</label>
                  <select
                    className="form-select"
                    name="village_id"
                    value={formData.village_id}
                    onChange={handleChange} // Tidak perlu reset anak lagi
                    disabled={!formData.district_id || loadVill}
                    required
                  >
                    <option value="">-- Pilih Desa --</option>
                    {villages?.map((vill) => (
                      <option key={vill.id} value={vill.id}>
                        {vill.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* --- DETAIL ALAMAT --- */}
                <div className="col-12">
                  <label className="form-label fw-bold">
                    Alamat Lengkap (Jalan, RT/RW, No. Rumah)
                  </label>
                  <textarea
                    name="detail"
                    className="form-control"
                    rows="3"
                    value={formData.detail}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                {/* --- IS PRIMARY --- */}
                <div className="col-12">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isPrimaryCheck"
                      checked={formData.is_primary}
                      onChange={handleCheck}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="isPrimaryCheck"
                    >
                      Jadikan Alamat Utama
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSaving}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Alamat"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalAddress;
