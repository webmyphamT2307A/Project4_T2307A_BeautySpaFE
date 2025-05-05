import React, { useState, useEffect } from 'react';
import Header from '../../shared/header';
import Footer from '../../shared/footer';

const itemsPerPage = 8;

const ProductPage = () => {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/v1/product');
        const result = await response.json();
        if (result.status === 'SUCCESS') {
          const activeProducts = result.data.filter(p => p.isActive);
          setProducts(activeProducts);
          setFiltered(activeProducts);
        } else {
          console.error(result.message);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let data = [...products];

    if (searchTerm) {
      data = data.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      data = data.filter(p => p.category === categoryFilter);
    }

    setFiltered(data);
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, products]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const displayed = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Styles for the zoom effect
  const imageWrapperStyle = {
    width: '100%',
    height: '200px',
    overflow: 'hidden', // Hide the parts of image that overflow
    position: 'relative',
  };

  const imageStyle = (isHovered) => ({
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: isHovered ? 'scale(1.2)' : 'scale(1)', // Zoom in when hovered
    transition: 'transform 0.3s ease', // Smooth transition
  });

  const [hoveredImage, setHoveredImage] = useState(null); // Track hovered image

  return (
    <div>
      <Header />

      {/* Breadcrumb & Title */}
      <div className="container-fluid bg-breadcrumb py-5">
        <div className="container text-center py-5">
          <h3 className="text-white display-3 mb-4">All Products</h3>
          <ol className="breadcrumb justify-content-center mb-0">
            <li className="breadcrumb-item"><a href="/">Home</a></li>
            <li className="breadcrumb-item"><a href="/shop">Shop</a></li>
            <li className="breadcrumb-item active text-white">All Products</li>
          </ol>
        </div>
      </div>

      <div className="container py-5">
        {/* Filter + Search */}
        <div className="row mb-4">
          <div className="col-md-4 mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-4 mb-2">
            <select
              className="form-select"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="row g-4">
            {displayed.map(product => (
              <div className="col-md-3" key={product.id}>
                <div className="card h-100 shadow-sm">
                  <div
                    style={imageWrapperStyle}
                    onMouseEnter={() => setHoveredImage(product.id)}
                    onMouseLeave={() => setHoveredImage(null)}
                  >
                    <img
                      src={product.imageUrl}
                      className="card-img-top"
                      alt={product.name}
                      style={imageStyle(hoveredImage === product.id)} // Apply zoom effect
                    />
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title text-truncate">{product.name}</h5>
                    <p className="card-text small" style={{ minHeight: '48px' }}>
                      {product.description?.slice(0, 60)}...
                    </p>
                    <p className="card-text text-danger fw-bold">
                      {product.price.toLocaleString()}$
                    </p>
                    <button className="btn btn-outline-primary mt-auto">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="text-center mt-4">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`btn btn-sm mx-1 ${currentPage === i + 1 ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductPage;