import { useState, useEffect } from "react";

const ProductInfo = ({ product, selectedVariant, setSelectedVariant }) => {
  const [activeColor, setActiveColor] = useState(null);
  const [activeSize, setActiveSize] = useState(null);

  // 1. Ambil list Warna Unik dari variants
  // product.variants mungkin undefined jika produk tidak punya varian
  const variants = product.variants || [];

  // Menggunakan Set untuk mengambil warna unik
  const uniqueColors = [...new Set(variants.map((v) => v.color))];

  // 2. Filter ukuran yang tersedia berdasarkan warna yang dipilih
  const availableSizes = activeColor
    ? variants.filter((v) => v.color === activeColor)
    : [];

  // 3. Effect: Jika user sudah pilih Warna & Size, cari object variant lengkapnya
  useEffect(() => {
    if (activeColor && activeSize) {
      const foundVariant = variants.find(
        (v) => v.color === activeColor && v.size === activeSize
      );
      setSelectedVariant(foundVariant || null);
    } else {
      setSelectedVariant(null);
    }
  }, [activeColor, activeSize, variants, setSelectedVariant]);

  // Helper Format Rupiah
  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Logic Tampilan Harga:
  // Jika varian dipilih -> Harga Dasar + Adjustment
  // Jika belum -> Rentang Harga (opsional) atau Harga Dasar
  const currentPrice = selectedVariant
    ? parseFloat(product.price) + parseFloat(selectedVariant.price_adjustment)
    : parseFloat(product.price);

  return (
    <>
      <h4 className='fw-bold mb-2'>{product.name}</h4>

      <div className='d-flex align-items-center mb-3'>
        <span className='text-muted small me-2'>
          Terjual {product.sold_count || 0}
        </span>
        <span className='text-muted small'>•</span>
        <i className='bi bi-star-fill text-warning ms-2 me-1'></i>
        <span className='fw-bold'>{product.rating || "0.0"}</span>
        <span className='text-muted small ms-1'>
          ({product.reviews?.length || 0} rating)
        </span>
      </div>

      <h2 className='fw-bold mb-4'>{formatRupiah(currentPrice)}</h2>

      <hr />

      {/* LOGIC VARIANT WARNA */}
      {uniqueColors.length > 0 && (
        <div className='mb-4'>
          <p className='fw-bold mb-2'>
            Pilih Warna:{" "}
            <span className='text-muted fw-normal'>{activeColor || "-"}</span>
          </p>
          <div className='d-flex flex-wrap gap-2'>
            {uniqueColors.map((color, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveColor(color);
                  setActiveSize(null); // Reset size saat ganti warna
                }}
                className={`btn btn-sm ${
                  activeColor === color
                    ? "btn-outline-primary active"
                    : "btn-outline-secondary"
                }`}
                style={{ minWidth: "80px" }}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LOGIC VARIANT UKURAN (Muncul setelah pilih warna) */}
      {activeColor && availableSizes.length > 0 && (
        <div className='mb-4'>
          <p className='fw-bold mb-2'>
            Pilih Ukuran:{" "}
            <span className='text-muted fw-normal'>{activeSize || "-"}</span>
          </p>
          <div className='d-flex flex-wrap gap-2'>
            {availableSizes.map((v, i) => (
              <button
                key={i}
                onClick={() => setActiveSize(v.size)}
                className={`btn btn-sm ${
                  activeSize === v.size
                    ? "btn-outline-primary active"
                    : "btn-outline-secondary"
                }`}
                style={{ minWidth: "60px" }}
                disabled={v.stock <= 0} // Disable jika stok varian kosong
              >
                {v.size}
              </button>
            ))}
          </div>
        </div>
      )}

      {variants.length === 0 && (
        <p className='text-muted fst-italic'>
          Tidak ada varian untuk produk ini.
        </p>
      )}

      <hr />

      <div className='mb-3'>
        <h5 className='fw-bold'>Deskripsi Produk</h5>
        <p className='text-muted' style={{ whiteSpace: "pre-line" }}>
          {product.description}
        </p>
      </div>
    </>
  );
};

export default ProductInfo;
