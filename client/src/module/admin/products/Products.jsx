import React, { useState } from "react";
import AdminLayout from "../layout/AdminLayout";
import Categories from "./Categories";
import {
  useGetProductsQuery,
  useDeleteProductMutation,
} from "../../../service/product/ApiProduct";
import { toast } from "react-toastify";
import Detail from "./Detail";
import SaveProduct from "./SaveProduct";

const Products = () => {
  const [activeTab, setActiveTab] = useState("products");
  const [viewDetailId, setViewDetailId] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list', 'detail', 'create', 'edit'
  const [selectedId, setSelectedId] = useState(null);

  // State untuk Products
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // RTK Query hooks
  const { data, isLoading, isError } = useGetProductsQuery(
    { page, limit: 10, search },
    { skip: activeTab !== "products" || viewDetailId !== null } // Skip fetch jika sedang lihat detail
  );

  const [deleteProduct] = useDeleteProductMutation();

  const handleDelete = async (id) => {
    if (
      confirm("Apakah anda yakin ingin menghapus produk ini beserta gambarnya?")
    ) {
      try {
        await deleteProduct(id).unwrap();
        toast.success("Produk berhasil dihapus");
      } catch (error) {
        toast.error("Gagal menghapus produk");
      }
    }
  };

  // Komponen Tab Content: List Products
  const ProductList = () => {
    if (isLoading)
      return <div className='text-center p-5'>Loading Products...</div>;
    if (isError)
      return (
        <div className='text-center p-5 text-danger'>Error loading data</div>
      );

    return (
      <div className='card border-top-0 rounded-0 rounded-bottom shadow-sm'>
        <div className='card-body'>
          {/* Toolbar */}
          <div className='d-flex justify-content-between mb-3'>
            <input
              type='text'
              className='form-control w-25'
              placeholder='Cari Produk...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className='btn btn-primary'
              onClick={() => {
                setSelectedId(null);
                setViewMode("create");
              }}
            >
              <i className='bi bi-plus-lg me-2'></i>Tambah Produk
            </button>
          </div>

          {/* Table */}
          <div className='table-responsive'>
            <table className='table table-hover align-middle'>
              <thead className='table-light'>
                <tr>
                  <th>Gambar</th>
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Stok</th>
                  <th className='text-end'>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <img
                        src={item.image || "https://via.placeholder.com/50"}
                        alt={item.name}
                        className='rounded border'
                        width='50'
                        height='50'
                        style={{ objectFit: "cover" }}
                      />
                    </td>
                    <td>
                      <div className='fw-bold'>{item.name}</div>
                      <small className='text-muted'>ID: {item.id}</small>
                    </td>
                    <td>{item.category_name}</td>
                    <td>Rp {parseInt(item.price).toLocaleString("id-ID")}</td>
                    <td>
                      <span
                        className={`badge ${
                          item.stock < 10 ? "bg-warning" : "bg-success"
                        }`}
                      >
                        {item.stock}
                      </span>
                    </td>
                    {/* Tambahkan class 'text-nowrap' agar cell tidak wrap ke bawah */}
                    <td className='text-end text-nowrap'>
                      {/* Gunakan Flexbox dengan gap agar rapi */}
                      <div className='d-flex gap-2 justify-content-end'>
                        {/* Tombol Detail */}
                        <button
                          className='btn btn-sm btn-outline-info'
                          onClick={() => setViewDetailId(item.id)}
                          title='Lihat Detail'
                        >
                          <i className='bi bi-eye'></i>
                        </button>

                        {/* Tombol Edit */}
                        <button
                          className='btn btn-sm btn-outline-warning'
                          onClick={() => {
                            setSelectedId(item.id);
                            setViewMode("create");
                          }}
                        >
                          <i className='bi bi-pencil'></i>
                        </button>

                        {/* Tombol Hapus */}
                        <button
                          className='btn btn-sm btn-outline-danger'
                          onClick={() => handleDelete(item.id)}
                        >
                          <i className='bi bi-trash'></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr>
                    <td colSpan='6' className='text-center py-4'>
                      Tidak ada data produk
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Sederhana */}
          <div className='d-flex justify-content-between align-items-center mt-3'>
            <small className='text-muted'>
              Halaman {data?.pagination?.page} dari{" "}
              {data?.pagination?.totalPage}
            </small>
            <div>
              <button
                className='btn btn-sm btn-outline-secondary me-1'
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Prev
              </button>
              <button
                className='btn btn-sm btn-outline-secondary'
                disabled={!data?.pagination?.hasNext}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER UTAMA ---

  // Jika sedang mode Detail, tampilkan komponen Detail
  if (viewDetailId) {
    return (
      <AdminLayout title='Detail Produk'>
        <Detail productId={viewDetailId} onBack={() => setViewDetailId(null)} />
      </AdminLayout>
    );
  }

  if (viewMode === "create") {
    return (
      <AdminLayout title={selectedId ? "Edit Produk" : "Tambah Produk"}>
        <SaveProduct
          productId={selectedId}
          onBack={() => setViewMode("list")}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Managemen Produk`}>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <h3 className='mb-0 fw-bold'>Manajemen Produk</h3>
      </div>

      {/* Navigation Tabs */}
      <ul className='nav nav-tabs'>
        <li className='nav-item'>
          <button
            className={`nav-link ${
              activeTab === "products" ? "active fw-bold" : ""
            }`}
            onClick={() => setActiveTab("products")}
          >
            <i className='bi bi-box-seam me-2'></i>
            Data Produk
          </button>
        </li>
        <li className='nav-item'>
          <button
            className={`nav-link ${
              activeTab === "categories" ? "active fw-bold" : ""
            }`}
            onClick={() => setActiveTab("categories")}
          >
            <i className='bi bi-tags me-2'></i>
            Kategori
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className='tab-content'>
        {activeTab === "products" ? (
          <ProductList />
        ) : (
          <div className='card border-top-0 rounded-0 rounded-bottom shadow-sm'>
            <div className='card-body'>
              <Categories />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Products;
