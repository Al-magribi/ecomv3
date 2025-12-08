import React, { useState, useEffect } from "react";
import AdminLayout from "../layout/AdminLayout";
import {
  useGetConfigsQuery,
  useSaveConfigsMutation,
} from "../../../service/config/ApiConfig";
import { toast } from "react-toastify";

// Import Components
import SideBar from "./SideBar";
import Input from "./Input";
import Profile from "./Profile"; // <--- Import Component Baru

const Config = () => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("all");
  const [categories, setCategories] = useState([]);
  const [groupedConfigs, setGroupedConfigs] = useState({});

  // Form States (untuk Config biasa)
  const [formValues, setFormValues] = useState({});
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});

  // --- API ---
  const { data, isLoading, isError } = useGetConfigsQuery();
  const [saveConfigs, { isLoading: isSaving }] = useSaveConfigsMutation();

  // --- EFFECT: Populate Data ---
  useEffect(() => {
    if (data) {
      // 1. Ambil list kategori unik dari Database
      let cats = [...new Set(data.map((item) => item.category))];

      // 2. TAMBAHKAN KATEGORI 'profile' SECARA MANUAL
      if (!cats.includes("profile")) {
        cats.push("profile");
      }

      if (!cats.includes("courier")) {
        cats.push("courier");
      }

      setCategories(cats);

      // Set default tab
      if (activeTab === "all" && cats.length > 0) {
        setActiveTab(cats[0]);
      }

      // 3. Grouping Configs
      const groups = {};
      const initialValues = {};
      const initialPreviews = {};

      data.forEach((item) => {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);

        initialValues[item.key] = item.value;
        if (item.type === "image") {
          initialPreviews[item.key] = item.value;
        }
      });

      setGroupedConfigs(groups);
      setFormValues(initialValues);
      setPreviews(initialPreviews);
    }
  }, [data]);

  // --- HANDLERS ---
  const handleInputChange = (e, key, type) => {
    const val =
      type === "boolean" ? e.target.checked.toString() : e.target.value;
    setFormValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleFileChange = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      setFiles((prev) => ({ ...prev, [key]: file }));
      setPreviews((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(formValues).forEach((key) =>
        formData.append(key, formValues[key])
      );
      Object.keys(files).forEach((key) => formData.append(key, files[key]));

      await saveConfigs(formData).unwrap();
      toast.success("Konfigurasi berhasil disimpan!");
      setFiles({});
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan konfigurasi.");
    }
  };

  if (isLoading) return <AdminLayout>Loading...</AdminLayout>;
  if (isError) return <AdminLayout>Error loading config.</AdminLayout>;

  return (
    <AdminLayout>
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <div>
          <h3 className='fw-bold mb-0'>Pengaturan Aplikasi</h3>
          <small className='text-muted'>
            Kelola konfigurasi sistem & profil
          </small>
        </div>

        {/* Tombol Simpan HANYA muncul jika bukan tab Profile */}
        {activeTab !== "profile" && (
          <button
            className='btn btn-primary'
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className='spinner-border spinner-border-sm me-2'></span>
                Menyimpan...
              </>
            ) : (
              <>
                <i className='bi bi-save me-2'></i>Simpan Perubahan
              </>
            )}
          </button>
        )}
      </div>

      <div className='row'>
        {/* --- Sidebar --- */}
        <div className='col-md-3 mb-4 mb-md-0'>
          <SideBar
            categories={categories}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        {/* --- Main Content --- */}
        <div className='col-md-9'>
          <div className='card border-0 shadow-sm'>
            <div className='card-header bg-white py-3 fw-bold text-capitalize border-bottom'>
              Konfigurasi {activeTab}
            </div>
            <div className='card-body p-4'>
              {/* --- KONDISI RENDER --- */}
              {activeTab === "profile" ? (
                // 1. Render Component Profile jika tab 'profile' aktif
                <Profile />
              ) : (
                // 2. Render Form Config biasa untuk tab lainnya
                <form onSubmit={handleSubmit}>
                  <div className='row g-4'>
                    {groupedConfigs[activeTab]?.map((config) => (
                      <div
                        className={`col-12 ${
                          ["text", "image"].includes(config.type)
                            ? "col-12"
                            : "col-md-6"
                        }`}
                        key={config.id}
                      >
                        <div className='mb-3'>
                          <label className='form-label fw-semibold'>
                            {config.description}
                            <span className='text-muted fw-normal ms-2 small opacity-50'>
                              ({config.key})
                            </span>
                          </label>
                          <Input
                            config={config}
                            value={formValues[config.key]}
                            preview={previews[config.key]}
                            onChange={handleInputChange}
                            onFileChange={handleFileChange}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Config;
