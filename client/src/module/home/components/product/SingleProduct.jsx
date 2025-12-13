import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useGetProductQuery,
  useGetProductReviewsQuery,
} from "../../../../service/product/ApiProduct";

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

  // State Review
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewFilter, setReviewFilter] = useState(null); // null = All, 1-5 = Bintang
  const [allReviews, setAllReviews] = useState([]); // Array penampung ulasan yang di-load
  const [hasMoreReviews, setHasMoreReviews] = useState(false);

  // RTK Query
  const { data: product, isLoading, isError } = useGetProductQuery(id);

  const { data: reviewsData, isFetching: isFetchingReviews } =
    useGetProductReviewsQuery(
      {
        id,
        page: reviewPage,
        limit: 5, // Default load 5 ulasan
        rating: reviewFilter,
      },
      {
        skip: !id, // Jangan fetch jika ID tidak ada
        refetchOnMountOrArgChange: true, // Pastikan fetch ulang saat filter berubah
      }
    );

  // Reset variant jika id berubah atau data baru dimuat
  useEffect(() => {
    setSelectedVariant(null);
    setQty(1);
  }, [id, product]);

  // Logic: Menggabungkan Ulasan (Append vs Replace)
  useEffect(() => {
    if (reviewsData) {
      if (reviewPage === 1) {
        // Jika halaman 1 (filter baru atau refresh), GANTI data
        setAllReviews(reviewsData.data);
      } else {
        // Jika halaman > 1 (load more), GABUNG data
        setAllReviews((prev) => [...prev, ...reviewsData.data]);
      }
      setHasMoreReviews(reviewsData.pagination.hasNext); // Set tombol load more aktif/tidak
    }
  }, [reviewsData, reviewPage]);

  // Handler Ganti Filter
  const handleFilterChange = (star) => {
    setReviewFilter(star); // Set filter (null atau angka)
    setReviewPage(1); // Reset ke halaman 1
    setAllReviews([]); // Kosongkan tampilan sementara
  };

  // Handler Load More
  const handleLoadMore = () => {
    setReviewPage((prev) => prev + 1);
  };

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
      <title>{`Detail Produk ${product.name}`}</title>
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
      <ProductReviews
        reviews={allReviews}
        rating={product.rating}
        // Props Baru dari Backend
        ratingSummary={product.rating_summary}
        totalReviews={product.total_reviews}
        // Props Kontrol
        onFilterChange={handleFilterChange}
        activeFilter={reviewFilter}
        onLoadMore={handleLoadMore}
        hasMore={hasMoreReviews}
        isLoadingReviews={isFetchingReviews}
      />
    </div>
  );
};

export default SingleProduct;
