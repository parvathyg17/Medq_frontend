import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { wishlistApi } from '../api';
import { useCart } from '../context/CartContext';
import './WishlistPage.css';

const WishlistPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const data = await wishlistApi.getWishlist();
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.warn('Error loading wishlist:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await wishlistApi.removeItem(productId);
      setItems((prev) => prev.filter((i) => (i.product?.id || i.product_id) !== productId));
    } catch (e) {
      alert(e.message || 'Failed to remove from wishlist');
    }
  };

  const handleMoveToCart = async (product) => {
    await addToCart(product, 1);
    await handleRemove(product.id || product.productId);
  };

  if (loading) {
    return (
      <div className="med-container py-5 text-center">
        <div className="pulse-loader"></div>
        <p className="mt-3 text-muted">Loading your saved equipment...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="wishlist-page py-5">
        <div className="med-container">
          <div className="empty-wishlist-card med-card text-center py-5">
            <Heart size={64} className="empty-wishlist-icon" />
            <h2>Your Wishlist is Empty</h2>
            <p>Save clinical diagnostic tools and medical supplies here for upcoming procurement rounds.</p>
            <Link to="/equipments" className="btn btn-primary btn-lg mt-3">
              Browse Equipment Catalog <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page py-4">
      <div className="med-container">
        <div className="wishlist-header">
          <div>
            <h1 className="page-title"><Heart className="icon-mr text-danger" /> Saved Medical Equipment</h1>
            <p className="page-subtitle">Saved equipment for quick review and one-click purchase.</p>
          </div>
          <span className="badge badge-info">{items.length} {items.length === 1 ? 'item' : 'items'} saved</span>
        </div>

        <div className="wishlist-grid">
          {items.map((item) => {
            const product = item.product || {};
            const pId = product.id || item.product_id;
            const price = parseFloat(product.effective_price || product.price || 0);
            const img = product.imageUrl || product.image_url || '/images/medq2.jpg';

            return (
              <div key={item.id} className="wishlist-card med-card">
                <div className="wishlist-img-wrap">
                  <img
                    src={img}
                    alt={product.name}
                    className="wishlist-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=60';
                    }}
                  />
                  <button
                    className="delete-wishlist-btn"
                    onClick={() => handleRemove(pId)}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="wishlist-body">
                  <span className="wishlist-cat">{product.category_name || product.category || 'Clinical'}</span>
                  <h3>
                    <Link to={`/product/${product.slug || pId}`} className="wishlist-prod-title">
                      {product.name}
                    </Link>
                  </h3>
                  <div className="wishlist-price">
                    ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>

                  <div className="wishlist-actions mt-3">
                    <button
                      className="btn btn-primary w-100 btn-sm"
                      onClick={() => handleMoveToCart(product)}
                      disabled={product.stock_quantity <= 0}
                    >
                      <ShoppingCart size={15} /> Move to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
