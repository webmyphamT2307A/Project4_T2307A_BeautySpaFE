import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../shared/header';
import Footer from '../../shared/footer';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // Lấy chi tiết sản phẩm
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/v1/product/findById?Pid=${id}`);
        const result = await response.json();
        if (result.status === 'SUCCESS') {
          setProduct(result.data);
        } else {
          console.error(result.message);
        }
      } catch (error) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Lấy sản phẩm liên quan (lọc theo category)
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/v1/product`);
        const result = await response.json();
        if (result.status === 'SUCCESS' && product) {
          const filtered = result.data.filter(
            (p) => p.category === product.category && p.id !== product.id
          );
          setRelatedProducts(filtered);
        }
      } catch (error) {
        console.error('Lỗi khi tải sản phẩm liên quan:', error);
      }
    };

    if (product) {
      fetchRelatedProducts();
    }
  }, [product]);

  const handleAddToCart = () => {
    // Logic thêm vào giỏ hàng
    console.log(`Đã thêm ${quantity} sản phẩm "${product.name}" vào giỏ hàng.`);
  };

  if (loading) {
    return <div className="text-center py-5">Đang tải...</div>;
  }

  if (!product) {
    return <div className="text-center py-5">Không tìm thấy sản phẩm.</div>;
  }

  return (
    <div>
      <Header />
      <div className="container py-5">
        <div className="row mb-5">
          <div className="col-md-6">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="img-fluid"
              style={{ objectFit: 'cover', maxHeight: '500px' }}
            />
          </div>
          <div className="col-md-6">
            <h3>{product.name}</h3>
            <p className="text-muted">{product.category}</p>
            <p className="text-danger fs-4">
              {product.price.toLocaleString()}$
            </p>

            <div className="d-flex mb-4">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </button>
              <input
                type="number"
                className="form-control mx-2"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                style={{ width: '80px' }}
              />
              <button
                className="btn btn-outline-secondary"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>

            <button className="btn btn-primary" onClick={handleAddToCart}>
              Thêm vào giỏ hàng
            </button>

            <div className="mt-4">
              <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                Quay lại
              </button>
            </div>
          </div>
        </div>

        {/* Mô tả chi tiết */}
        <div className="mb-5">
          <h4 className="mb-3">Mô tả sản phẩm</h4>
          <p style={{ whiteSpace: 'pre-line' }}>{product.description}</p>
        </div>

        {/* Sản phẩm liên quan */}
        <div>
          <h4 className="mb-3">Sản phẩm liên quan</h4>
          <div className="row">
            {relatedProducts.length === 0 ? (
              <p>Không có sản phẩm liên quan.</p>
            ) : (
              relatedProducts.map((item) => (
                <div className="col-md-3 mb-4" key={item.id}>
                  <div className="card h-100">
                    <img
                      src={item.imageUrl}
                      className="card-img-top"
                      alt={item.name}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <div className="card-body d-flex flex-column">
                      <h6 className="card-title">{item.name}</h6>
                      <p className="text-danger">
                        {item.price.toLocaleString()}$
                      </p>
                      <button
                        className="btn btn-outline-primary mt-auto"
                        onClick={() => navigate(`/product/${item.id}`)}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
