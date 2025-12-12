import React from "react";

const ProductReviews = ({ reviews, rating }) => {
  // Helper Logic
  const calculateRatingWidth = (star) => {
    if (!reviews?.length) return "0%";
    const total = reviews.length;
    const count = reviews.filter((r) => Math.floor(r.rating) === star).length;
    return `${(count / total) * 100}%`;
  };

  const countRating = (star) => {
    if (!reviews) return 0;
    return reviews.filter((r) => Math.floor(r.rating) === star).length;
  };

  // Helper Format Tanggal
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className='row mt-5'>
      <h5 className='fw-bold mb-4'>ULASAN PEMBELI</h5>

      {/* A. Rating Summary (Kiri Atas) */}
      <div className='col-12 col-md-12 mb-4'>
        <div className='d-flex flex-wrap flex-md-nowrap align-items-start gap-5 border p-4 rounded bg-light'>
          {/* Total Score */}
          <div className='text-center' style={{ minWidth: "150px" }}>
            <div className='display-4 fw-bold text-dark'>
              <i className='bi bi-star-fill text-warning fs-3 me-2'></i>
              {rating || "0.0"}
              <span className='fs-6 text-muted'>/5.0</span>
            </div>
            <p className='fw-bold mb-1'>98% pembeli merasa puas</p>
            <small className='text-muted'>
              {reviews?.length} rating • {reviews?.length} ulasan
            </small>
          </div>

          {/* Progress Bars */}
          <div className='flex-grow-1 w-100'>
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className='d-flex align-items-center gap-2 mb-1'>
                <i className='bi bi-star-fill text-warning'></i>
                <span
                  className='small fw-bold text-muted'
                  style={{ width: "10px" }}
                >
                  {star}
                </span>
                <div className='progress flex-grow-1' style={{ height: "6px" }}>
                  <div
                    className='progress-bar bg-success'
                    role='progressbar'
                    style={{ width: calculateRatingWidth(star) }}
                  ></div>
                </div>
                <span
                  className='small text-muted'
                  style={{ width: "30px", textAlign: "right" }}
                >
                  {countRating(star)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* B. Filter & List (Bawah) */}
      <div className='col-12 col-md-3 mb-4'>
        {/* Visual Filter Card */}
        <div className='card shadow-sm'>
          <div className='card-body'>
            <h6 className='fw-bold mb-3'>FILTER ULASAN</h6>
            <ul className='list-unstyled mb-0'>
              <li className='py-2 border-bottom fw-bold text-success'>Media</li>
              <li className='py-2 border-bottom'>Rating</li>
              <li className='py-2'>Topik Ulasan</li>
            </ul>
          </div>
        </div>
      </div>

      <div className='col-12 col-md-9'>
        <h6 className='fw-bold mb-3'>ULASAN PILIHAN</h6>

        {reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className='border-bottom pb-3 mb-3'>
              {/* Header Reviewer */}
              <div className='d-flex align-items-center gap-2 mb-2'>
                <div
                  className='rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-bold'
                  style={{ width: "32px", height: "32px", fontSize: "12px" }}
                >
                  {review.user_name
                    ? review.user_name.charAt(0).toUpperCase()
                    : "U"}
                </div>
                <div>
                  <div className='fw-bold small'>
                    {review.user_name || "Pengguna"}
                  </div>
                  <small className='text-muted' style={{ fontSize: "10px" }}>
                    {formatDate(review.created_at)}
                  </small>
                </div>
              </div>

              {/* Bintang */}
              <div className='mb-2'>
                {[...Array(5)].map((_, i) => (
                  <i
                    key={i}
                    className={`bi bi-star-fill small ${
                      i < review.rating ? "text-warning" : "text-muted"
                    }`}
                  ></i>
                ))}
              </div>

              {/* Komentar User */}
              <p className='mb-2 text-dark'>{review.comment}</p>

              {/* --- PERBAIKAN: MENAMPILKAN BALASAN ADMIN --- */}
              {review.reply && (
                <div className='bg-light p-3 rounded mt-2 ms-4 border-start border-success border-3'>
                  <div className='d-flex justify-content-between align-items-center mb-1'>
                    <span className='fw-bold text-success small'>
                      <i className='bi bi-shop me-1'></i> Respon Penjual
                    </span>
                    <small
                      className='text-muted'
                      style={{ fontSize: "0.75rem" }}
                    >
                      {formatDate(review.reply_at)}
                    </small>
                  </div>
                  <p className='mb-0 small text-secondary'>{review.reply}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className='alert alert-info'>Belum ada ulasan.</div>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
