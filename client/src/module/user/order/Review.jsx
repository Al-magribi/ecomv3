import React, { useState, useEffect } from "react";
import { useSaveReviewMutation } from "../../../service/order/ApiReview";
import { toast } from "react-toastify";

const Review = ({ show, handleClose, product }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // State baru untuk mengontrol mode Edit
  const [isEditing, setIsEditing] = useState(false);

  // Deteksi apakah produk ini sudah memiliki review
  const existingReview = product?.review;
  const isReviewed = !!existingReview;

  const [saveReview, { isLoading }] = useSaveReviewMutation();

  // Reset / Set Initial State
  useEffect(() => {
    if (show) {
      if (isReviewed) {
        // Jika sudah ada review, isi data dan matikan mode edit
        setRating(existingReview.rating);
        setComment(existingReview.comment);
        setIsEditing(false);
      } else {
        // Jika belum, reset form dan nyalakan mode edit (input)
        setRating(5);
        setComment("");
        setIsEditing(true);
      }
    }
  }, [show, product, isReviewed, existingReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;

    try {
      await saveReview({
        product_id: product.product_id,
        rating: parseInt(rating),
        comment,
      }).unwrap();

      toast.success(
        isReviewed ? "Ulasan berhasil diperbarui!" : "Ulasan berhasil dikirim!"
      );
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || "Gagal menyimpan ulasan.");
    }
  };

  const renderStars = (currentRating, interactive = true) => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1;
      return (
        <i
          key={index}
          className={`bi ${
            starValue <= currentRating
              ? "bi-star-fill text-warning"
              : "bi-star text-secondary"
          } fs-2 mx-1`}
          style={
            interactive
              ? { cursor: "pointer", transition: "transform 0.2s" }
              : {}
          }
          onClick={interactive ? () => setRating(starValue) : undefined}
          onMouseEnter={
            interactive
              ? (e) => (e.target.style.transform = "scale(1.2)")
              : undefined
          }
          onMouseLeave={
            interactive
              ? (e) => (e.target.style.transform = "scale(1)")
              : undefined
          }
        ></i>
      );
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!show) return null;

  // Logika tampilan: Tampilkan Form jika belum direview ATAU sedang mode edit
  const showForm = !isReviewed || isEditing;

  return (
    <>
      <div
        className='modal-backdrop fade show'
        style={{ zIndex: 1050 }}
        onClick={handleClose}
      ></div>
      <div
        className='modal fade show d-block'
        tabIndex='-1'
        role='dialog'
        style={{ zIndex: 1055 }}
      >
        <div className='modal-dialog modal-dialog-centered' role='document'>
          <div className='modal-content shadow-lg border-0'>
            {/* Header */}
            <div className='modal-header border-0 pb-0'>
              <h5 className='modal-title fw-bold'>
                {/* Judul dinamis */}
                {!isReviewed
                  ? "Tulis Ulasan"
                  : isEditing
                  ? "Edit Ulasan"
                  : "Ulasan Anda"}
              </h5>
              <button
                type='button'
                className='btn-close'
                onClick={handleClose}
                aria-label='Close'
              ></button>
            </div>

            {/* KONTEN BODY */}
            {/* Logic: Jika showForm false, berarti kita sedang melihat "Read Only" view */}
            {!showForm ? (
              <div className='modal-body'>
                {/* Info Produk */}
                <ProductInfo product={product} />

                {/* Read Only Content */}
                <div className='text-center mb-4'>
                  <div className='mb-2'>
                    {renderStars(existingReview.rating, false)}
                  </div>
                  <span className='fw-bold text-primary'>
                    {existingReview.rating === 5
                      ? "Sangat Puas"
                      : existingReview.rating >= 4
                      ? "Puas"
                      : "Cukup"}
                  </span>
                  <div className='text-muted small mt-1'>
                    Diulas pada {formatDate(existingReview.created_at)}
                  </div>
                </div>

                <div className='alert alert-light border'>
                  <h6 className='fw-bold small text-muted mb-2'>
                    Komentar Anda:
                  </h6>
                  <p className='mb-0 text-dark'>{existingReview.comment}</p>
                </div>
              </div>
            ) : (
              // FORM INPUT (Untuk Review Baru atau Edit)
              <form onSubmit={handleSubmit}>
                <div className='modal-body'>
                  <ProductInfo product={product} />

                  {/* Input Rating */}
                  <div className='text-center mb-4'>
                    <label className='form-label fw-semibold text-secondary'>
                      Beri rating produk ini
                    </label>
                    <div className='mb-2'>{renderStars(rating, true)}</div>
                    <span className='fw-bold text-primary'>
                      {rating === 5
                        ? "Sangat Puas"
                        : rating === 4
                        ? "Puas"
                        : rating === 3
                        ? "Biasa Saja"
                        : rating === 2
                        ? "Kurang Puas"
                        : "Kecewa"}
                    </span>
                  </div>

                  {/* Input Komentar */}
                  <div className='mb-3'>
                    <label htmlFor='comment' className='form-label fw-semibold'>
                      Komentar
                    </label>
                    <textarea
                      id='comment'
                      className='form-control'
                      rows='4'
                      placeholder='Ceritakan pengalamanmu...'
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                      style={{ resize: "none" }}
                    ></textarea>
                  </div>
                </div>

                <div className='modal-footer border-0 pt-0'>
                  {/* Tombol Batal berbeda fungsinya tergantung konteks */}
                  <button
                    type='button'
                    className='btn btn-light px-4'
                    onClick={() => {
                      if (isReviewed) {
                        // Jika sedang edit review lama, batal kembali ke mode read-only
                        setIsEditing(false);
                        setRating(existingReview.rating); // Reset nilai ke awal
                        setComment(existingReview.comment);
                      } else {
                        // Jika review baru, tutup modal
                        handleClose();
                      }
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type='submit'
                    className='btn btn-primary px-4 fw-semibold'
                    disabled={isLoading}
                  >
                    {isLoading ? "Menyimpan..." : "Simpan Ulasan"}
                  </button>
                </div>
              </form>
            )}

            {/* Footer khusus untuk Read-Only Mode (Menampilkan Tombol Edit) */}
            {!showForm && (
              <div className='modal-footer border-0 pt-0 d-flex gap-2'>
                <button
                  type='button'
                  className='btn btn-outline-primary flex-grow-1'
                  onClick={() => setIsEditing(true)}
                >
                  <i className='bi bi-pencil-square me-2'></i>
                  Ubah Ulasan
                </button>
                <button
                  type='button'
                  className='btn btn-secondary'
                  onClick={handleClose}
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Komponen kecil untuk menghindari duplikasi kode tampilan produk
const ProductInfo = ({ product }) => (
  <div className='d-flex align-items-center bg-light p-3 rounded mb-4'>
    <img
      src={product?.image || "https://via.placeholder.com/100"}
      alt={product?.product_name}
      className='rounded border bg-white'
      style={{
        width: "60px",
        height: "60px",
        objectFit: "cover",
      }}
    />
    <div className='ms-3'>
      <h6 className='fw-bold mb-0 text-truncate' style={{ maxWidth: "250px" }}>
        {product?.product_name}
      </h6>
      <small className='text-muted'>
        {product?.variant || "Produk Satuan"}
      </small>
    </div>
  </div>
);

export default Review;
