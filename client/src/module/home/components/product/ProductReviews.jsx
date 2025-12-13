import React from "react";

const ProductReviews = ({
  reviews,
  rating,
  ratingSummary, // Data baru: {5: 10, 4: 2, ...}
  totalReviews, // Data baru: total count
  onFilterChange,
  activeFilter,
  onLoadMore,
  hasMore,
  isLoadingReviews,
}) => {
  // Helper Format Tanggal
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Helper Hitung Lebar Bar (Sekarang menggunakan data summary dari backend)
  const calculateRatingWidth = (star) => {
    if (!totalReviews || totalReviews === 0) return "0%";
    const count = ratingSummary?.[star] || 0;
    return `${(count / totalReviews) * 100}%`;
  };

  // Helper Hitung Jumlah (Dari summary backend)
  const countRating = (star) => {
    return ratingSummary?.[star] || 0;
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
              {rating ? Number(rating).toFixed(1) : "0.0"}
              <span className='fs-6 text-muted'>/5.0</span>
            </div>
            <p className='fw-bold mb-1'>Kepuasan Pembeli</p>
            <small className='text-muted'>
              {totalReviews || 0} rating • {totalReviews || 0} ulasan
            </small>
          </div>

          {/* Progress Bars */}
          <div className='flex-grow-1 w-100'>
            {[5, 4, 3, 2, 1].map((star) => (
              <div
                key={star}
                className='d-flex align-items-center gap-2 mb-1'
                style={{ cursor: "pointer" }}
                onClick={() => onFilterChange(star)} // Klik bar untuk filter
                title={`Lihat ulasan bintang ${star}`}
              >
                <i className='bi bi-star-fill text-warning'></i>
                <span
                  className='small fw-bold text-muted'
                  style={{ width: "10px" }}
                >
                  {star}
                </span>
                <div className='progress flex-grow-1' style={{ height: "6px" }}>
                  <div
                    className={`progress-bar ${
                      activeFilter === star ? "bg-primary" : "bg-success"
                    }`}
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
              <li
                className={`py-2 border-bottom cursor-pointer ${
                  activeFilter === null ? "fw-bold text-success" : ""
                }`}
                onClick={() => onFilterChange(null)}
                style={{ cursor: "pointer" }}
              >
                Semua Bintang
              </li>
              {[5, 4, 3, 2, 1].map((star) => (
                <li
                  key={star}
                  className={`py-2 border-bottom cursor-pointer ${
                    activeFilter === star ? "fw-bold text-success" : ""
                  }`}
                  onClick={() => onFilterChange(star)}
                  style={{ cursor: "pointer" }}
                >
                  Bintang {star}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className='col-12 col-md-9'>
        <div className='d-flex justify-content-between align-items-center mb-3'>
          <h6 className='fw-bold mb-0'>
            {activeFilter ? `ULASAN BINTANG ${activeFilter}` : "SEMUA ULASAN"}
          </h6>
        </div>

        {reviews && reviews.length > 0 ? (
          <>
            {reviews.map((review, index) => (
              // Gunakan index sebagai key fallback jika id duplikat saat dev,
              // tapi id harusnya unique
              <div
                key={`${review.id}-${index}`}
                className='border-bottom pb-3 mb-3 animate__animated animate__fadeIn'
              >
                {/* Header Reviewer */}
                <div className='d-flex align-items-center gap-2 mb-2'>
                  <div
                    className='rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-bold'
                    style={{
                      width: "32px",
                      height: "32px",
                      fontSize: "12px",
                      overflow: "hidden",
                    }}
                  >
                    {review.avatar ? (
                      <img
                        src={review.avatar}
                        alt='user'
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : review.user_name ? (
                      review.user_name.charAt(0).toUpperCase()
                    ) : (
                      "U"
                    )}
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
                        i < Math.floor(review.rating)
                          ? "text-warning"
                          : "text-muted"
                      }`}
                    ></i>
                  ))}
                </div>

                {/* Komentar User */}
                <p className='mb-2 text-dark'>{review.comment}</p>

                {/* Balasan Admin */}
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
            ))}

            {/* Tombol Load More */}
            {hasMore && (
              <div className='text-center mt-4'>
                <button
                  className='btn btn-outline-success rounded-pill px-4'
                  onClick={onLoadMore}
                  disabled={isLoadingReviews}
                >
                  {isLoadingReviews ? (
                    <>
                      <span
                        className='spinner-border spinner-border-sm me-2'
                        role='status'
                        aria-hidden='true'
                      ></span>
                      Memuat...
                    </>
                  ) : (
                    "Tampilkan Lebih Banyak"
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className='alert alert-info'>
            {activeFilter
              ? `Belum ada ulasan untuk bintang ${activeFilter}.`
              : "Belum ada ulasan."}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
