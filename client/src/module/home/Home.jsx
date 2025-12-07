import React, { useEffect, useState, useRef, useCallback } from "react";
import { useGetProductsQuery } from "../../service/product/ApiProduct";
// Hapus passing props ke Header
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import ProductCard from "./components/product/ProductCard";
import MobileNav from "../../components/layout/MobileNav";
import { useSearchParams } from "react-router-dom";
import SingleProduct from "./components/product/SingleProduct";

const Home = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  // State search ini sekarang dikendalikan oleh URL
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();

  // Ambil parameter URL
  const single = searchParams.get("single");
  const querySearch = searchParams.get("q"); // Ambil keyword dari URL ?q=...

  // 1. EFEK BARU: Pantau perubahan URL query (?q=...)
  useEffect(() => {
    if (querySearch !== null) {
      setSearch(querySearch); // Update state lokal berdasarkan URL
      setDebouncedSearch(querySearch); // Langsung set debounce (atau biarkan efek debounce jalan)
      setPage(1); // Reset page saat search berubah
      setAllProducts([]); // Reset produk lama
    } else {
      // Jika tidak ada query q, berarti user ingin lihat semua produk
      setSearch("");
      setDebouncedSearch("");
    }
  }, [querySearch]);

  // 2. Debounce Logic (Opsional: Tetap berguna jika ada input lokal lain, tapi via URL sudah cukup aman)
  // Anda bisa menghapus useEffect debounce lama jika sepenuhnya bergantung pada URL enter submit
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // 3. Panggil API
  const { data, isFetching } = useGetProductsQuery({
    page,
    limit,
    search: debouncedSearch,
  });

  const handleSelect = (product) => {
    setPage(1);
    setSearchParams({
      single: true,
      name: product.name.replace(/\s+/g, "-"),
      id: product.id,
    });
  };

  useEffect(() => {
    if (data && data.data) {
      if (page === 1) {
        setAllProducts(data.data);
      } else {
        setAllProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newData = data.data.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newData];
        });
      }
      if (data.pagination) {
        setHasMore(data.pagination.hasNext);
      }
    }
  }, [data, page]);

  const observer = useRef();
  const lastElementRef = useCallback(
    (node) => {
      if (isFetching) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isFetching, hasMore]
  );

  return (
    <div className='d-flex flex-column min-vh-100 bg-light'>
      {/* HAPUS props search={search} setSearch={setSearch} */}
      <Header />

      {single ? (
        <SingleProduct />
      ) : (
        <main
          className='container flex-grow-1'
          style={{ marginBottom: "60px" }}
        >
          <div className='my-4'>
            <h4 className='fw-bold text-dark'>
              {debouncedSearch
                ? `Hasil pencarian: "${debouncedSearch}"`
                : "Produk Terbaik"}
            </h4>
            <hr />
          </div>

          <div className='row'>
            {allProducts.map((product, index) => {
              const isLastElement = allProducts.length === index + 1;
              return (
                <div
                  key={product.id}
                  ref={isLastElement ? lastElementRef : null}
                  className='col-6 col-md-4 col-lg-3 mb-4'
                >
                  <ProductCard
                    product={product}
                    onClick={() => handleSelect(product)}
                  />
                </div>
              );
            })}
          </div>

          <div className='text-center py-4'>
            {isFetching && (
              <div className='spinner-border text-primary' role='status'>
                <span className='visually-hidden'>Loading...</span>
              </div>
            )}

            {!isFetching &&
              allProducts.length === 0 &&
              (!data?.data || data.data.length === 0) && (
                <div className='alert alert-warning'>
                  Produk tidak ditemukan.
                </div>
              )}

            {!hasMore && allProducts.length > 0 && (
              <p className='text-muted small'>
                Semua produk sudah ditampilkan.
              </p>
            )}
          </div>
        </main>
      )}

      <Footer />
      <MobileNav />
    </div>
  );
};

export default Home;
