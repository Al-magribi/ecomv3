import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  useDoSigninMutation,
  useLoadUserQuery,
} from "../../service/auth/ApiAuth";
import { toast } from "react-toastify";
import { setSignIn } from "../../utils/authentication";

const Signin = () => {
  const navigate = useNavigate();

  const [DoSignin, { data, error, isLoading, isSuccess }] =
    useDoSigninMutation();
  const { refetch } = useLoadUserQuery(!isSuccess, { skip: !isSuccess });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const data = {
      email: formData.email,
      password: formData.password,
    };

    DoSignin(data);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data.message);
      setFormData({
        email: "",
        password: "",
      });
      setSignIn();
    }

    if (error) {
      toast.error(error.data.message);
    }
  }, [data, error, isSuccess]);

  return (
    <div className='vh-100 d-flex align-items-center justify-content-center bg-light'>
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
          <h4 className='fw-bold text-dark'>Selamat Datang</h4>
          <p className='text-muted small'>Silakan login untuk melanjutkan</p>
        </div>

        <form onSubmit={handleLogin}>
          {/* Input Email */}
          <div className='form-floating mb-3'>
            <input
              type='email'
              className='form-control rounded-3'
              id='floatingInput'
              placeholder='name@example.com'
              name='email'
              value={formData.email}
              onChange={handleChange}
              required
            />
            <label htmlFor='floatingInput'>Email Address</label>
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

          {/* Forgot Password Link */}
          <div className='d-flex justify-content-end mb-3'>
            <Link
              to='/forgot-password'
              style={{ fontSize: "0.9rem" }}
              className='text-decoration-none text-primary'
            >
              Lupa Password?
            </Link>
          </div>

          {/* Button Login */}
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
              "Masuk"
            )}
          </button>
        </form>

        {/* Footer ke Register */}
        <div className='text-center mt-4'>
          <p className='small text-muted mb-0'>
            Belum punya akun?{" "}
            <Link to='/signup' className='text-decoration-none fw-bold'>
              Daftar disini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signin;
