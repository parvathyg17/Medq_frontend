import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  X,
  ShoppingCart,
  ArrowRight,
  PackageCheck
} from 'lucide-react';
import './CartModal.css';

const CartModal = ({ modal, onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (modal?.isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modal?.isOpen, onClose]);

  if (!modal || !modal.isOpen) return null;

  const {
    type = 'success',
    title,
    message,
    product,
    quantityAdded = 1,
    cartTotal,
    itemCount,
    onConfirm,
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  } = modal;

  const handleGoToCart = () => {
    onClose();
    navigate('/cart');
  };

  const pName = product?.name || product?.productName || 'Medical Equipment';
  const pPrice = parseFloat(product?.effective_price || product?.price || 0);
  const pImage = product?.imageUrl || product?.image_url || product?.image || '/images/medq2.jpg';

  return (
    <div className="cart-modal-backdrop animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cart-modal-shell med-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-modal-header">
          <div className="modal-title-cluster">
            {type === 'success' && <CheckCircle2 size={24} className="icon-success" />}
            {type === 'error' && <AlertCircle size={24} className="icon-error" />}
            {type === 'limit' && <AlertTriangle size={24} className="icon-warning" />}
            {type === 'confirm' && <HelpCircle size={24} className="icon-primary" />}
            <h3 className="cart-modal-title">
              {title || (type === 'success' ? 'Item Added to Cart' : 'Cart Alert')}
            </h3>
          </div>
          <button className="cart-modal-close" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="cart-modal-body">
          {/* Success Product Card */}
          {type === 'success' && product && (
            <div className="modal-product-preview">
              <div className="preview-image-box">
                <img
                  src={pImage}
                  alt={pName}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=60';
                  }}
                />
              </div>
              <div className="preview-info">
                <h4 className="preview-title">{pName}</h4>
                <div className="preview-meta">
                  <span className="preview-price">
                    ₹{pPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="preview-qty">Qty added: {quantityAdded}</span>
                </div>
                <div className="limit-rule-pill">
                  <PackageCheck size={13} />
                  <span>Order Limit: Maximum 5 units per item</span>
                </div>
              </div>
            </div>
          )}

          {/* Text Message */}
          {message && (
            <p className={`modal-desc-text ${type === 'error' ? 'text-danger-msg' : ''}`}>
              {message}
            </p>
          )}

          {/* Cart Status Summary on Success */}
          {type === 'success' && cartTotal !== undefined && (
            <div className="modal-cart-summary">
              <span>Cart Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'}):</span>
              <strong className="summary-total-amount">
                ₹{parseFloat(cartTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="cart-modal-footer">
          {type === 'success' && (
            <>
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Continue Shopping
              </button>
              <button type="button" className="btn btn-primary" onClick={handleGoToCart}>
                <ShoppingCart size={16} /> View Cart & Checkout <ArrowRight size={16} />
              </button>
            </>
          )}

          {(type === 'error' || type === 'limit') && (
            <>
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={handleGoToCart}>
                <ShoppingCart size={16} /> View My Cart
              </button>
            </>
          )}

          {type === 'confirm' && (
            <>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {cancelText}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  onClose();
                  if (onConfirm) onConfirm();
                }}
              >
                {confirmText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartModal;
