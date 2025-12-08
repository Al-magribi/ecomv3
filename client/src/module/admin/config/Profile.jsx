import React, { useState } from "react";
import { useSelector } from "react-redux";
import ModalAddress from "./ModalAddress";
import EditProfile from "./EditProfile";

const ConfigProfile = () => {
  const { user } = useSelector((state) => state.auth);

  // State Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Handlers
  const handleEditAddress = (address) => {
    setSelectedAddress(address);
    setShowAddressModal(true);
  };

  const handleAddAddress = () => {
    setSelectedAddress(null);
    setShowAddressModal(true);
  };

  if (!user) return <div className='p-4'>Memuat data profil...</div>;

  return (
    <div className='row g-4'>
      {/* KOLOM KIRI: INFO USER */}
      <div className='col-12 col-xl-4'>
        <div className='card shadow-sm border-0 h-100'>
          <div className='card-body d-flex flex-column align-items-center text-center p-4'>
            <div
              className='bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mb-3 fw-bold fs-4'
              style={{ width: "64px", height: "64px" }}
            >
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <h5 className='card-title fw-bold mb-1'>{user.name}</h5>
            <p className='text-muted small mb-2'>{user.email}</p>
            <span className='badge bg-primary text-uppercase mb-4'>
              {user.role}
            </span>

            <button
              className='btn btn-outline-primary w-100 mt-auto'
              onClick={() => setShowProfileModal(true)}
            >
              <i className='bi bi-pencil-square me-2'></i>Edit Profil
            </button>
          </div>
        </div>
      </div>

      {/* KOLOM KANAN: DAFTAR ALAMAT */}
      <div className='col-12 col-xl-8'>
        <div className='card shadow-sm border-0 h-100'>
          <div className='card-header bg-white py-3 d-flex justify-content-between align-items-center'>
            <h6 className='m-0 fw-bold'>Daftar Alamat</h6>
            <button
              className='btn btn-sm btn-primary'
              onClick={handleAddAddress}
            >
              <i className='bi bi-plus-lg me-1'></i>Tambah
            </button>
          </div>
          <div className='card-body p-3'>
            {/* Empty State */}
            {(!user.addresses || user.addresses.length === 0) && (
              <div className='text-center py-4 text-muted'>
                <i className='bi bi-geo-alt display-6 d-block mb-2 opacity-50'></i>
                <small>Belum ada alamat tersimpan.</small>
              </div>
            )}

            {/* List Alamat */}
            <div className='row g-3'>
              {user.addresses?.map((addr, index) => (
                <div key={index} className='col-12'>
                  <div
                    className={`card p-3 ${
                      addr.is_primary
                        ? "border-primary bg-primary bg-opacity-10"
                        : "border-light bg-light"
                    }`}
                  >
                    <div className='d-flex justify-content-between align-items-start'>
                      <div>
                        {addr.is_primary && (
                          <span className='badge bg-primary mb-2'>Utama</span>
                        )}
                        <h6 className='fw-bold mb-1'>
                          {addr.title}{" "}
                          <span className='text-muted fw-normal small'>
                            ({addr.recipient_name})
                          </span>
                        </h6>
                        <p className='mb-1 small text-muted'>
                          <i className='bi bi-telephone me-1'></i> {addr.phone}
                        </p>
                        <p className='mb-0 small text-secondary'>
                          {addr.detail}, {addr.district_name},{" "}
                          {addr.regency_name}, {addr.province_name},{" "}
                          {addr.postal_code}
                        </p>
                      </div>
                      <div className='d-flex flex-column gap-2'>
                        <button
                          className='btn btn-sm btn-light border'
                          onClick={() => handleEditAddress(addr)}
                          title='Edit'
                        >
                          <i className='bi bi-pencil'></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <EditProfile
        show={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
      />

      <ModalAddress
        show={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        initialData={selectedAddress}
        userDefaultName={user.name}
      />
    </div>
  );
};

export default ConfigProfile;
