import React, { useState } from "react";
import {
  useRestoreDatabaseMutation,
  useGetBackupsQuery,
  useCreateBackupMutation,
  useDeleteBackupMutation,
} from "../../../service/config/ApiConfig";

const BackupNrestore = () => {
  const [file, setFile] = useState(null);

  // RTK Query Hooks
  const { data: backups = [], isLoading: isLoadingList } = useGetBackupsQuery();
  const [createBackup, { isLoading: isBackingUp }] = useCreateBackupMutation();
  const [deleteBackup, { isLoading: isDeleting }] = useDeleteBackupMutation();
  const [restoreDatabase, { isLoading: isRestoring }] =
    useRestoreDatabaseMutation();

  // 1. Handle Create Backup
  const handleBackup = async () => {
    try {
      const result = await createBackup().unwrap();
      alert(`Sukses: ${result.message}`);
    } catch (error) {
      console.error(error);
      alert("Gagal membuat backup: " + (error.data?.message || error.message));
    }
  };

  // 2. Handle Delete Backup
  const handleDelete = async (filename) => {
    if (
      !window.confirm(`Apakah Anda yakin ingin menghapus file ${filename}?`)
    ) {
      return;
    }
    try {
      await deleteBackup(filename).unwrap();
    } catch (error) {
      alert("Gagal menghapus: " + (error.data?.message || error.message));
    }
  };

  // 3. Handle Restore
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
      <div className='card-header bg-primary text-white d-flex align-items-center'>
        <i className='bi bi-database-fill-gear me-2 fs-5'></i>
        <h5 className='mb-0'>Backup & Restore System</h5>
      </div>
      <div className='card-body'>
        {/* === SECTION ATAS: ACTIONS === */}
        <div className='row g-4 mb-4'>
          {/* Create Backup Column */}
          <div className='col-md-5 border-end'>
            <h6 className='text-secondary fw-bold mb-2'>
              <i className='bi bi-plus-square-dotted me-2'></i>
              Buat Backup Baru
            </h6>
            <p className='text-muted small mb-3'>
              Sistem akan membuat snapshot database & gambar (assets) lalu
              menyimpannya di server.
            </p>
            <button
              onClick={handleBackup}
              disabled={isBackingUp}
              className='btn btn-success w-100 py-2 shadow-sm'
            >
              {isBackingUp ? (
                <>
                  <span
                    className='spinner-border spinner-border-sm me-2'
                    role='status'
                    aria-hidden='true'
                  ></span>
                  Memproses...
                </>
              ) : (
                <>
                  <i className='bi bi-database-add me-2'></i>
                  Buat Backup Sekarang
                </>
              )}
            </button>
          </div>

          {/* Restore Backup Column */}
          <div className='col-md-7 ps-md-4'>
            <h6 className='text-secondary fw-bold mb-2'>
              <i className='bi bi-arrow-counterclockwise me-2'></i>
              Restore Data
            </h6>
            <p className='text-muted small mb-3'>
              Upload file <code>.zip</code> hasil backup untuk mengembalikan
              database ke kondisi sebelumnya.
            </p>

            <form onSubmit={handleRestore}>
              <div className='input-group shadow-sm'>
                <input
                  type='file'
                  className='form-control'
                  accept='.zip'
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                />
                <button
                  type='submit'
                  className='btn btn-danger'
                  disabled={isRestoring}
                  style={{ minWidth: "130px" }}
                >
                  {isRestoring ? (
                    <>
                      <span
                        className='spinner-border spinner-border-sm me-2'
                        role='status'
                        aria-hidden='true'
                      ></span>
                      Restoring...
                    </>
                  ) : (
                    <>
                      <i className='bi bi-cloud-upload me-2'></i>
                      Restore
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <hr className='text-secondary opacity-25' />

        {/* === SECTION BAWAH: RIWAYAT === */}
        <div className='row mt-4'>
          <div className='col-12'>
            <div className='d-flex justify-content-between align-items-center mb-3'>
              <h6 className='text-secondary fw-bold mb-0'>
                <i className='bi bi-clock-history me-2'></i>
                Riwayat Backup Tersimpan
              </h6>
            </div>

            <div className='table-responsive border rounded bg-white'>
              <table className='table table-hover table-striped mb-0 align-middle'>
                <thead className='table-light'>
                  <tr>
                    <th scope='col' className='ps-3'>
                      Nama File
                    </th>
                    <th scope='col'>Ukuran</th>
                    <th scope='col'>Waktu Dibuat</th>
                    <th
                      scope='col'
                      className='text-center'
                      style={{ width: "140px" }}
                    >
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingList ? (
                    <tr>
                      <td colSpan='4' className='text-center py-4 text-muted'>
                        <div
                          className='spinner-border text-primary spinner-border-sm me-2'
                          role='status'
                        ></div>
                        Memuat riwayat...
                      </td>
                    </tr>
                  ) : backups.length === 0 ? (
                    <tr>
                      <td
                        colSpan='4'
                        className='text-center py-4 text-muted fst-italic'
                      >
                        <i className='bi bi-folder-x me-2'></i>
                        Belum ada file backup tersimpan di server.
                      </td>
                    </tr>
                  ) : (
                    backups.map((bk, idx) => (
                      <tr key={idx}>
                        <td className='ps-3'>
                          <i className='bi bi-file-earmark-zip-fill text-warning me-2'></i>
                          <span className='fw-medium text-dark'>{bk.name}</span>
                        </td>
                        <td>
                          <span className='badge bg-secondary bg-opacity-10 text-secondary border'>
                            {bk.size}
                          </span>
                        </td>
                        <td className='small text-muted'>
                          {new Date(bk.created_at).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "medium",
                          })}
                        </td>
                        <td className='text-center'>
                          <div className='d-flex justify-content-center gap-2'>
                            {/* Tombol Download */}
                            <a
                              href={bk.url}
                              target='_blank'
                              rel='noreferrer'
                              className='btn btn-sm btn-outline-primary'
                              title='Download File'
                            >
                              <i className='bi bi-download'></i>
                            </a>

                            {/* Tombol Delete */}
                            <button
                              className='btn btn-sm btn-outline-danger'
                              onClick={() => handleDelete(bk.name)}
                              disabled={isDeleting}
                              title='Hapus File'
                            >
                              <i className='bi bi-trash'></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupNrestore;
