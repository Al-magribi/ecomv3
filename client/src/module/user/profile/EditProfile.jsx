import React, { useState, useEffect } from "react";
import { useUpdateProfileMutation } from "../../../service/auth/ApiAuth";
import { toast } from "react-toastify";

const EditProfile = ({ show, onClose, user }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "", // Opsional jika user ingin ganti password
  });

  const [updateProfile, { data, error, isLoading, isSuccess }] =
    useUpdateProfileMutation();

  // Isi form saat modal dibuka
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        email: user.email || "",
        password: "",
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();

    updateProfile(formData);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data.message);

      onClose();
    }

    if (error) {
      toast.error(error.data.message);
    }
  }, [data, error, isSuccess]);

  if (!show) return null;

  return (
    <div
      className='modal fade show d-block'
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className='modal-dialog'>
        <div className='modal-content'>
          <div className='modal-header'>
            <h5 className='modal-title'>Edit Profil</h5>
            <button
              type='button'
              className='btn-close'
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className='modal-body'>
              <div className='mb-3'>
                <label className='form-label'>Nama Lengkap</label>
                <input
                  type='text'
                  className='form-control'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className='mb-3'>
                <label className='form-label'>Nomor Telepon</label>
                <input
                  type='text'
                  className='form-control'
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className='mb-3'>
                <label className='form-label'>Email</label>
                <input
                  type='email'
                  className='form-control'
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className='mb-3'>
                <label className='form-label'>Ganti Password (Opsional)</label>
                <input
                  type='password'
                  className='form-control'
                  placeholder='Kosongkan jika tidak ingin mengubah'
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>
            <div className='modal-footer'>
              <button
                type='button'
                className='btn btn-secondary'
                onClick={onClose}
              >
                Batal
              </button>
              <button type='submit' className='btn btn-primary'>
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
