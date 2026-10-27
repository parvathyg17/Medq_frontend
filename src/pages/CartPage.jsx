import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import './CartPage.css';

const CartPage = () => {
  const {
    cartItems,
    itemCount,
    subtotal,
    updateQuantity,
    removeFromCart,
    confirmRemoveFromCart,
    clearCart,
    confirmClearCart
  } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/confirm', {
      state: {
        cartItems: cartItems.map((item) => ({
          productId: item.productId || item.product?.id || item.id,
          productName: item.productName || item.product?.name,
          price: parseFloat(item.price || item.product?.price || 0),
          quantity: item.quantity,
          imageUrl: item.imageUrl
        })),
        totalAmount: subtotal
      }
    });
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page-wrap py-5">
        <div className="med-container">
          <div className="empty-cart-card">
            <div className="empty-cart-bubble">
              <ShoppingCart size={48} />
            </div>
            <h2>Your Shopping Cart is Empty</h2>
            <p>You currently have no medical equipment or clinical instruments in your cart.</p>
            <Link to="/equipments" className="btn btn-primary btn-lg mt-3">
              Explore Medical Equipment Catalog <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-wrap py-4">
      <div className="med-container">
        <div className="cart-page-header">
          <div>
            <h1 className="page-title">Shopping Cart</h1>
            <p className="page-subtitle">Review items, adjust quantities, and proceed to clinical checkout.</p>
          </div>
          <button className="clear-cart-text-btn" onClick={confirmClearCart}>
            Clear Entire Cart
          </button>
        </div>

        <div className="cart-layout-grid">
          {/* Items Table / List */}
          <div className="cart-items-table-card">
            <div className="cart-items-header-row">
              <span className="col-product">Medical Equipment</span>
              <span className="col-price">Unit Price</span>
              <span className="col-quantity">Quantity</span>
              <span className="col-total">Line Total</span>
              <span className="col-action"></span>
            </div>

            <div className="cart-items-body">
              {cartItems.map((item) => {
                const pId = item.productId || item.product?.id || item.id;
                const name = item.productName || item.product?.name || 'Equipment';
                const price = parseFloat(item.price || item.product?.price || 0);
                const lineTotal = price * item.quantity;
                const img = item.imageUrl || item.product?.imageUrl || '/images/medq2.jpg';

                return (
                  <div key={pId} className="cart-row-item">
                    <div className="col-product item-product-info">
                      <img
                        src={img}
                        alt={name}
                        className="item-thumbnail"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=60';
                        }}
                      />
                      <div className="item-text-info">
                        <Link to={`/product/${pId}`} className="item-name-link">
                          {name}
                        </Link>
                        {item.category && <span className="item-cat-badge">{item.category}</span>}
                      </div>
                    </div>

                    <div className="col-price">
                      <span className="mobile-label">Unit: </span>
                      ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>

                    <div className="col-quantity">
                      <div className="cart-qty-stepper">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(pId, item.quantity - 1, item.stock_quantity)}
                          disabled={item.quantity <= 1}
                          title="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-val">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => {
                            if (item.quantity >= 5) {
                              updateQuantity(pId, 6);
                              return;
                            }
                            updateQuantity(pId, item.quantity + 1, item.stock_quantity);
                          }}
                          disabled={item.quantity >= 5 || (item.stock_quantity && item.quantity >= item.stock_quantity)}
                          title={item.quantity >= 5 ? 'Max limit of 5 units reached' : 'Increase quantity'}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="col-total">
                      <span className="mobile-label">Total: </span>
                      <strong>₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>

                    <div className="col-action">
                      <button
                        className="remove-item-btn"
                        onClick={() => confirmRemoveFromCart(pId, name)}
                        title="Remove from Cart"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cart-table-footer">
              <Link to="/equipments" className="btn btn-outline btn-sm">
                <ArrowLeft size={16} /> Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="cart-summary-sidebar">
            <div className="med-card summary-card">
              <h3 className="summary-title">Order Summary</h3>

              <div className="summary-line">
                <span>Items Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                <span className="summary-value">₹{parseFloat(subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="summary-line">
                <span>Hospital & Clinic Shipping</span>
                <span className="free-shipping-tag">FREE</span>
              </div>

              <div className="summary-line">
                <span>Estimated Taxes (GST)</span>
                <span className="summary-value">Included</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-line total-line">
                <span>Total Amount</span>
                <span className="grand-total-value">₹{parseFloat(subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              <button className="btn btn-primary btn-lg w-100 mt-4 checkout-cta-btn" onClick={handleCheckout}>
                Proceed to Checkout <ArrowRight size={18} />
              </button>

              <div className="summary-guarantee-badge">
                <ShieldCheck size={18} className="text-teal" />
                <span>Encrypted PCI-Compliant Checkout & Atomic Stock Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
