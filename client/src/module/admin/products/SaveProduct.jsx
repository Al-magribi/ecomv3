import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  useSaveProductMutation,
  useGetProductQuery,
} from "../../../service/product/ApiProduct";
import { useGetCategoriesQuery } from "../../../service/product/ApiCategory";

const SaveProduct = ({ productId, onBack }) => {
  // --- STATE ---
  const [form, setForm] = useState({
    name: "",
    category_id: "",
    description: "",
    price: "",
    capital: "",
    stock: "",
    weight: "",
  });

  const [files, setFiles] = useState([]); // File baru yang akan diupload
  const [previews, setPreviews] = useState([]); // Preview file baru
  const [existingImages, setExistingImages] = useState([]); // Gambar lama dari DB
  const [imagesToDelete, setImagesToDelete] = useState([]); // ID gambar lama yang akan dihapus

  // --- API HOOKS ---
  const { data: categoriesData } = useGetCategoriesQuery({
    page: 1,
    limit: 100,
  });
  const [saveProduct, { isLoading: isSaving }] = useSaveProductMutation();

  const { data: productData, isLoading: isLoadingData } = useGetProductQuery(
    productId,
    { skip: !productId }
  );

  // --- EFFECT: POPULATE DATA FOR EDIT ---
  useEffect(() => {
    if (productData && productId) {
      setForm({
        name: productData.name,
        category_id: productData.category_id || "",
        description: productData.description || "",
        price: productData.price,
        capital: productData.capital,
        stock: productData.stock,
        weight: productData.weight,
      });
      // Reset state gambar
      if (productData.images) {
        setExistingImages(productData.images);
      }
      setImagesToDelete([]); // Reset list hapus
      setFiles([]);
      setPreviews([]);
    }
  }, [productData, productId]);

  // --- HANDLERS ---

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);

      const filePreviews = selectedFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setPreviews((prev) => [...prev, ...filePreviews]);
    }
  };

  // Hapus file yang BARU dipilih (belum diupload)
  const removeNewFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Hapus gambar LAMA (Existing) - Tandai untuk dihapus di Backend
  const removeExistingImage = (imageId) => {
    // Tambahkan ID ke list penghapusan
    setImagesToDelete((prev) => [...prev, imageId]);
    // Hilangkan dari tampilan visual saat ini
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.price || !form.category_id) {
      toast.error("Mohon lengkapi data wajib (Nama, Kategori, Harga)");
      return;
    }

    try {
      const formData = new FormData();

      if (productId) formData.append("id", productId);
      formData.append("name", form.name);
      formData.append("category_id", form.category_id);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("capital", form.capital);
      formData.append("stock", form.stock);
      formData.append("weight", form.weight);

      // Kirim list ID gambar lama yang mau dihapus (sebagai string JSON)
      if (imagesToDelete.length > 0) {
        formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
      }

      // Append file baru
      files.forEach((file) => {
        formData.append("images", file);
      });

      await saveProduct(formData).unwrap();

      toast.success(
        productId
          ? "Produk berhasil diperbarui!"
          : "Produk berhasil ditambahkan!"
      );
      onBack();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan produk. Periksa inputan anda.");
    }
  };

  // --- KALKULASI PROFIT UI ---
  const profit =
    (parseFloat(form.price) || 0) - (parseFloat(form.capital) || 0);
  const margin =
    form.capital > 0 ? ((profit / form.capital) * 100).toFixed(1) : 0;

  if (productId && isLoadingData) {
    return <div className="text-center p-5">Memuat data produk...</div>;
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center">
          <button
            className="btn btn-outline-secondary me-3 flex-shrink-0"
            onClick={onBack}
          >
            <i className="bi bi-arrow-left me-md-2"></i>
            <span className="d-none d-sm-inline">Kembali</span>
          </button>

          <h4 className="mb-0 fw-bold">
            {productId ? "Edit Produk" : "Tambah Produk Baru"}
          </h4>
        </div>
      </div>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="row g-4">
          {/* KOLOM KIRI: Informasi Dasar */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white fw-bold py-3">
                Informasi Produk
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">
                    Nama Produk <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    placeholder="Contoh: Kemeja Flannel Kotak"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Kategori <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="category_id"
                    value={form.category_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {categoriesData?.categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Deskripsi</label>
                  <textarea
                    className="form-control"
                    rows="5"
                    name="description"
                    placeholder="Jelaskan spesifikasi produk..."
                    value={form.description}
                    onChange={handleChange}
                  ></textarea>
                </div>

                {/* Upload Gambar */}
                <div className="mb-3">
                  <label className="form-label">Gambar Produk</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                  />
                  <small className="text-muted">
                    Klik "Choose Files" untuk menambah gambar baru. Gambar lama
                    bisa dihapus dengan tombol X merah.
                  </small>

                  {/* Preview Area */}
                  <div className="d-flex gap-2 mt-3 overflow-auto flex-wrap">
                    {/* 1. Gambar Existing (Edit Mode) */}
                    {existingImages.map((img) => (
                      <div key={img.id} className="position-relative">
                        <img
                          src={img.link} // Pastikan Backend serve folder static dengan benar
                          alt="Existing"
                          className="rounded border"
                          width="100"
                          height="100"
                          style={{ objectFit: "cover" }}
                        />
                        {/* Tombol Hapus Gambar Lama */}
                        <button
                          type="button"
                          className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 rounded-circle d-flex align-items-center justify-content-center shadow"
                          style={{
                            width: "24px",
                            height: "24px",
                            transform: "translate(30%, -30%)",
                          }}
                          onClick={() => removeExistingImage(img.id)}
                          title="Hapus gambar ini"
                        >
                          &times;
                        </button>
                      </div>
                    ))}

                    {/* 2. Gambar Baru (Upload Preview) */}
                    {previews.map((src, idx) => (
                      <div key={`new-${idx}`} className="position-relative">
                        <img
                          src={src}
                          alt="Preview"
                          className="rounded border border-success"
                          width="100"
                          height="100"
                          style={{ objectFit: "cover" }}
                        />
                        {/* Tombol Batal Upload File Baru */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm position-absolute top-0 end-0 p-0 rounded-circle d-flex align-items-center justify-content-center shadow"
                          style={{
                            width: "24px",
                            height: "24px",
                            transform: "translate(30%, -30%)",
                          }}
                          onClick={() => removeNewFile(idx)}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: Harga & Inventaris */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-header bg-white fw-bold py-3">
                Harga & Modal
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">
                    Harga Jual (Rp) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control fw-bold text-primary"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    Modal / HPP (Rp) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="capital"
                    value={form.capital}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div
                  className={`alert ${
                    profit >= 0 ? "alert-success" : "alert-danger"
                  } mb-0 py-2`}
                >
                  <div className="d-flex justify-content-between small">
                    <span>Profit:</span>
                    <span className="fw-bold">
                      Rp {profit.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between small mt-1">
                    <span>Margin:</span>
                    <span className="fw-bold">{margin}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white fw-bold py-3">
                Inventaris
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Stok Awal</label>
                  <input
                    type="number"
                    className="form-control"
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Berat (Gram)</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      name="weight"
                      value={form.weight}
                      onChange={handleChange}
                    />
                    <span className="input-group-text">gr</span>
                  </div>
                  <small className="text-muted d-block mt-1">
                    1000 gr = 1 kg
                  </small>
                </div>
              </div>
            </div>

            <div className="d-grid mt-4">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2"></i> Simpan Produk
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SaveProduct;
