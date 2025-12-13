import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useResetPasswordMutation } from "../../service/auth/ApiAuth";

const ResetPassword = ({ logo }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // Ambil token dari URL

  // Panggil Hook RTK
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validasi Frontend Dasar
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Konfirmasi password tidak cocok!");
      return;
    }

    if (!token) {
      toast.error(
        "Token tidak ditemukan. Silakan request ulang link dari email."
      );
      return;
    }

    try {
      // 2. Request ke Backend via RTK
      const payload = {
        token: token,
        newPassword: formData.newPassword,
      };

      const response = await resetPassword(payload).unwrap();

      toast.success(response.message);

      // 3. Redirect ke Login setelah sukses
      setTimeout(() => {
        navigate("/signin");
      }, 2000);
    } catch (err) {
      const msg = err?.data?.message || "Gagal mereset password";
      toast.error(msg);
    }
  };

  return (
    <div className='vh-100 d-flex align-items-center justify-content-center bg-light'>
      <div
        className='card p-4 m-3 shadow-lg border-0 rounded-4'
        style={{ maxWidth: "400px", width: "100%" }}
      >
        {/* Header */}
        <div className='text-center mb-4'>
          {logo && <img src={logo} alt='logo' width={100} className='mb-2' />}
          <h4 className='fw-bold text-dark'>Reset Password</h4>
          <p className='text-muted small'>Silakan buat password baru Anda</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div className='form-floating mb-3'>
            <input
              type='password'
              className='form-control rounded-3'
              id='newPassword'
              placeholder='Password Baru'
              name='newPassword'
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength={6}
            />
            <label htmlFor='newPassword'>Password Baru</label>
          </div>

          {/* Confirm Password */}
          <div className='form-floating mb-3'>
            <input
              type='password'
              className='form-control rounded-3'
              id='confirmPassword'
              placeholder='Konfirmasi Password'
              name='confirmPassword'
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <label htmlFor='confirmPassword'>Konfirmasi Password</label>
          </div>

          {/* Button Submit */}
          <button
            type='submit'
            className='btn btn-primary w-100 py-2 rounded-3 fw-bold shadow-sm'
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span
                  className='spinner-border spinner-border-sm me-2'
                  role='status'
                  aria-hidden='true'
                ></span>
                Memproses...
              </>
            ) : (
              "Simpan Password Baru"
            )}
          </button>
        </form>

        {/* Helper Note jika token hilang */}
        {!token && (
          <div className='alert alert-warning mt-3 small'>
            Warning: Token tidak terdeteksi di URL. Pastikan Anda mengklik link
            langsung dari email Anda.
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
