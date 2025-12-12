import React, { useState } from "react";
import { useReplyReviewMutation } from "../../../service/order/ApiReview";
import { toast } from "react-toastify";

const Reviews = ({ product }) => {
  const [replyingTo, setReplyingTo] = useState(null); // ID review yang sedang dibalas/diedit
  const [replyText, setReplyText] = useState("");

  // Hook mutasi (Endpoint ini melakukan UPDATE, jadi bisa untuk create & edit)
  const [replyReview, { isLoading: isReplying }] = useReplyReviewMutation();

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fungsi: Mulai Edit (Pre-fill text)
  const handleStartEdit = (review) => {
    setReplyingTo(review.id);
    setReplyText(review.reply); // Isi textarea dengan balasan lama
  };

  // Fungsi: Batal Edit/Balas
  const handleCancel = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  const handleSubmitReply = async (reviewId) => {
    if (!replyText.trim()) return;

    try {
      await replyReview({ reviewId, reply: replyText }).unwrap();

      // Reset state setelah sukses
      handleCancel();

      toast.success("Balasan berhasil disimpan!");
    } catch (error) {
      console.error("Gagal membalas:", error);
      toast.error(error?.data?.message || "Gagal menyimpan balasan");
    }
  };

  return (
    <div className='card border-0 shadow-sm'>
      <title>{`Detail Produk ${product.name}`}</title>
      <div className='card-header bg-white d-flex justify-content-between align-items-center'>
        <span className='fw-bold'>Ulasan Pembeli</span>
        <span className='badge bg-secondary'>
          {product.reviews?.length || 0} Ulasan
        </span>
      </div>
      <div className='card-body'>
        {product.reviews && product.reviews.length > 0 ? (
          <div className='list-group list-group-flush'>
            {product.reviews.map((rev) => {
              // Cek apakah review ini sedang dalam mode edit/balas
              const isEditing = replyingTo === rev.id;

              return (
                <div key={rev.id} className='list-group-item px-0 py-3'>
                  {/* --- HEADER REVIEW --- */}
                  <div className='d-flex w-100 justify-content-between mb-1'>
                    <div className='d-flex align-items-center'>
                      <img
                        src={
                          rev.avatar ||
                          "https://ui-avatars.com/api/?name=" + rev.user_name
                        }
                        alt='av'
                        className='rounded-circle me-2'
                        width='30'
                        height='30'
                      />
                      <div>
                        <h6 className='mb-0 me-2'>{rev.user_name}</h6>
                        <div className='mb-1'>
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`bi bi-star${
                                i < rev.rating ? "-fill" : ""
                              } text-warning small me-1`}
                            ></i>
                          ))}
                        </div>
                      </div>
                    </div>
                    <small className='text-muted'>
                      {formatDate(rev.created_at)}
                    </small>
                  </div>

                  {/* --- ISI KOMENTAR PEMBELI --- */}
                  <p className='mb-2 text-dark mt-2'>{rev.comment}</p>

                  {/* ==================================================== */}
                  {/* LOGIKA TAMPILAN BALASAN & FORM EDIT                  */}
                  {/* ==================================================== */}

                  {/* 1. TAMPILKAN BALASAN EXISTING (Jika ada & SEDANG TIDAK DIEDIT) */}
                  {rev.reply && !isEditing && (
                    <div className='bg-light p-3 rounded ms-4 mt-2 border-start border-primary border-4 position-relative group-hover-container'>
                      <div className='d-flex justify-content-between align-items-center mb-1'>
                        <span className='fw-bold text-primary small'>
                          <i className='bi bi-shop me-1'></i> Respon Penjual
                        </span>
                        <div className='d-flex align-items-center gap-2'>
                          <small
                            className='text-muted'
                            style={{ fontSize: "0.75rem" }}
                          >
                            {formatDate(rev.reply_at)}
                          </small>
                          {/* Tombol Edit (Icon Pencil) */}
                          <button
                            className='btn btn-sm btn-link text-secondary p-0'
                            onClick={() => handleStartEdit(rev)}
                            title='Edit Balasan'
                          >
                            <i className='bi bi-pencil-square'></i>
                          </button>
                        </div>
                      </div>
                      <p className='mb-0 small text-secondary'>{rev.reply}</p>
                    </div>
                  )}

                  {/* 2. FORM BALASAN / EDIT (Muncul jika sedang mode edit) */}
                  {isEditing && (
                    <div className='fade-in mt-3 ms-4'>
                      <label className='small text-muted mb-1'>
                        {rev.reply ? "Edit Balasan Anda:" : "Tulis Balasan:"}
                      </label>
                      <textarea
                        className='form-control mb-2 form-control-sm'
                        rows='3'
                        placeholder='Tulis balasan anda...'
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        autoFocus
                      ></textarea>
                      <div className='d-flex gap-2'>
                        <button
                          className='btn btn-primary btn-sm'
                          disabled={isReplying}
                          onClick={() => handleSubmitReply(rev.id)}
                        >
                          {isReplying ? (
                            <>
                              <span className='spinner-border spinner-border-sm me-1'></span>{" "}
                              Menyimpan...
                            </>
                          ) : rev.reply ? (
                            "Simpan Perubahan"
                          ) : (
                            "Kirim Balasan"
                          )}
                        </button>
                        <button
                          className='btn btn-outline-secondary btn-sm'
                          onClick={handleCancel}
                          disabled={isReplying}
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. TOMBOL 'BALAS ULASAN' (Muncul jika belum ada balasan & tidak sedang mode edit) */}
                  {!rev.reply && !isEditing && (
                    <div className='mt-2 ms-4'>
                      <button
                        className='btn btn-link btn-sm text-decoration-none p-0'
                        onClick={() => {
                          setReplyingTo(rev.id);
                          setReplyText(""); // Kosongkan jika balas baru
                        }}
                      >
                        <i className='bi bi-reply-fill me-1'></i> Balas Ulasan
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className='text-center py-4 text-muted'>
            <i className='bi bi-chat-square-dots display-6 d-block mb-2 opacity-50'></i>
            Belum ada ulasan untuk produk ini.
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
