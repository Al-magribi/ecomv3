import { useState, useEffect } from "react";

const ProductGallery = ({ images, productName }) => {
  const [activeImage, setActiveImage] = useState("");

  // Set gambar default saat data images masuk
  useEffect(() => {
    if (images && images.length > 0) {
      setActiveImage(images[0].link);
    }
  }, [images]);

  return (
    <div className='position-sticky' style={{ top: "100px" }}>
      {/* Gambar Utama */}
      <div className='rounded overflow-hidden mb-2 border'>
        <img
          src={activeImage || "https://via.placeholder.com/500"}
          alt={productName}
          className='img-fluid w-100 object-fit-cover'
          style={{ aspectRatio: "1/1" }}
        />
      </div>

      {/* Thumbnail List */}
      <div className='d-flex gap-2 overflow-auto'>
        {images?.map((img, idx) => (
          <img
            key={idx}
            src={img.link}
            alt={`Thumb ${idx}`}
            className={`rounded border ${
              activeImage === img.link ? "border-success border-2" : ""
            }`}
            style={{
              width: "60px",
              height: "60px",
              cursor: "pointer",
              objectFit: "cover",
            }}
            onMouseEnter={() => setActiveImage(img.link)}
            onClick={() => setActiveImage(img.link)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductGallery;
