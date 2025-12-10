import React, { useState } from "react";
import AdminLayout from "../layout/AdminLayout"; // Sesuaikan
import BackupNrestore from "./BackupNrestore";
import ManageDb from "./ManageDb";

const Database = () => {
  const [activeTab, setActiveTab] = useState("backup");

  return (
    <AdminLayout title={`Manajemen Database`}>
      <div className='container-fluid p-0'>
        {/* Nav Tabs Bootstrap */}
        <ul className='nav nav-tabs mb-4'>
          <li className='nav-item'>
            <button
              className={`nav-link ${
                activeTab === "backup" ? "active fw-bold" : ""
              }`}
              onClick={() => setActiveTab("backup")}
            >
              <i className='fas fa-hdd me-2'></i> Backup & Restore
            </button>
          </li>
          <li className='nav-item'>
            <button
              className={`nav-link ${
                activeTab === "manage" ? "active fw-bold" : ""
              }`}
              onClick={() => setActiveTab("manage")}
            >
              <i className='fas fa-database me-2'></i> Manage Tables
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        <div className='tab-content'>
          {activeTab === "backup" && (
            <div className='fade show active'>
              <BackupNrestore />
            </div>
          )}

          {activeTab === "manage" && (
            <div className='fade show active'>
              <ManageDb />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Database;
