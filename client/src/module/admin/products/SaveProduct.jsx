import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  useSaveProductMutation,
  useGetProductQuery,
} from "../../../service/product/ApiProduct"; // Sesuaikan path
import { useGetCategoriesQuery } from "../../../service/product/ApiCategory"; // Sesuaikan path

const SaveProduct = ({ productId, onBack }) => {
  // --- STATE ---
  const [form, setForm] = useState({
    name: "",
    category_id: "",
    description: "",
    price: "",
    capital: "", // HPP / Modal
    stock: "",
    weight: "", // Gram
  });

  const [files, setFiles] = useState([]); // File objek untuk upload
  const [previews, setPreviews] = useState([]); // URL untuk preview gambar baru
  const [existingImages, setExistingImages] = useState([]); // Gambar lama dari DB (untuk edit mode)

  // --- API HOOKS ---
  const { data: categoriesData } = useGetCategoriesQuery({
    page: 1,
    limit: 100,
  });
  const [saveProduct, { isLoading: isSaving }] = useSaveProductMutation();

  // Fetch data jika mode Edit (productId ada)
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
      // Simpan gambar lama
      if (productData.images) {
        setExistingImages(productData.images);
      }
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

      // Buat preview URL
      const filePreviews = selectedFiles.map((file) =>
        URL.createObjectURL(file)
      );
      setPreviews((prev) => [...prev, ...filePreviews]);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi Sederhana
    if (!form.name || !form.price || !form.category_id) {
      toast.error("Mohon lengkapi data wajib (Nama, Kategori, Harga)");
      return;
    }

    try {
      const formData = new FormData();

      // Append field text
      if (productId) formData.append("id", productId);
      formData.append("name", form.name);
      formData.append("category_id", form.category_id);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("capital", form.capital);
      formData.append("stock", form.stock);
      formData.append("weight", form.weight);

      // Append files (Looping karena array)
      files.forEach((file) => {
        formData.append("images", file);
      });

      await saveProduct(formData).unwrap();

      toast.success(
        productId
          ? "Produk berhasil diperbarui!"
          : "Produk berhasil ditambahkan!"
      );
      onBack(); // Kembali ke tabel
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
    return <div className='text-center p-5'>Memuat data produk...</div>;
  }

  return (
    <div className='fade-in'>
      {/* Header */}
      <div className='d-flex align-items-center justify-content-between mb-4'>
        <div className='d-flex align-items-center'>
          <button
            className='btn btn-outline-secondary me-3 flex-shrink-0'
            onClick={onBack}
          >
            <i className='bi bi-arrow-left me-md-2'></i>
            {/* Tampilkan teks 'Kembali' hanya di layar sm ke atas */}
            <span className='d-none d-sm-inline'>Kembali</span>
          </button>

          <h4 className='mb-0 fw-bold'>
            {productId ? "Edit Produk" : "Tambah Produk Baru"}
          </h4>
        </div>
      </div>

      <form onSubmit={handleSubmit} encType='multipart/form-data'>
        <div className='row g-4'>
          {/* KOLOM KIRI: Informasi Dasar */}
          <div className='col-lg-8'>
            <div className='card border-0 shadow-sm mb-4'>
              <div className='card-header bg-white fw-bold py-3'>
                Informasi Produk
              </div>
              <div className='card-body'>
                {/* Nama Produk */}
                <div className='mb-3'>
                  <label className='form-label'>
                    Nama Produk <span className='text-danger'>*</span>
                  </label>
                  <input
                    type='text'
                    className='form-control'
                    name='name'
                    placeholder='Contoh: Kemeja Flannel Kotak'
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Kategori */}
                <div className='mb-3'>
                  <label className='form-label'>
                    Kategori <span className='text-danger'>*</span>
                  </label>
                  <select
                    className='form-select'
                    name='category_id'
                    value={form.category_id}
                    onChange={handleChange}
                    required
                  >
                    <option value=''>Pilih Kategori</option>
                    {categoriesData?.categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deskripsi */}
                <div className='mb-3'>
                  <label className='form-label'>Deskripsi</label>
                  <textarea
                    className='form-control'
                    rows='5'
                    name='description'
                    placeholder='Jelaskan spesifikasi produk...'
                    value={form.description}
                    onChange={handleChange}
                  ></textarea>
                </div>

                {/* Upload Gambar */}
                <div className='mb-3'>
                  <label className='form-label'>Gambar Produk</label>
                  <input
                    type='file'
                    className='form-control'
                    accept='image/*'
                    multiple
                    onChange={handleFileChange}
                  />
                  <small className='text-muted'>
                    Bisa memilih lebih dari 1 gambar sekaligus.
                  </small>

                  {/* Preview Area */}
                  <div className='d-flex gap-2 mt-3 overflow-auto'>
                    {/* Gambar Existing (Edit Mode) */}
                    {existingImages.map((img) => (
                      <div key={img.id} className='position-relative'>
                        <img
                          src={img.link}
                          alt='Existing'
                          className='rounded border'
                          width='80'
                          height='80'
                          style={{ objectFit: "cover", opacity: 0.7 }}
                        />
                        {/* Note: Menghapus gambar existing butuh endpoint API khusus jika ingin realtime, 
                             atau logic tambahan. Untuk sekarang hanya display. */}
                      </div>
                    ))}

                    {/* Gambar Baru (Upload) */}
                    {previews.map((src, idx) => (
                      <div key={idx} className='position-relative'>
                        <img
                          src={src}
                          alt='Preview'
                          className='rounded border border-primary'
                          width='80'
                          height='80'
                          style={{ objectFit: "cover" }}
                        />
                        <button
                          type='button'
                          className='btn btn-danger btn-sm position-absolute top-0 end-0 p-0 rounded-circle'
                          style={{
                            width: "20px",
                            height: "20px",
                            transform: "translate(30%, -30%)",
                          }}
                          onClick={() => removeFile(idx)}
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
          <div className='col-lg-4'>
            {/* Harga & Modal */}
            <div className='card border-0 shadow-sm mb-4'>
              <div className='card-header bg-white fw-bold py-3'>
                Harga & Modal
              </div>
              <div className='card-body'>
                <div className='mb-3'>
                  <label className='form-label'>
                    Harga Jual (Rp) <span className='text-danger'>*</span>
                  </label>
                  <input
                    type='number'
                    className='form-control fw-bold text-primary'
                    name='price'
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className='mb-3'>
                  <label className='form-label'>
                    Modal / HPP (Rp) <span className='text-danger'>*</span>
                  </label>
                  <input
                    type='number'
                    className='form-control'
                    name='capital'
                    value={form.capital}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Profit Preview Widget */}
                <div
                  className={`alert ${
                    profit >= 0 ? "alert-success" : "alert-danger"
                  } mb-0 py-2`}
                >
                  <div className='d-flex justify-content-between small'>
                    <span>Profit:</span>
                    <span className='fw-bold'>
                      Rp {profit.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className='d-flex justify-content-between small mt-1'>
                    <span>Margin:</span>
                    <span className='fw-bold'>{margin}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventaris & Pengiriman */}
            <div className='card border-0 shadow-sm'>
              <div className='card-header bg-white fw-bold py-3'>
                Inventaris
              </div>
              <div className='card-body'>
                <div className='mb-3'>
                  <label className='form-label'>Stok Awal</label>
                  <input
                    type='number'
                    className='form-control'
                    name='stock'
                    value={form.stock}
                    onChange={handleChange}
                  />
                </div>
                <div className='mb-3'>
                  <label className='form-label'>Berat (Gram)</label>
                  <div className='input-group'>
                    <input
                      type='number'
                      className='form-control'
                      name='weight'
                      value={form.weight}
                      onChange={handleChange}
                    />
                    <span className='input-group-text'>gr</span>
                  </div>
                  <small className='text-muted d-block mt-1'>
                    1000 gr = 1 kg
                  </small>
                </div>
              </div>
            </div>

            {/* Tombol Simpan */}
            <div className='d-grid mt-4'>
              <button
                type='submit'
                className='btn btn-primary btn-lg'
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className='spinner-border spinner-border-sm me-2'></span>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <i className='bi bi-save me-2'></i> Simpan Produk
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
