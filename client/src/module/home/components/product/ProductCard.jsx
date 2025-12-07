const ProductCard = ({ product, onClick }) => {
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const displayRating = (rate) => {
    const parsedRate = parseFloat(rate);
    return isNaN(parsedRate) ? "0.0" : parsedRate.toFixed(1);
  };

  return (
    <div
      className='card h-100 shadow-sm border-0 product-card-hover'
      onClick={onClick}
    >
      <div
        style={{ height: "200px", overflow: "hidden" }}
        className='position-relative'
      >
        <img
          src={product.image || "https://via.placeholder.com/300?text=No+Image"}
          className='card-img-top w-100 h-100'
          style={{ objectFit: "cover" }} // Ini memastikan gambar tidak gepeng
          alt={product.name}
        />
        <span className='position-absolute top-0 end-0 badge bg-primary m-2'>
          {product.category_name || "Umum"}
        </span>
      </div>
      <div className='card-body d-flex flex-column'>
        <h6 className='card-title text-truncate' title={product.name}>
          {product.name}
        </h6>
        <p className='card-text fw-bold text-primary mb-1'>
          {formatRupiah(product.price)}
        </p>

        {/* --- TAMBAHAN BAGIAN RATING DI SINI --- */}
        <div className='d-flex align-items-center mb-3'>
          <i className='bi bi-star-fill text-warning me-1'></i>
          <small className='text-muted'>
            {displayRating(product.rating)} / 5.0
          </small>
        </div>
        {/* -------------------------------------- */}

        <div className='mt-auto d-flex justify-content-between align-items-center'>
          <small className='text-muted'>Stok: {product.stock}</small>
          <button className='btn btn-sm btn-outline-primary'>
            <i className='bi bi-cart-plus'></i> Beli
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
