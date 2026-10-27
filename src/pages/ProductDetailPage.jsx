import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  ShieldCheck,
  Award,
  Truck,
  Check,
  ArrowLeft,
  Minus,
  Plus,
  Share2
} from 'lucide-react';
import { productsApi, wishlistApi } from '../api';
import { useCart } from '../context/CartContext';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);

  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productsApi.getProductById(id);
        setProduct(data);
      } catch (err) {
        setError(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="med-container py-5 text-center">
        <div className="pulse-loader"></div>
        <p className="mt-3 text-muted">Loading equipment specifications...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="med-container py-5 text-center">
        <h2>Equipment Not Found</h2>
        <p className="text-muted">{error || 'The requested product does not exist or has been archived.'}</p>
        <Link to="/equipments" className="btn btn-primary mt-3">
          <ArrowLeft size={16} /> Return to Catalog
        </Link>
      </div>
    );
  }

  const price = parseFloat(product.effective_price || product.price);
  const originalPrice = product.discount_price && parseFloat(product.price) > price ? parseFloat(product.price) : null;
  const stock = product.stock_quantity ?? product.quantity ?? 0;
  const isOutOfStock = stock <= 0;

  const handleAddToCart = async () => {
    if (adding) return;
    setAdding(true);
    const success = await addToCart(product, quantity);
    setAdding(false);
    if (success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }
  };

  const handleToggleWishlist = async () => {
    try {
      if (!inWishlist) {
        await wishlistApi.addItem(product.id);
        setInWishlist(true);
      } else {
        await wishlistApi.removeItem(product.id);
        setInWishlist(false);
      }
    } catch (e) {
      console.warn(e.message);
    }
  };

  const imageUrl = product.imageUrl || product.image_url || '/images/medq2.jpg';

  return (
    <div className="product-detail-page">
      <div className="med-container py-4">
        {/* Breadcrumb Navigation */}
        <div className="detail-breadcrumb">
          <Link to="/">Home</Link> /{' '}
          <Link to="/equipments">Equipment</Link> /{' '}
          <Link to={`/category/${product.category_slug || product.category_name}`}>
            {product.category_name || product.category?.name || 'Department'}
          </Link>{' '}
          / <span className="active-item">{product.name}</span>
        </div>

        <div className="product-detail-layout">
          {/* Left Column: Product Imagery */}
          <div className="detail-media-card">
            <div className="main-display-image-wrap">
              <img
                src={imageUrl}
                alt={product.name}
                className="main-display-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            {/* Certifications strip */}
            <div className="detail-cert-strip">
              <div className="cert-item">
                <ShieldCheck size={20} className="text-teal" />
                <span>CE Certified Device</span>
              </div>
              <div className="cert-item">
                <Award size={20} className="text-primary" />
                <span>1-Year Biomedical Guarantee</span>
              </div>
              <div className="cert-item">
                <Truck size={20} className="text-emerald" />
                <span>Express Clinic Shipping</span>
              </div>
            </div>
          </div>

          {/* Right Column: Information, Pricing & Action */}
          <div className="detail-info-card">
            <div className="detail-brand-row">
              <span className="brand-tag">{product.brand || 'MedQ Certified'}</span>
              <span className="sku-tag">SKU: {product.sku}</span>
            </div>

            <h1 className="detail-title">{product.name}</h1>

            {/* Stock Pill */}
            <div className="stock-status-row">
              {isOutOfStock ? (
                <span className="badge badge-danger">Out of Stock</span>
              ) : stock <= 5 ? (
                <span className="badge badge-warning">Low Stock ({stock} Units Remaining)</span>
              ) : (
                <span className="badge badge-success">In Stock & Ready for Dispatch ({stock} units)</span>
              )}
            </div>

            {/* Price Box */}
            <div className="detail-price-box">
              <span className="detail-current-price">₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              {originalPrice && (
                <>
                  <span className="detail-original-price">₹{originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  <span className="discount-tag">Save ₹{(originalPrice - price).toFixed(0)}</span>
                </>
              )}
              <span className="tax-inclusive-tag">All taxes included. Free shipping.</span>
            </div>

            <div className="detail-description-block">
              <h3>Equipment Overview</h3>
              <p>{product.description}</p>
            </div>

            {/* Quantity Stepper & Add to Cart */}
            <div className="purchase-control-block">
              <div className="d-flex flex-column">
                <div className="quantity-stepper">
                  <button
                    className="step-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    title="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="step-number">{quantity}</span>
                  <button
                    className="step-btn"
                    onClick={() => {
                      if (quantity >= 5) {
                        return;
                      }
                      setQuantity((q) => Math.min(Math.min(5, stock), q + 1));
                    }}
                    disabled={quantity >= Math.min(5, stock) || isOutOfStock}
                    title={quantity >= 5 ? 'Max limit of 5 units reached' : 'Increase quantity'}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-secondary mt-1" style={{ fontSize: '0.725rem' }}>
                  Max limit: 5 units
                </span>
              </div>

              <button
                className={`btn btn-primary btn-lg add-to-cart-large ${justAdded ? 'added' : ''}`}
                onClick={handleAddToCart}
                disabled={isOutOfStock || adding}
              >
                {isOutOfStock ? (
                  'Out of Stock'
                ) : justAdded ? (
                  <>
                    <Check size={20} /> Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} /> Add to Cart
                  </>
                )}
              </button>

              <button
                className={`btn btn-outline wishlist-action-icon-btn ${inWishlist ? 'active' : ''}`}
                onClick={handleToggleWishlist}
                title="Add to Wishlist"
              >
                <Heart size={20} fill={inWishlist ? '#ef4444' : 'none'} color={inWishlist ? '#ef4444' : 'currentColor'} />
              </button>
            </div>

            {/* Procurement Assistance Notice */}
            <div className="institutional-help-box">
              <h4>Need a Hospital Purchase Order or Custom Calibration?</h4>
              <p>Contact our biomedical engineering support team for formal RFP bids and institutional warranties.</p>
              <div className="mt-2">
                <Link to="/chat" className="btn btn-outline btn-sm">
                  Consult Biomedical Specialist
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
