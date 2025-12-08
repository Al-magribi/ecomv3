import React, { useState, useEffect } from "react";
import {
  useGetCategoriesQuery,
  useSaveCategoryMutation,
  useDeleteCategoryMutation,
} from "../../../service/product/ApiCategory";
import { toast } from "react-toastify";

const Categories = () => {
  // --- State Management ---
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // State untuk Modal Form
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [editId, setEditId] = useState(null); // Jika null berarti mode "Add", jika ada ID berarti "Edit"

  // --- API Hooks ---
  const { data, isLoading, isError, refetch } = useGetCategoriesQuery({
    page,
    limit: 10,
    search,
  });

  const [saveCategory, { isLoading: isSaving }] = useSaveCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  // --- Handlers ---

  // Reset form saat menutup modal
  const handleCloseModal = () => {
    setShowModal(false);
    setFormName("");
    setEditId(null);
  };

  // Buka modal untuk tambah baru
  const handleAddNew = () => {
    setEditId(null);
    setFormName("");
    setShowModal(true);
  };

  // Buka modal untuk edit
  const handleEdit = (category) => {
    setEditId(category.id);
    setFormName(category.name);
    setShowModal(true);
  };

  // Simpan data (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim())
      return toast.warning("Nama kategori tidak boleh kosong");

    try {
      const payload = {
        id: editId, // Jika null, backend akan menganggap insert baru
        name: formName,
      };

      await saveCategory(payload).unwrap();

      toast.success(
        editId
          ? "Kategori berhasil diperbarui"
          : "Kategori berhasil ditambahkan"
      );
      handleCloseModal();
      refetch(); // Refresh data table
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan kategori");
    }
  };

  // Hapus data
  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus kategori ini?")) {
      try {
        await deleteCategory(id).unwrap();
        toast.success("Kategori berhasil dihapus");
        refetch();
      } catch (error) {
        toast.error("Gagal menghapus kategori");
      }
    }
  };

  // --- Render UI ---

  // Loading State
  if (isLoading) {
    return (
      <div className='text-center py-5'>
        <div className='spinner-border text-primary' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className='alert alert-danger' role='alert'>
        Terjadi kesalahan saat memuat data kategori.
      </div>
    );
  }

  return (
    <div className='container-fluid p-0'>
      {/* --- Toolbar: Search & Add Button --- */}
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <div className='input-group w-50' style={{ maxWidth: "300px" }}>
          <span className='input-group-text bg-white border-end-0'>
            <i className='bi bi-search text-muted'></i>
          </span>
          <input
            type='text'
            className='form-control border-start-0 ps-0'
            placeholder='Cari Kategori...'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset ke halaman 1 saat mencari
            }}
          />
        </div>
        <button className='btn btn-primary' onClick={handleAddNew}>
          <i className='bi bi-plus-lg me-2'></i>Tambah Kategori
        </button>
      </div>

      {/* --- Table Categories --- */}
      <div className='card shadow-sm border-0'>
        <div className='card-body p-0'>
          <div className='table-responsive'>
            <table className='table table-hover align-middle mb-0'>
              <thead className='table-light'>
                <tr>
                  <th scope='col' className='ps-4' style={{ width: "5%" }}>
                    No
                  </th>
                  <th scope='col' style={{ width: "70%" }}>
                    Nama Kategori
                  </th>
                  <th scope='col' className='text-end pe-4'>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.categories?.length > 0 ? (
                  data.categories.map((cat, index) => (
                    <tr key={cat.id}>
                      <td className='ps-4'>
                        {(data.pagination
                          ? (data.pagination.page - 1) * 10
                          : 0) +
                          index +
                          1}
                      </td>
                      <td className='fw-semibold text-dark'>{cat.name}</td>
                      <td className='text-end pe-4 text-nowrap'>
                        <button
                          className='btn btn-sm btn-outline-warning me-2'
                          onClick={() => handleEdit(cat)}
                          title='Edit'
                        >
                          <i className='bi bi-pencil-square'></i>
                        </button>
                        <button
                          className='btn btn-sm btn-outline-danger'
                          onClick={() => handleDelete(cat.id)}
                          title='Hapus'
                        >
                          <i className='bi bi-trash'></i>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan='3' className='text-center py-4 text-muted'>
                      Tidak ada data kategori ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- Pagination --- */}
      <div className='d-flex justify-content-between align-items-center mt-3'>
        <small className='text-muted'>
          Total: {data?.totalCategories || 0} Kategori
        </small>
        <nav aria-label='Page navigation'>
          <ul className='pagination pagination-sm mb-0'>
            <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
              <button
                className='page-link'
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
            </li>
            <li className='page-item disabled'>
              <span className='page-link text-dark'>
                Halaman {page} dari {data?.totalPages || 1}
              </span>
            </li>
            <li
              className={`page-item ${
                page >= (data?.totalPages || 1) ? "disabled" : ""
              }`}
            >
              <button
                className='page-link'
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* --- Modal Form (Manual Implementation for React) --- */}
      {showModal && (
        <>
          <div
            className='modal fade show d-block'
            tabIndex='-1'
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className='modal-dialog modal-dialog-centered'>
              <div className='modal-content'>
                <div className='modal-header'>
                  <h5 className='modal-title'>
                    {editId ? "Edit Kategori" : "Tambah Kategori Baru"}
                  </h5>
                  <button
                    type='button'
                    className='btn-close'
                    onClick={handleCloseModal}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className='modal-body'>
                    <div className='mb-3'>
                      <label htmlFor='categoryName' className='form-label'>
                        Nama Kategori
                      </label>
                      <input
                        type='text'
                        className='form-control'
                        id='categoryName'
                        placeholder='Contoh: Elektronik, Fashion'
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        autoFocus
                        required
                      />
                    </div>
                  </div>
                  <div className='modal-footer'>
                    <button
                      type='button'
                      className='btn btn-secondary'
                      onClick={handleCloseModal}
                    >
                      Batal
                    </button>
                    <button
                      type='submit'
                      className='btn btn-primary'
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <span
                            className='spinner-border spinner-border-sm me-2'
                            role='status'
                            aria-hidden='true'
                          ></span>
                          Menyimpan...
                        </>
                      ) : (
                        "Simpan"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Categories;
