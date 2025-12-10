import React, { useEffect } from "react";

const ErrorModal = ({ show, message, onRedirect }) => {
  // --- EFEK: Kunci Scroll Body ---
  useEffect(() => {
    if (show) {
      // Saat modal muncul, sembunyikan scrollbar body
      document.body.style.overflow = "hidden";
    } else {
      // Saat modal hilang, kembalikan scrollbar
      document.body.style.overflow = "auto";
    }

    // Cleanup: Pastikan scroll kembali normal jika komponen di-unmount paksa
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [show]);

  if (!show) return null;

  return (
    <>
      {/* Backdrop Gelap dengan z-index tinggi */}
      <div
        className="modal-backdrop show"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 1050,
        }}
      ></div>

      {/* Modal Container */}
      <div
        className="modal d-block"
        tabIndex="-1"
        role="dialog"
        style={{ zIndex: 1055 }}
      >
        <div
          className="modal-dialog modal-dialog-centered px-3"
          role="document"
        >
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title fw-bold">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                Konfigurasi Diperlukan
              </h5>
            </div>
            <div className="modal-body text-center py-4">
              <div className="mb-3 text-danger">
                <i className="bi bi-shop display-1"></i>
              </div>
              <p className="fs-5 mb-0 text-dark fw-semibold">
                {message || "Alamat toko belum diatur."}
              </p>
              <small className="text-muted d-block mt-2">
                Sistem membutuhkan alamat toko untuk menghitung ongkos kirim
                pelanggan.
              </small>
            </div>
            <div className="modal-footer justify-content-center bg-light">
              <button
                type="button"
                className="btn btn-primary btn-lg px-4"
                onClick={onRedirect}
              >
                <i className="bi bi-gear-fill me-2"></i>
                Atur Alamat Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ErrorModal;
