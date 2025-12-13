import React, { useState } from "react";
import { useSelector } from "react-redux";
import Header from "../../../components/header/Header";
import ModalAddress from "./ModalAddress";
import EditProfile from "./EditProfile";
import Footer from "../../../components/footer/Footer";
import MobileNav from "../../../components/layout/MobileNav";

const Profile = () => {
  const { user, isLoading } = useSelector((state) => state.auth);

  // State Control Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // State Data Edit
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Handlers
  const handleEditAddress = (address) => {
    setSelectedAddress(address);
    setShowAddressModal(true);
  };

  const handleAddAddress = () => {
    setSelectedAddress(null); // Null berarti tambah baru
    setShowAddressModal(true);
  };

  // Handle Loading & Error
  // if (isLoading)
  //   return (
  //     <div className='d-flex justify-content-center mt-5'>
  //       <div className='spinner-border text-primary' role='status'>
  //         <span className='visually-hidden'>Loading...</span>
  //       </div>
  //     </div>
  //   );

  if (!user)
    return (
      <div className='alert alert-danger mt-5 container'>
        Gagal memuat data profile.
      </div>
    );

  return (
    <div className='d-flex flex-column min-vh-100 bg-light'>
      <title>{`Profil - ${user.name}`}</title>
      <Header />
      <div className='container py-3'>
        <div className='row g-4'>
          {/* KOLOM KIRI: INFO USER UTAMA */}
          <div className='col-md-4'>
            <div className='card shadow-sm border-0 h-100'>
              <div className='card-body align-items-center d-flex flex-column justify-content-center'>
                <div
                  className='bg-primary text-white rounded-circle d-flex align-items-center justify-content-center'
                  style={{ width: "32px", height: "32px" }}
                >
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <h5 className='card-title fw-bold'>{user?.name}</h5>
                <p className='text-muted small mb-1'>{user?.email}</p>
                <span className='badge bg-primary text-uppercase'>
                  {user?.role}
                </span>

                <hr className='my-4' />

                <button
                  className='btn btn-outline-secondary'
                  onClick={() => setShowProfileModal(true)}
                >
                  <i className='bi bi-pencil-square me-2'></i>Edit Profil
                </button>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: DAFTAR ALAMAT */}
          <div className='col-md-8'>
            <div className='card shadow-sm border-0'>
              <div className='card-header bg-white py-3 d-flex justify-content-between align-items-center'>
                <h6 className='m-0 fw-bold text-primary'>
                  <i className='bi bi-geo-alt-fill me-2'></i>Daftar Alamat
                </h6>
                <button
                  className='btn btn-sm btn-primary'
                  onClick={() => handleAddAddress()}
                >
                  <i className='bi bi-plus-lg me-1'></i>Tambah Alamat
                </button>
              </div>
              <div className='card-body'>
                {/* Jika alamat kosong */}
                {(!user.addresses || user.addresses.length === 0) && (
                  <div className='text-center py-4 text-muted'>
                    <p>Belum ada alamat tersimpan.</p>
                  </div>
                )}

                {/* Loop Alamat */}
                <div className='row g-3'>
                  {user.addresses?.map((addr, index) => (
                    <div key={index} className='col-12'>
                      <div
                        className={`card ${
                          addr.is_primary ? "border-primary bg-light" : ""
                        }`}
                      >
                        <div className='card-body position-relative'>
                          {/* Badge Utama */}
                          {addr.is_primary && (
                            <span className='badge bg-primary position-absolute top-0 end-0 m-2'>
                              Utama
                            </span>
                          )}

                          <h6 className='fw-bold mb-1'>
                            {addr.title}{" "}
                            <span className='text-muted fw-normal'>
                              ({addr.recipient_name})
                            </span>
                          </h6>
                          <p className='mb-1 small text-muted'>{addr.phone}</p>
                          <p className='card-text small mb-2'>
                            {addr.detail}, {addr.village_name || "Desa..."},{" "}
                            {addr.district_name || "Kec..."}, <br />
                            {addr.regency_name || "Kota..."},{" "}
                            {addr.province_name || "Prov..."} -{" "}
                            {addr.postal_code}
                          </p>

                          <div className='mt-3'>
                            <button
                              className='btn btn-sm btn-outline-primary me-2'
                              onClick={() => handleEditAddress(addr)}
                            >
                              Ubah
                            </button>
                            {!addr.is_primary && (
                              <button className='btn btn-sm btn-outline-danger'>
                                Hapus
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      <Footer />
      <MobileNav />
    </div>
  );
};

export default Profile;
