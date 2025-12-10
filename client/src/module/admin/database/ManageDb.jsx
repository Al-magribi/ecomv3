import React, { useState, useEffect } from "react";
import {
  useGetTablesQuery,
  useResetTablesMutation,
} from "../../../service/config/ApiConfig"; // Sesuaikan path

const ManageDb = () => {
  const { data: tables = [], isLoading, isError } = useGetTablesQuery();
  const [resetTables, { isLoading: isResetting }] = useResetTablesMutation();

  const [selectedTables, setSelectedTables] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Handle Checkbox Individu
  const handleCheckboxChange = (tableName) => {
    if (selectedTables.includes(tableName)) {
      setSelectedTables(selectedTables.filter((t) => t !== tableName));
    } else {
      setSelectedTables([...selectedTables, tableName]);
    }
  };

  // Handle Select All
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTables([]);
    } else {
      setSelectedTables(tables);
    }
    setSelectAll(!selectAll);
  };

  const handleReset = async () => {
    if (selectedTables.length === 0)
      return alert("Pilih tabel yang ingin dibersihkan.");

    const confirmed = window.confirm(
      `ANDA YAKIN? \n\n${selectedTables.length} tabel akan DIKOSONGKAN permanen. Data tidak bisa kembali kecuali Anda memiliki backup.`
    );

    if (confirmed) {
      try {
        await resetTables(selectedTables).unwrap();
        alert("Tabel berhasil dikosongkan.");
        setSelectedTables([]);
        setSelectAll(false);
      } catch (error) {
        alert("Gagal mengosongkan tabel: " + (error.data?.message || "Error"));
      }
    }
  };

  if (isLoading)
    return <div className='p-4 text-center'>Loading tables...</div>;
  if (isError)
    return <div className='alert alert-danger'>Gagal memuat daftar tabel.</div>;

  return (
    <div className='card shadow-sm mt-3'>
      <div className='card-header bg-warning text-dark d-flex justify-content-between align-items-center'>
        <h5 className='mb-0'>Manage Database Tables</h5>
        <button
          className='btn btn-danger btn-sm'
          onClick={handleReset}
          disabled={isResetting || selectedTables.length === 0}
        >
          <i className='fas fa-trash-alt me-2'></i>
          {isResetting ? "Deleting..." : "Kosongkan Terpilih"}
        </button>
      </div>
      <div className='card-body'>
        <div className='alert alert-warning small'>
          <i className='fas fa-exclamation-triangle me-2'></i>
          Data yang dihapus tidak bisa dikembalikan. Pastikan sudah melakukan
          backup
        </div>

        <div className='form-check mb-3 border-bottom pb-2'>
          <input
            className='form-check-input'
            type='checkbox'
            id='checkAll'
            checked={selectAll}
            onChange={handleSelectAll}
          />
          <label className='form-check-label fw-bold' htmlFor='checkAll'>
            Pilih Semua Tabel
          </label>
        </div>

        <div className='row'>
          {tables.map((table) => (
            <div key={table} className='col-md-4 col-sm-6 mb-2'>
              <div className='form-check'>
                <input
                  className='form-check-input'
                  type='checkbox'
                  id={`tbl-${table}`}
                  checked={selectedTables.includes(table)}
                  onChange={() => handleCheckboxChange(table)}
                />
                <label className='form-check-label' htmlFor={`tbl-${table}`}>
                  {table}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageDb;
