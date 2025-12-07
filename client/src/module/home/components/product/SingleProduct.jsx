import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetProductQuery } from "../../../../service/product/ApiProduct";

// Import Components
import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";
import ProductAction from "./ProductAction";
import ProductReviews from "./ProductReviews";

const SingleProduct = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  // State
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null); // State Varian Terpilih

  // RTK Query
  const { data: product, isLoading, isError } = useGetProductQuery(id);

  // Reset variant jika id berubah atau data baru dimuat
  useEffect(() => {
    setSelectedVariant(null);
    setQty(1);
  }, [id, product]);

  if (isLoading)
    return (
      <div className='text-center vh-75' style={{ marginTop: "100px" }}>
        <div className='spinner-border text-primary' />
      </div>
    );

  if (isError || !product)
    return (
      <div className='container mt-5 pt-5 alert alert-danger'>
        Produk tidak ditemukan
      </div>
    );

  return (
    <div className='container py-3'>
      <div className='row g-4'>
        {/* 1. Component Gallery */}
        <div className='col-12 col-md-4'>
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* 2. Component Info (Pass props variant handling) */}
        <div className='col-12 col-md-5'>
          <ProductInfo
            product={product}
            selectedVariant={selectedVariant}
            setSelectedVariant={setSelectedVariant}
          />
        </div>

        {/* 3. Component Action (Pass selectedVariant untuk kalkulasi harga) */}
        <div className='col-12 col-md-3'>
          <ProductAction
            product={product}
            qty={qty}
            setQty={setQty}
            selectedVariant={selectedVariant}
          />
        </div>
      </div>

      {/* 4. Reviews */}
      <ProductReviews reviews={product.reviews} rating={product.rating} />
    </div>
  );
};

export default SingleProduct;
