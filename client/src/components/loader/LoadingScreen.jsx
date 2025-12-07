import React from "react";

const LoadingScreen = () => {
  return (
    <div className='vh-100 d-flex flex-column align-items-center gap-3 justify-content-center'>
      <div className='spinner-border text-primary' role='status'>
        <span className='visually-hidden'>Loading...</span>
      </div>

      <strong role='status'>Memuat Data ...</strong>
    </div>
  );
};

export default LoadingScreen;
