import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useForgotPasswordMutation } from "../../service/auth/ApiAuth";

const ForgotPassword = ({ logo }) => {
  const [email, setEmail] = useState("");

  // Panggil Hook RTK
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Gunakan .unwrap() agar masuk ke catch block jika error
      const response = await forgotPassword({ email }).unwrap();
      toast.success(response.message);
      setEmail(""); // Reset form jika sukses
    } catch (err) {
      // Handle error dari backend
      const msg = err?.data?.message || "Gagal mengirim permintaan";
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
          <h4 className='fw-bold text-dark'>Lupa Password?</h4>
          <p className='text-muted small'>
            Masukkan email Anda untuk mereset password
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Input Email */}
          <div className='form-floating mb-3'>
            <input
              type='email'
              className='form-control rounded-3'
              id='floatingInput'
              placeholder='name@example.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label htmlFor='floatingInput'>Email Address</label>
          </div>

          {/* Button Send */}
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
                Mengirim...
              </>
            ) : (
              "Kirim Link Reset"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className='text-center mt-4'>
          <Link to='/signin' className='text-decoration-none small text-muted'>
            <i className='bi bi-arrow-left me-1'></i> Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
