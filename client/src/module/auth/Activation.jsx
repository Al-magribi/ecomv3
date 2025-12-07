import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useActivateMutation } from "../../service/auth/ApiAuth";
import { toast } from "react-toastify";

const Activation = () => {
  const { code } = useParams();

  const [activate, { data, error, isLoading, isSuccess }] =
    useActivateMutation();

  useEffect(() => {
    activate({ code });
  }, [code]);

  useEffect(() => {
    if (isSuccess) {
      toast.success(data.message);
    }
    if (error) {
      console.log(error);
      toast.error(error.data.message);
    }
  }, [data, error, isSuccess]);

  return (
    <div className='vh-100 d-flex align-items-center justify-content-center bg-light'>
      <div
        className='card p-5 shadow-lg border-0 rounded-4 text-center'
        style={{ maxWidth: "450px" }}
      >
        {/* LOADING STATE */}
        {isLoading && (
          <div>
            <i
              className='bi bi-hourglass-split text-primary mb-3'
              style={{ fontSize: "4rem" }}
            />
            <h4 className='fw-bold'>Verifikasi...</h4>
          </div>
        )}

        {/* SUCCESS STATE */}
        {isSuccess && (
          <div>
            {/* ClassName sesuai permintaan Anda */}
            <i
              className='bi bi-check-circle-fill text-success mb-3'
              style={{ fontSize: "4rem" }}
            />
            <h4 className='fw-bold text-success'>Berhasil!</h4>
            <p className='text-muted mb-4'>{data.message}</p>
            <Link
              to='/signin'
              className='btn btn-primary w-100 rounded-3 fw-bold'
            >
              Ke Halaman Login
            </Link>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div>
            <i
              className='bi bi-x-circle-fill text-danger mb-3'
              style={{ fontSize: "4rem" }}
            />
            <h4 className='fw-bold text-danger'>Gagal</h4>
            <p className='text-muted mb-4'>
              {error.data.message || error.status}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Activation;
