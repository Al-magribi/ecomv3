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
import List from "./List"; // Import komponen List yang baru dibuat

const Products = () => {
  const [activeTab, setActiveTab] = useState("categories");
  const [viewDetailId, setViewDetailId] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list', 'create'
  const [selectedId, setSelectedId] = useState(null);

  // State untuk Products
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // RTK Query hooks
  // Menggunakan limit 12 agar pas dengan grid (bisa dibagi 2, 3, atau 4 kolom)
  const { data, isLoading, isError } = useGetProductsQuery(
    { page, limit: 12, search },
    { skip: activeTab !== "products" || viewDetailId !== null }
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

  const handleCreate = () => {
    setSelectedId(null);
    setViewMode("create");
  };

  const handleEdit = (id) => {
    setSelectedId(id);
    setViewMode("create");
  };

  // --- RENDER COMPONENT LOGIC ---

  // 1. View Detail
  if (viewDetailId) {
    return (
      <AdminLayout>
        <Detail productId={viewDetailId} onBack={() => setViewDetailId(null)} />
      </AdminLayout>
    );
  }

  // 2. View Create / Edit Form
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

  // 3. Main View (Tabs: Categories & Product List)
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
              activeTab === "categories" ? "active fw-bold" : ""
            }`}
            onClick={() => setActiveTab("categories")}
          >
            <i className='bi bi-tags me-2'></i>
            Kategori
          </button>
        </li>
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
      </ul>

      {/* Tab Content */}
      <div className='tab-content'>
        {activeTab === "products" ? (
          <List
            isLoading={isLoading}
            isError={isError}
            data={data}
            search={search}
            setSearch={setSearch}
            page={page}
            setPage={setPage}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onViewDetail={setViewDetailId}
            onCreate={handleCreate}
          />
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
