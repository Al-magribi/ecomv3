import React, { useState, useEffect } from "react";
import { useGetProductQuery } from "../../../service/product/ApiProduct";

const Detail = ({ productId, onBack }) => {
  const { data: product, isLoading, isError } = useGetProductQuery(productId);
  const [activeImage, setActiveImage] = useState("");

  // Set gambar utama saat data selesai dimuat
  useEffect(() => {
    if (product?.images?.length > 0) {
      setActiveImage(product.images[0].link);
    }
  }, [product]);

  // Helper Format Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  // Helper Format Tanggal
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Memuat detail produk...</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="alert alert-danger">
        Gagal memuat data.{" "}
        <button className="btn btn-link" onClick={onBack}>
          Kembali
        </button>
      </div>
    );
  }

  // Hitung persentase margin keuntungan
  const marginPercent = ((product.profit / product.capital) * 100).toFixed(1);

  return (
    <div className="fade-in">
      {/* Header Navigation */}
      <div className="d-flex align-items-center mb-4">
        <button className="btn btn-outline-secondary me-3" onClick={onBack}>
          <i className="bi bi-arrow-left me-2"></i>Kembali
        </button>
        <h4 className="mb-0 fw-bold">Detail Produk: {product.name}</h4>
      </div>

      <div className="row g-4">
        {/* --- KOLOM KIRI: GALERI GAMBAR --- */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-2">
              <div
                className="mb-2 bg-light rounded d-flex align-items-center justify-content-center"
                style={{ height: "300px", overflow: "hidden" }}
              >
                <img
                  src={
                    activeImage ||
                    "https://via.placeholder.com/300?text=No+Image"
                  }
                  alt="Main"
                  className="img-fluid"
                  style={{ maxHeight: "100%", objectFit: "contain" }}
                />
              </div>
              {/* Thumbnail Gallery */}
              <div className="d-flex gap-2 overflow-auto pb-2">
                {product.images?.map((img, idx) => (
                  <img
                    key={img.id}
                    src={img.link}
                    alt={`Thumb ${idx}`}
                    className={`rounded cursor-pointer border ${
                      activeImage === img.link ? "border-primary border-2" : ""
                    }`}
                    width="60"
                    height="60"
                    style={{ objectFit: "cover", cursor: "pointer" }}
                    onClick={() => setActiveImage(img.link)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Statistik Cepat */}
          <div className="card border-0 shadow-sm mt-3">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Statistik Penjualan</h6>
              <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                <span className="text-muted">Terjual</span>
                <span className="fw-bold">{product.sold_count} pcs</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                <span className="text-muted">Rating</span>
                <span className="fw-bold text-warning">
                  <i className="bi bi-star-fill me-1"></i>
                  {product.rating || 0} / 5.0
                </span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Dilihat</span>
                <span className="fw-bold">- kali</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- KOLOM TENGAH: INFO UTAMA & FINANSIAL --- */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <span className="badge bg-primary mb-2">
                    {product.category_name}
                  </span>
                  <h3 className="fw-bold text-dark">{product.name}</h3>
                  <p className="text-muted small">
                    Dibuat pada: {formatDate(product.created_at)}
                  </p>
                </div>
                <div className="text-end">
                  <h4 className="text-primary fw-bold mb-0">
                    {formatRupiah(product.price)}
                  </h4>
                  <small className="text-muted">Harga Jual</small>
                </div>
              </div>

              <hr />

              {/* Info Finansial (Khusus Admin) */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="p-3 bg-light rounded border">
                    <small className="text-muted d-block mb-1">
                      Modal (HPP)
                    </small>
                    <span className="fw-bold text-dark">
                      {formatRupiah(product.capital)}
                    </span>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 bg-light rounded border">
                    <small className="text-muted d-block mb-1">
                      Profit Satuan
                    </small>
                    <span className="fw-bold text-success">
                      +{formatRupiah(product.profit)}
                    </span>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 bg-light rounded border">
                    <small className="text-muted d-block mb-1">Margin</small>
                    <span className="fw-bold text-info">{marginPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Deskripsi */}
              <div className="mb-4">
                <h6 className="fw-bold">Deskripsi Produk</h6>
                <p className="text-muted" style={{ whiteSpace: "pre-wrap" }}>
                  {product.description || "Tidak ada deskripsi."}
                </p>
              </div>

              {/* Berat & Stok Total */}
              <div className="row mb-4">
                <div className="col-6">
                  <strong>Berat: </strong> {product.weight} Gram
                </div>
                <div className="col-6">
                  <strong>Total Stok: </strong> {product.stock} Pcs
                </div>
              </div>
            </div>
          </div>

          {/* --- TABEL VARIAN (JIKA ADA) --- */}
          {product.variants && product.variants.length > 0 && (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white fw-bold">Varian Produk</div>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Nama Varian</th>
                      <th>Warna</th>
                      <th>Ukuran</th>
                      <th>Stok</th>
                      <th>Penyesuaian Harga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((v) => (
                      <tr key={v.id}>
                        <td>{v.name}</td>
                        <td>{v.color || "-"}</td>
                        <td>{v.size || "-"}</td>
                        <td>
                          <span
                            className={`badge ${
                              v.stock > 0 ? "bg-success" : "bg-danger"
                            }`}
                          >
                            {v.stock}
                          </span>
                        </td>
                        <td>
                          {v.price_adjustment > 0
                            ? `+ ${formatRupiah(v.price_adjustment)}`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- LIST REVIEW --- */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <span className="fw-bold">Ulasan Pembeli</span>
              <span className="badge bg-secondary">
                {product.reviews?.length || 0} Ulasan
              </span>
            </div>
            <div className="card-body">
              {product.reviews && product.reviews.length > 0 ? (
                <div className="list-group list-group-flush">
                  {product.reviews.map((rev) => (
                    <div key={rev.id} className="list-group-item px-0 py-3">
                      <div className="d-flex w-100 justify-content-between mb-1">
                        <div className="d-flex align-items-center">
                          <img
                            src={
                              rev.avatar ||
                              "https://ui-avatars.com/api/?name=" +
                                rev.user_name
                            }
                            alt="av"
                            className="rounded-circle me-2"
                            width="30"
                            height="30"
                          />
                          <h6 className="mb-0 me-2">{rev.user_name}</h6>
                        </div>
                        <small className="text-muted">
                          {formatDate(rev.created_at)}
                        </small>
                      </div>
                      <div className="mb-2">
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={`bi bi-star${
                              i < rev.rating ? "-fill" : ""
                            } text-warning small me-1`}
                          ></i>
                        ))}
                      </div>
                      <p className="mb-1 text-secondary small">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-chat-square-dots display-6 d-block mb-2 opacity-50"></i>
                  Belum ada ulasan untuk produk ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
