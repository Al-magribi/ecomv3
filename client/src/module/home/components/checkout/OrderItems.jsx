import React from "react";

const OrderItems = ({ items, formatRupiah }) => {
  return (
    <div className='card shadow-sm border-0 mb-4'>
      <div className='card-header bg-white py-3'>
        <h5 className='mb-0 fw-bold'>
          <i className='bi bi-box-seam me-2'></i>Rincian Pesanan
        </h5>
      </div>
      <div className='card-body p-0'>
        <ul className='list-group list-group-flush'>
          {items.map((item, index) => (
            <li key={index} className='list-group-item py-3'>
              <div className='d-flex align-items-center'>
                <img
                  src={
                    item.image_url || "https://dummyimage.com/100x100/ccc/fff"
                  }
                  alt={item.product_name}
                  className='rounded me-3'
                  style={{
                    width: "60px",
                    height: "60px",
                    objectFit: "cover",
                  }}
                />
                <div className='flex-grow-1'>
                  <h6 className='mb-0 fw-bold text-dark'>
                    {item.product_name}
                  </h6>
                  <small className='text-muted'>
                    {item.quantity} x {formatRupiah(item.final_price)} (
                    {(item.weight || 1000) * item.quantity} gr)
                  </small>
                </div>
                <div className='fw-bold'>
                  {formatRupiah(item.quantity * item.final_price)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default OrderItems;
