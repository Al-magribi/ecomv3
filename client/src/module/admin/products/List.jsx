import React from "react";

const List = ({
  isLoading,
  isError,
  data,
  search,
  setSearch,
  page,
  setPage,
  onDelete,
  onEdit,
  onViewDetail,
  onCreate,
}) => {
  if (isLoading)
    return <div className="text-center p-5">Loading Products...</div>;
  if (isError)
    return (
      <div className="text-center p-5 text-danger">Error loading data</div>
    );

  return (
    <div className="card border-top-0 rounded-0 rounded-bottom shadow-sm">
      <div className="card-body">
        {/* --- Toolbar (Search & Add) --- */}
        <div className="row g-2 mb-4">
          {/* Input: 100% di Mobile (col-12), 75% di MD ke atas (col-md-9) */}
          <div className="col-12 col-md-9">
            <input
              type="text"
              className="form-control"
              placeholder="Cari Produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Button: 100% di Mobile (col-12), 25% di MD ke atas (col-md-3) */}
          <div className="col-12 col-md-3">
            <button className="btn btn-primary w-100" onClick={onCreate}>
              <i className="bi bi-plus-lg me-2"></i>Tambah Produk
            </button>
          </div>
        </div>

        {/* --- Card Grid Layout (Responsive) --- */}
        <div className="row g-3">
          {data?.data?.map((item) => (
            <div key={item.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
              <div className="card h-100 shadow-sm border-0 hover-shadow">
                {/* Gambar Produk */}
                <div className="position-relative">
                  <img
                    src={item.image || "https://via.placeholder.com/150"}
                    alt={item.name}
                    className="card-img-top"
                    style={{
                      height: "200px",
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                  />
                  {/* Badge Stok di atas gambar */}
                  <span
                    className={`position-absolute top-0 end-0 badge m-2 ${
                      item.stock < 10 ? "bg-warning text-dark" : "bg-success"
                    }`}
                  >
                    Stok: {item.stock}
                  </span>
                </div>

                <div className="card-body d-flex flex-column">
                  <small className="text-muted mb-1">
                    {item.category_name || "Uncategorized"}
                  </small>
                  <h6
                    className="card-title fw-bold text-truncate"
                    title={item.name}
                  >
                    {item.name}
                  </h6>
                  <h5 className="text-primary fw-bold mb-3">
                    Rp {parseInt(item.price).toLocaleString("id-ID")}
                  </h5>

                  {/* Tombol Aksi - Push to bottom */}
                  <div className="mt-auto d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-info flex-grow-1"
                      onClick={() => onViewDetail(item.id)}
                      title="Lihat Detail"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-warning flex-grow-1"
                      onClick={() => onEdit(item.id)}
                      title="Edit"
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger flex-grow-1"
                      onClick={() => onDelete(item.id)}
                      title="Hapus"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {data?.data?.length === 0 && (
            <div className="col-12 text-center py-5 text-muted">
              <i className="bi bi-box-seam display-4 d-block mb-3"></i>
              Tidak ada produk ditemukan.
            </div>
          )}
        </div>

        {/* --- Pagination --- */}
        {data?.data?.length > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
            <small className="text-muted">
              Halaman {data?.pagination?.page} / {data?.pagination?.totalPage}
            </small>
            <div>
              <button
                className="btn btn-sm btn-outline-secondary me-1"
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
              >
                Prev
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={!data?.pagination?.hasNext}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default List;
