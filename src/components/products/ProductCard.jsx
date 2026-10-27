import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Check, Eye } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { wishlistApi } from '../../api';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);

  const price = parseFloat(product.effective_price || product.price || 0);
  const originalPrice = product.discount_price && parseFloat(product.price) > price ? parseFloat(product.price) : null;
  const stock = product.stock_quantity ?? product.quantity ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (adding) return;

    setAdding(true);
    const success = await addToCart(product, 1);
    setAdding(false);
    if (success) {
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    try {
      if (!inWishlist) {
        await wishlistApi.addItem(product.id || product.productId);
        setInWishlist(true);
      } else {
        await wishlistApi.removeItem(product.id || product.productId);
        setInWishlist(false);
      }
    } catch (err) {
      console.warn('Wishlist toggle error:', err.message);
    }
  };

  const imageUrl = product.imageUrl || product.image_url || '/images/medq2.jpg';

  return (
    <div className={`med-product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      {/* Product Image & Badges */}
      <div className="card-image-wrap">
        <Link to={`/product/${product.slug || product.id}`}>
          <img
            src={imageUrl}
            alt={product.name}
            className="product-img"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60';
            }}
          />
        </Link>

        {/* Category Pill */}
        <span className="card-cat-badge">
          {product.category_name || product.category?.name || product.category || 'Clinical'}
        </span>

        {/* Stock Status Badge */}
        {isOutOfStock ? (
          <span className="stock-badge badge-danger">Out of Stock</span>
        ) : isLowStock ? (
          <span className="stock-badge badge-warning">Only {stock} Left</span>
        ) : null}

        {/* Floating Wishlist Button */}
        <button
          className={`wishlist-float-btn ${inWishlist ? 'active' : ''}`}
          onClick={handleToggleWishlist}
          title="Save to Wishlist"
          aria-label="Save to Wishlist"
        >
          <Heart size={16} fill={inWishlist ? '#ef4444' : 'none'} color={inWishlist ? '#ef4444' : '#64748b'} />
        </button>
      </div>

      {/* Card Content */}
      <div className="card-body-wrap">
        <div className="brand-sku-row">
          <span className="product-brand">{product.brand || 'MedQ Certified'}</span>
          {product.sku && <span className="product-sku">SKU: {product.sku}</span>}
        </div>

        <h3 className="product-title-link">
          <Link to={`/product/${product.slug || product.id}`} title={product.name}>
            {product.name}
          </Link>
        </h3>

        <p className="product-desc-snippet">{product.description}</p>

        {/* Price & Action Row */}
        <div className="card-footer-action">
          <div className="price-block">
            <span className="current-price">₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            {originalPrice && (
              <span className="original-price">₹{originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            )}
          </div>

          <button
            className={`add-cart-btn ${isOutOfStock ? 'btn-out-of-stock' : ''} ${justAdded ? 'added' : ''}`}
            onClick={handleAddToCart}
            disabled={adding}
            title={isOutOfStock ? 'Item is out of stock' : 'Add to cart'}
          >
            {isOutOfStock ? (
              'Out of Stock'
            ) : justAdded ? (
              <>
                <Check size={16} /> Added
              </>
            ) : (
              <>
                <ShoppingCart size={16} /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
