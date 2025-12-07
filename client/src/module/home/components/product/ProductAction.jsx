import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAddToCartMutation } from "../../../../service/cart/ApiCart";
import { toast } from "react-toastify";

const ProductAction = ({ product, qty, setQty, selectedVariant }) => {
  const navigate = useNavigate();

  const [addToCart, { data, isLoading, isSuccess, error, reset }] =
    useAddToCartMutation();

  // 1. Tentukan Harga & Stok yang dipakai
  // Jika ada varian dipilih, pakai data varian. Jika tidak, pakai data produk induk.
  const finalPrice = selectedVariant
    ? parseFloat(product.price) + parseFloat(selectedVariant.price_adjustment)
    : parseFloat(product.price);

  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  const variantName = selectedVariant
    ? `${selectedVariant.color}, ${selectedVariant.size}`
    : "-";

  // Reset qty ke 1 jika stok berubah atau varian berubah
  useEffect(() => {
    if (qty > currentStock) setQty(1);
  }, [currentStock]);

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const imageThumb =
    product.images?.[0]?.link || "https://via.placeholder.com/50";

  // Cek apakah tombol beli harus didisable
  // Disable jika stok 0 ATAU (Produk punya varian TAPI user belum pilih varian)
  const isButtonDisabled =
    currentStock <= 0 || (product.variants?.length > 0 && !selectedVariant);

  const handleBuyNow = () => {
    // Format item agar strukturnya mirip dengan data dari Cart API
    const itemToBuy = [
      {
        product_id: product.id,
        product_variant_id: selectedVariant ? selectedVariant.id : null,
        product_name: product.name,
        variant_name: selectedVariant
          ? `${selectedVariant.color} ${selectedVariant.size}`
          : null,
        image_url: product.images?.[0]?.link,
        final_price: selectedVariant
          ? parseFloat(product.price) +
            parseFloat(selectedVariant.price_adjustment)
          : parseFloat(product.price),
        quantity: qty,
        weight: product.weight, // Asumsi ada field weight
      },
    ];

    // Kirim data via state
    navigate("/checkout", { state: { items: itemToBuy, source: "direct" } });
  };

  const handleAddToCart = () => {
    const data = {
      product_id: product.id,
      product_variant_id: selectedVariant.id,
      quantity: qty,
    };
    addToCart(data);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data.message);
      reset();
    }

    if (error) {
      toast.error(error.data.message);
      reset();
    }
  }, [data, isSuccess, error]);

  return (
    <div
      className='card shadow-sm p-3 border rounded-3 position-sticky'
      style={{ top: "100px" }}
    >
      <h6 className='fw-bold mb-3'>Atur jumlah dan catatan</h6>

      <div className='d-flex align-items-center gap-2 mb-3'>
        <img
          src={imageThumb}
          width='40'
          height='40'
          className='rounded'
          alt='thumb'
        />
        <div className='d-flex flex-column'>
          <span
            className='small fw-bold text-truncate'
            style={{ maxWidth: "150px" }}
          >
            {product.name}
          </span>
          <span className='small text-muted'>{variantName}</span>
        </div>
      </div>

      <div className='d-flex align-items-center justify-content-between w-fit-content mb-2'>
        <div className='d-flex align-items-center gap-3 border rounded p-1'>
          <button
            className='btn btn-sm text-primary fw-bold'
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1 || isButtonDisabled}
          >
            <i className='bi bi-dash'></i>
          </button>
          <span>{qty}</span>
          <button
            className='btn btn-sm text-primary fw-bold'
            onClick={() => setQty((q) => Math.min(currentStock, q + 1))}
            disabled={qty >= currentStock || isButtonDisabled}
          >
            <i className='bi bi-plus'></i>
          </button>
        </div>

        <p className='small text-muted m-0'>
          Stok: <span className='fw-bold text-dark'>{currentStock}</span>
        </p>
      </div>

      <div className='d-flex justify-content-between align-items-center mb-3 mt-3'>
        <span className='text-muted'>Subtotal</span>
        <span className='fw-bold fs-5'>{formatRupiah(finalPrice * qty)}</span>
      </div>

      {/* Warning jika belum pilih varian */}
      {product.variants?.length > 0 && !selectedVariant && (
        <div className='alert alert-warning py-1 px-2 small mb-2'>
          Pilih varian warna & ukuran
        </div>
      )}

      <div className='d-grid gap-2'>
        <button
          className='btn btn-outline-primary fw-bold'
          disabled={isButtonDisabled}
          onClick={handleBuyNow}
        >
          Beli Langsung
        </button>
        <button
          className='btn btn-primary fw-bold'
          disabled={isButtonDisabled}
          onClick={handleAddToCart}
        >
          {isLoading ? "Memproses..." : "+ Keranjang"}
        </button>
      </div>
    </div>
  );
};

export default ProductAction;
