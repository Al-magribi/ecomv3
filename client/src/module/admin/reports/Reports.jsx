import React, { useState, Fragment } from "react";
import AdminLayout from "../layout/AdminLayout";
import { useGetReportQuery } from "../../../service/reports/ApiReport";

const Reports = () => {
  // --- State Tanggal (Default: Bulan Ini) ---
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [page, setPage] = useState(1);

  // State untuk Accordion (Menyimpan ID invoice yang sedang dibuka detailnya)
  const [expandedRow, setExpandedRow] = useState(null);

  // --- API ---
  const { data, isLoading, isError } = useGetReportQuery({
    startDate,
    endDate,
    page,
    limit: 20,
  });

  // --- Helper ---
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleRow = (id) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  return (
    <AdminLayout title={`Laporan Penjualan`}>
      <div className='d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3'>
        <div>
          <h3 className='fw-bold mb-0'>Laporan Keuangan</h3>
          <small className='text-muted'>
            Analisa profit bersih dan kotor penjualan
          </small>
        </div>
        <button
          className='btn btn-outline-dark d-print-none'
          onClick={handlePrint}
        >
          <i className='bi bi-printer me-2'></i> Cetak PDF
        </button>
      </div>

      {/* --- Filter Section --- */}
      <div className='card border-0 shadow-sm mb-4 d-print-none'>
        <div className='card-body'>
          <div className='row g-3 align-items-end'>
            <div className='col-6 col-md-4'>
              <label className='form-label small fw-bold'>Dari Tanggal</label>
              <input
                type='date'
                className='form-control'
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className='col-6 col-md-4'>
              <label className='form-label small fw-bold'>Sampai Tanggal</label>
              <input
                type='date'
                className='form-control'
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- Summary Cards (3 Kolom: Omzet, Profit, Transaksi) --- */}
      <div className='row g-3 mb-4'>
        {/* Card 1: Omzet / Revenue */}
        <div className='col-12 col-md-4'>
          <div className='card border-0 shadow-sm h-100 bg-primary bg-gradient text-white'>
            <div className='card-body p-3'>
              <small className='text-white-50 text-uppercase fw-bold'>
                Total Omzet (Kotor)
              </small>
              <h3 className='fw-bold mb-0 mt-1'>
                {isLoading
                  ? "..."
                  : formatRupiah(data?.summary?.total_revenue || 0)}
              </h3>
              <small className='text-white-50' style={{ fontSize: "0.75rem" }}>
                Total Penjualan + Ongkir
              </small>
            </div>
          </div>
        </div>

        {/* Card 2: Profit Bersih */}
        <div className='col-12 col-md-4'>
          <div className='card border-0 shadow-sm h-100 bg-success bg-gradient text-white'>
            <div className='card-body p-3'>
              <small className='text-white-50 text-uppercase fw-bold'>
                Total Profit (Bersih)
              </small>
              <h3 className='fw-bold mb-0 mt-1'>
                {isLoading
                  ? "..."
                  : formatRupiah(data?.summary?.total_net_profit || 0)}
              </h3>
              <small className='text-white-50' style={{ fontSize: "0.75rem" }}>
                Harga Jual - Modal (HPP)
              </small>
            </div>
          </div>
        </div>

        {/* Card 3: Transaksi */}
        <div className='col-12 col-md-4'>
          <div className='card border-0 shadow-sm h-100 bg-white'>
            <div className='card-body p-3'>
              <small className='text-muted text-uppercase fw-bold'>
                Total Transaksi
              </small>
              <h3 className='fw-bold text-dark mb-0 mt-1'>
                {isLoading ? "..." : data?.summary?.total_transactions || 0}
              </h3>
              <small className='text-muted' style={{ fontSize: "0.75rem" }}>
                Pesanan Selesai (Completed)
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* --- Data Table --- */}
      <div className='card border-0 shadow-sm'>
        <div className='card-header bg-white py-3'>
          <h6 className='mb-0 fw-bold'>Rincian Per Pesanan</h6>
        </div>
        <div className='card-body p-0'>
          <div className='table-responsive'>
            <table className='table table-hover align-middle mb-0'>
              <thead className='table-light'>
                <tr>
                  <th className='ps-4'>No</th>
                  <th>Tanggal / Invoice</th>
                  <th>Pelanggan</th>
                  <th className='text-end'>Total Modal</th>
                  <th className='text-end'>Profit Bersih</th>
                  <th className='text-center' style={{ width: "50px" }}>
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan='6' className='text-center py-5'>
                      <div
                        className='spinner-border text-primary'
                        role='status'
                      ></div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan='6' className='text-center py-5 text-danger'>
                      Gagal memuat data
                    </td>
                  </tr>
                ) : data?.data?.length > 0 ? (
                  data.data.map((item, index) => (
                    <Fragment key={item.id}>
                      {/* --- MAIN ROW (ORDER LEVEL) --- */}
                      <tr
                        className={
                          expandedRow === item.id ? "table-active" : ""
                        }
                      >
                        <td className='ps-4'>
                          {(data.pagination.page - 1) * data.pagination.limit +
                            index +
                            1}
                        </td>
                        <td>
                          <div className='fw-bold text-primary'>
                            {item.invoice_number}
                          </div>
                          <small className='text-muted'>
                            {new Date(item.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </small>
                        </td>
                        <td>
                          <div className='fw-bold'>{item.recipient_name}</div>
                          <small className='text-muted'>
                            {item.user_account_name || "Guest"}
                          </small>
                        </td>
                        <td className='text-end text-muted'>
                          {formatRupiah(item.total_capital)}
                        </td>
                        <td className='text-end fw-bold text-success'>
                          {formatRupiah(item.total_net_profit_order)}
                        </td>
                        <td className='text-center'>
                          <button
                            className={`btn btn-sm ${
                              expandedRow === item.id
                                ? "btn-dark"
                                : "btn-outline-secondary"
                            }`}
                            onClick={() => toggleRow(item.id)}
                          >
                            <i
                              className={`bi bi-chevron-${
                                expandedRow === item.id ? "up" : "down"
                              }`}
                            ></i>
                          </button>
                        </td>
                      </tr>

                      {/* --- EXPANDED ROW (ITEM DETAIL LEVEL) --- */}
                      {expandedRow === item.id && (
                        <tr>
                          <td colSpan='6' className='bg-light p-3'>
                            <div className='card border-0 shadow-sm'>
                              <div className='card-header bg-white fw-bold small'>
                                Rincian Profit Produk (Order:{" "}
                                {item.invoice_number})
                              </div>
                              <div className='table-responsive'>
                                <table className='table table-sm mb-0 table-bordered'>
                                  <thead className='table-secondary small text-muted'>
                                    <tr>
                                      <th>Nama Produk</th>
                                      <th className='text-center'>Qty</th>
                                      <th className='text-end'>Modal Satuan</th>
                                      <th className='text-end'>Harga Jual</th>
                                      <th className='text-end'>Profit/Item</th>
                                      <th className='text-end'>Total Profit</th>
                                    </tr>
                                  </thead>
                                  <tbody className='small'>
                                    {item.items_detail?.map((detail, idx) => (
                                      <tr key={idx}>
                                        <td>
                                          {detail.product_name}
                                          <span className='text-muted ms-1'>
                                            ({detail.variant})
                                          </span>
                                        </td>
                                        <td className='text-center'>
                                          {detail.quantity}
                                        </td>
                                        <td className='text-end text-muted'>
                                          {formatRupiah(detail.capital_unit)}
                                        </td>
                                        <td className='text-end'>
                                          {formatRupiah(detail.price_sale_unit)}
                                        </td>
                                        <td className='text-end text-success fw-bold'>
                                          {formatRupiah(
                                            detail.price_sale_unit -
                                              detail.capital_unit
                                          )}
                                        </td>
                                        <td className='text-end bg-success bg-opacity-10 fw-bold text-success'>
                                          {formatRupiah(detail.net_profit)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot className='small fw-bold'>
                                    <tr>
                                      <td colSpan='5' className='text-end'>
                                        Total Profit Pesanan (Tanpa Ongkir)
                                      </td>
                                      <td className='text-end'>
                                        {formatRupiah(
                                          item.total_net_profit_order
                                        )}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan='6' className='text-center py-5 text-muted'>
                      Tidak ada data penjualan pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Pagination --- */}
        {data?.pagination && (
          <div className='card-footer bg-white d-print-none d-flex flex-column flex-sm-row justify-content-between align-items-center py-3 gap-2'>
            <small className='text-muted'>
              Halaman {data.pagination.page} dari {data.pagination.totalPage}
            </small>
            <div className='d-flex gap-2'>
              <button
                className='btn btn-sm btn-outline-secondary'
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>
              <button
                className='btn btn-sm btn-outline-secondary'
                disabled={!data.pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Reports;
