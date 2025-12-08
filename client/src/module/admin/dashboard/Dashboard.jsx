import React from "react";
import AdminLayout from "../layout/AdminLayout"; // Sesuaikan path import
import { useGetSummaryQuery } from "../../../service/reports/ApiReport";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { data, isLoading, isError } = useGetSummaryQuery(undefined, {
    pollingInterval: 30000, // Auto refresh setiap 30 detik
  });

  // Helper format Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  // Komponen Card Statistik Kecil
  const StatCard = ({ title, value, icon, color }) => (
    <div className="col-12 col-sm-6 col-lg-3">
      <div
        className={`card shadow-sm border-0 border-start border-4 border-${color} h-100`}
      >
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h6 className="text-muted text-uppercase fw-semibold mb-1">
                {title}
              </h6>
              <h4 className="mb-0 fw-bold">{value}</h4>
            </div>
            <div
              className={`text-${color} bg-${color} bg-opacity-10 p-3 rounded`}
            >
              <i className={`bi ${icon} fs-3`}></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="d-flex justify-content-center align-items-center h-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="alert alert-danger" role="alert">
          Gagal memuat data dashboard. Periksa koneksi atau server.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={"Dasboard"}>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h4">Dashboard</h1>
      </div>

      {/* 1. Statistics Cards */}
      <div className="row g-4 mb-4">
        <StatCard
          title="Total Revenue"
          value={formatRupiah(data?.revenue || 0)}
          icon="bi-cash-coin"
          color="success"
        />
        <StatCard
          title="Total Orders"
          value={data?.total_orders || 0}
          icon="bi-bag-check"
          color="primary"
        />
        <StatCard
          title="Products"
          value={data?.total_products || 0}
          icon="bi-box-seam"
          color="warning"
        />
        <StatCard
          title="Customers"
          value={data?.total_users || 0}
          icon="bi-people"
          color="info"
        />
      </div>

      {/* 2. Recent Orders Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold">Recent Orders</h5>
          <Link to="/admin-orders" className="btn btn-sm btn-outline-primary">
            View All
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.recent_orders?.length > 0 ? (
                data.recent_orders.map((order) => (
                  <tr key={order.id}>
                    <td className="fw-semibold text-primary">
                      #{order.invoice_number}
                    </td>
                    <td>{order.user_name || "Guest"}</td>
                    <td>
                      {new Date(order.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td>{formatRupiah(order.total_price)}</td>
                    <td>
                      <span
                        className={`badge rounded-pill bg-${
                          order.status === "completed"
                            ? "success"
                            : order.status === "pending"
                            ? "warning"
                            : order.status === "cancelled"
                            ? "danger"
                            : "secondary"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    Belum ada pesanan terbaru.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
