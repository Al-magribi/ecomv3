import React from "react";
import { useNavigate } from "react-router-dom";

const AddressSection = ({ activeAddress }) => {
  const navigate = useNavigate();

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3">
        <h5 className="mb-0 fw-bold">
          <i className="bi bi-geo-alt me-2"></i>Alamat Pengiriman
        </h5>
      </div>
      <div className="card-body">
        {activeAddress ? (
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h6 className="fw-bold">
                {activeAddress.recipient_name}{" "}
                <span className="badge bg-secondary ms-2">
                  {activeAddress.title}
                </span>
              </h6>
              <p className="mb-1">{activeAddress.phone}</p>
              <p className="text-muted mb-0 small">
                {activeAddress.detail}, {activeAddress.village_name},{" "}
                {activeAddress.district_name}, <br />
                {activeAddress.regency_name}, {activeAddress.province_name},{" "}
                {activeAddress.postal_code}
              </p>
            </div>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => navigate("/profile", { replace: true })}
            >
              Ganti Alamat
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted">
              Anda belum memiliki alamat pengiriman utama.
            </p>
            <button className="btn btn-primary btn-sm">
              <i className="bi bi-plus-lg"></i> Tambah Alamat Baru
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressSection;
