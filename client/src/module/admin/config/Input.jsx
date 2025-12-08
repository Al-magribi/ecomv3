import React, { useState } from "react";

const Input = ({ config, value, preview, onChange, onFileChange }) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    onChange(e, config.key, config.type);
  };

  switch (config.type) {
    case "text": // Textarea
      return (
        <textarea
          className='form-control'
          rows='3'
          value={value || ""}
          onChange={handleChange}
        ></textarea>
      );

    case "boolean": // Switch
      return (
        <div className='form-check form-switch'>
          <input
            className='form-check-input'
            type='checkbox'
            role='switch'
            id={config.key}
            checked={value === "true"}
            onChange={handleChange}
          />
          <label className='form-check-label text-muted' htmlFor={config.key}>
            {value === "true" ? "Aktif (True)" : "Nonaktif (False)"}
          </label>
        </div>
      );

    case "image": // File Upload
      return (
        <div className='d-flex align-items-center gap-3'>
          <div
            className='border rounded p-1 bg-light d-flex align-items-center justify-content-center'
            style={{ width: "60px", height: "60px" }}
          >
            <img
              src={preview || "https://via.placeholder.com/60?text=IMG"}
              alt='Preview'
              className='w-100 h-100 object-fit-cover rounded'
            />
          </div>
          <div className='flex-grow-1'>
            <input
              type='file'
              className='form-control'
              accept='image/*'
              onChange={(e) => onFileChange(e, config.key)}
            />
            <small
              className='text-muted d-block mt-1'
              style={{ fontSize: "0.75rem" }}
            >
              Upload gambar baru untuk mengganti.
            </small>
          </div>
        </div>
      );

    case "password":
      return (
        <div className='input-group'>
          <input
            type={showPassword ? "text" : "password"}
            className='form-control'
            value={value || ""}
            onChange={handleChange}
            autoComplete='new-password'
          />
          <span
            className='input-group-text bg-white text-muted'
            style={{ cursor: "pointer" }} // Tambahkan cursor pointer
            onClick={() => setShowPassword(!showPassword)} // 4. Fungsi Toggle
          >
            {/* 5. Ganti Icon sesuai state agar user tahu statusnya */}
            <i className={`bi ${showPassword ? "bi-eye" : "bi-eye-slash"}`}></i>
          </span>
        </div>
      );

    case "number":
      return (
        <input
          type='number'
          className='form-control'
          value={value || ""}
          onChange={handleChange}
        />
      );

    default: // String
      return (
        <input
          type='text'
          className='form-control'
          value={value || ""}
          onChange={handleChange}
          disabled={config.key === "shipping_origin"}
        />
      );
  }
};

export default Input;
