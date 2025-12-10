import React, { useState } from "react";
import { useRestoreDatabaseMutation } from "../../../service/config/ApiConfig";

const BackupNrestore = () => {
  const [file, setFile] = useState(null);
  const [restoreDatabase, { isLoading }] = useRestoreDatabaseMutation();
  const [isDownloading, setIsDownloading] = useState(false);

  // Handle Download Backup Manual (Non-RTK karena Blob)
  const handleBackup = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/config/backup", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Backup failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      alert("Gagal melakukan backup: " + error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRestore = async (e) => {
    e.preventDefault();
    if (!file) return alert("Pilih file backup (.zip) terlebih dahulu");

    if (
      !window.confirm(
        "PERINGATAN: Tindakan ini akan menghapus data saat ini dan menggantinya dengan data backup. Lanjutkan?"
      )
    ) {
      return;
    }

    const formData = new FormData();
    formData.append("backupFile", file);

    try {
      await restoreDatabase(formData).unwrap();
      alert("Restore berhasil! Halaman akan dimuat ulang.");
      window.location.reload();
    } catch (error) {
      alert(
        "Gagal restore: " + (error.data?.message || "Error tidak diketahui")
      );
    }
  };

  return (
    <div className='card shadow-sm'>
      <div className='card-header bg-primary text-white'>
        <h5 className='mb-0'>Backup & Restore System</h5>
      </div>
      <div className='card-body'>
        <div className='row'>
          {/* Section Backup */}
          <div className='col-md-6 border-end'>
            <h5 className='text-secondary mb-3'>Backup Data</h5>
            <p className='text-muted small'>
              Unduh seluruh data database (SQL) beserta file gambar (Assets)
              dalam format .zip.
            </p>
            <button
              onClick={handleBackup}
              disabled={isDownloading}
              className='btn btn-success w-100 py-2'
            >
              {isDownloading ? (
                <span>
                  <i className='fas fa-spinner fa-spin me-2'></i>Processing...
                </span>
              ) : (
                <span>
                  <i className='fas fa-download me-2'></i>Download Backup (.zip)
                </span>
              )}
            </button>
          </div>

          {/* Section Restore */}
          <div className='col-md-6'>
            <h5 className='text-secondary mb-3'>Restore Data</h5>
            <p className='text-muted small'>
              Upload file .zip hasil backup untuk mengembalikan kondisi sistem.
            </p>
            <form onSubmit={handleRestore}>
              <div className='mb-3'>
                <input
                  type='file'
                  className='form-control'
                  accept='.zip'
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                />
              </div>
              <button
                type='submit'
                className='btn btn-danger w-100'
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>
                    <i className='fas fa-spinner fa-spin me-2'></i>Restoring...
                  </span>
                ) : (
                  <span>
                    <i className='fas fa-upload me-2'></i>Restore Database
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupNrestore;
