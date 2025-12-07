import React from "react";

const Footer = () => {
  return (
    <footer className='bg-dark text-white py-4 mt-auto'>
      <div className='container text-center'>
        <div className='d-flex gap-3 align-items-center justify-content-center'>
          <img
            src='/logo.png'
            alt='Logo'
            width='30'
            height='30'
            style={{ filter: "grayscale(100%)" }}
          />

          <p className='mb-0'>
            &copy; {new Date().getFullYear()} TokoApp. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
