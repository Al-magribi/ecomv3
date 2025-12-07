import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useDoSignupMutation,
  useLoadUserQuery,
} from "../../service/auth/ApiAuth";
import { toast } from "react-toastify";

const Signup = () => {
  const [DoSignup, { data, error, isLoading, isSuccess }] =
    useDoSignupMutation();

  // 1. State untuk menampung input user
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confPassword: "",
  });

  // Handle perubahan input
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confPassword) {
      toast.error("Password tidak sama");
      return;
    }

    const data = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
    };

    DoSignup(data);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data.message);
      setFormData({
        name: "",
        email: "",
        password: "",
        confPassword: "",
      });
    }

    if (error) {
      toast.error(error.data.message);
    }
  }, [data, error, isSuccess]);

  return (
    <div className='vh-100 d-flex align-items-center justify-content-center bg-light'>
      {/* Card dengan shadow modern dan border rounded */}
      <div
        className='card p-4 m-3 shadow-lg border-0 rounded-4'
        style={{ maxWidth: "400px", width: "100%" }}
      >
        {/* Header Logo */}
        <div className='text-center mb-4'>
          <img
            src='/logo.png'
            alt='logo toserba'
            width={100}
            className='mb-2'
          />
          <h4 className='fw-bold text-dark'>Buat Akun Baru</h4>
          <p className='text-muted small'>
            Daftar untuk memulai aplikasi Toserba
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Input Name - Floating Label */}
          <div className='form-floating mb-3'>
            <input
              type='text'
              className='form-control rounded-3'
              id='floatingName'
              placeholder='Nama Lengkap'
              name='name'
              value={formData.name}
              onChange={handleChange}
              required
            />
            <label htmlFor='floatingName'>Nama Lengkap</label>
          </div>

          {/* Input Email - Floating Label */}
          <div className='form-floating mb-3'>
            <input
              type='email'
              className='form-control rounded-3'
              id='floatingEmail'
              placeholder='name@example.com'
              name='email'
              value={formData.email}
              onChange={handleChange}
              required
            />
            <label htmlFor='floatingEmail'>Email Address</label>
          </div>

          {/* Input Password */}
          <div className='form-floating mb-3'>
            <input
              type='password'
              className='form-control rounded-3'
              id='floatingPassword'
              placeholder='Password'
              name='password'
              value={formData.password}
              onChange={handleChange}
              required
            />
            <label htmlFor='floatingPassword'>Password</label>
          </div>

          {/* Input Confirm Password */}
          <div className='form-floating mb-4'>
            <input
              type='password'
              className={`form-control rounded-3 ${error ? "is-invalid" : ""}`}
              id='floatingConfPassword'
              placeholder='Confirm Password'
              name='confPassword'
              value={formData.confPassword}
              onChange={handleChange}
              required
            />
            <label htmlFor='floatingConfPassword'>Ulangi Password</label>
          </div>

          {/* Button Submit dengan Loading Indicator */}
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
                Loading...
              </>
            ) : (
              "Daftar Sekarang"
            )}
          </button>
        </form>

        {/* Footer Link ke Login */}
        <div className='text-center mt-4'>
          <p className='small text-muted mb-0'>
            Sudah punya akun?{" "}
            <Link to='/signin' className='text-decoration-none fw-bold'>
              Login disini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
