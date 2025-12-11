import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useSaveReviewMutation } from "../../../service/order/ApiReview";
import { toast } from "react-toastify";

const Review = ({ show, handleClose, product }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [SaveReview, { isLoading }] = useSaveReviewMutation();

  // Reset form saat modal dibuka
  useEffect(() => {
    if (show) {
      setRating(5);
      setComment("");
    }
  }, [show, product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;

    try {
      await createReview({
        product_id: product.product_id, // ID Produk dari item order
        rating: parseInt(rating),
        comment,
      }).unwrap();

      handleClose();
    } catch (err) {
      console.error(err);
    }
  };

  const renderStars = () => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1;
      return (
        <i
          key={index}
          className={`bi ${
            starValue <= rating
              ? "bi-star-fill text-warning"
              : "bi-star text-secondary"
          } fs-3 me-1`}
          style={{ cursor: "pointer" }}
          onClick={() => setRating(starValue)}
        ></i>
      );
    });
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Ulas Produk</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <div className='text-center mb-4'>
            <img
              src={product?.image || "https://via.placeholder.com/100"}
              alt={product?.product_name}
              className='rounded mb-2 border'
              style={{ width: "80px", height: "80px", objectFit: "cover" }}
            />
            <h6 className='fw-bold mt-2'>{product?.product_name}</h6>
            <small className='text-muted'>
              {product?.variant ? `Varian: ${product.variant}` : ""}
            </small>
          </div>

          <div className='mb-3 text-center'>
            <label className='form-label d-block fw-semibold'>
              Berikan Rating
            </label>
            <div>{renderStars()}</div>
          </div>

          <Form.Group className='mb-3'>
            <Form.Label className='fw-semibold'>Komentar</Form.Label>
            <Form.Control
              as='textarea'
              rows={3}
              placeholder='Ceritakan pengalamanmu menggunakan produk ini...'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleClose}>
            Batal
          </Button>
          <Button variant='primary' type='submit' disabled={isLoading}>
            {isLoading ? "Mengirim..." : "Kirim Review"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default Review;
