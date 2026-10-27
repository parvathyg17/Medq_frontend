import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  ArrowLeft,
  Lock,
  Smartphone,
  ShoppingCart,
  MapPin,
  Plus,
  Star,
  Building2
} from 'lucide-react';
import { ordersApi, authApi } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems: contextCartItems, clearCart, refreshCart } = useCart();
  const { user } = useAuth();

  // Load items from location.state, fallback to Context, fallback to user-scoped localStorage
  const getInitialCheckoutItems = () => {
    if (location.state?.cartItems && location.state.cartItems.length > 0) {
      return location.state.cartItems;
    }
    if (contextCartItems && contextCartItems.length > 0) {
      return contextCartItems;
    }
    try {
      localStorage.removeItem('medq_cart_items');
      const activeKey = user?.id ? `medq_cart_user_${user.id}` : 'medq_cart_guest';
      const stored = localStorage.getItem(activeKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const checkoutItems = getInitialCheckoutItems();

  // Form State
  const [formData, setFormData] = useState({
    deliveryName: user?.full_name || user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phone || '',
    address: '',
    landmark: '',
    pinCode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successOrder, setSuccessOrder] = useState(null);

  // Address Book state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isNewAddress, setIsNewAddress] = useState(false);
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);
  const [setAsDefaultAfterOrder, setSetAsDefaultAfterOrder] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const applyAddress = (addr) => {
    if (!addr) return;
    setFormData((prev) => ({
      ...prev,
      deliveryName: addr.full_name || prev.deliveryName,
      phoneNumber: addr.phone || prev.phoneNumber,
      address: addr.address_line || '',
      landmark: addr.landmark || '',
      pinCode: addr.pin_code || ''
    }));
  };

  const loadSavedAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const data = await authApi.getAddresses();
      const list = Array.isArray(data) ? data : data?.results || [];
      setSavedAddresses(list);
      if (list.length > 0) {
        const def = list.find((a) => a.is_default) || list[0];
        setSelectedAddressId(def.id);
        setIsNewAddress(false);
        applyAddress(def);
      } else {
        setIsNewAddress(true);
      }
    } catch (err) {
      console.error('Failed to load saved addresses in checkout:', err);
      setIsNewAddress(true);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Auto-populate when user is authenticated
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        deliveryName: prev.deliveryName || user.full_name || user.name || '',
        email: prev.email || user.email || '',
        phoneNumber: prev.phoneNumber || user.phone || '',
      }));
      loadSavedAddresses();
    }
  }, [user]);

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setIsNewAddress(false);
    applyAddress(addr);
  };

  const handleChooseNewAddress = () => {
    setSelectedAddressId(null);
    setIsNewAddress(true);
    setFormData((prev) => ({
      ...prev,
      deliveryName: user?.full_name || user?.name || '',
      phoneNumber: user?.phone || '',
      address: '',
      landmark: '',
      pinCode: ''
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardDetails((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.deliveryName.trim()) return 'Please enter your full recipient name or department.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Please provide a valid clinical or business email address.';
    
    const cleanPhone = formData.phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) return 'Please enter a valid telephone or mobile number (at least 10 digits).';
    if (!formData.address.trim()) return 'Please enter the complete hospital or clinic delivery address.';
    if (!formData.pinCode.trim() || formData.pinCode.trim().length < 4) return 'Please enter a valid PIN or postal code.';

    if (paymentMethod === 'creditCard') {
      if (!cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiryDate || !cardDetails.cvv) {
        return 'Please complete all credit/debit card details.';
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        return 'Please enter a valid UPI ID (e.g., clinic@okhdfcbank).';
      }
    }

    return null;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const payload = {
      deliveryDetails: {
        deliveryName: formData.deliveryName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        landmark: formData.landmark || '',
        pinCode: formData.pinCode,
        saveAddress: isNewAddress ? saveAddressForFuture : false,
        isDefault: isNewAddress ? setAsDefaultAfterOrder : false,
      },
      cartItems: checkoutItems.map((item) => ({
        productId: item.productId || item.product?.id || item.id,
        quantity: item.quantity || 1,
      })),
      paymentMethod,
      paymentDetails: paymentMethod === 'creditCard' ? cardDetails : { upiId }
    };

    try {
      setLoading(true);
      const res = await ordersApi.confirmOrder(payload);
      if (res.success || res.order || res.id) {
        setSuccessOrder(res.order || res);
        await clearCart();
      } else {
        setError(res.error || res.message || 'Failed to confirm order. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Something went wrong while processing your order.');
    } finally {
      setLoading(false);
    }
  };

  if (successOrder) {
    return (
      <div className="checkout-page py-5">
        <div className="med-container">
          <div className="order-success-card animate-fade-in">
            <div className="success-icon-wrapper">
              <CheckCircle2 size={54} />
            </div>
            <h2>Order Placed Successfully!</h2>
            <p className="order-number-badge">
              Order #{successOrder.orderNumber || successOrder.order_number || successOrder.id}
            </p>
            <p className="order-success-desc">
              Thank you for ordering with MEDQ. A certified biomedical packing team is preparing
              your equipment for hospital dispatch.
            </p>

            <div className="success-actions mt-4">
              <Link to="/myorders" className="btn btn-primary btn-lg">
                View My Orders & Track Delivery <ArrowRight size={18} />
              </Link>
              <Link to="/equipments" className="btn btn-outline btn-lg">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty cart view without infinite redirect
  if (checkoutItems.length === 0) {
    return (
      <div className="checkout-page py-5">
        <div className="med-container text-center">
          <div className="empty-cart-card" style={{ maxWidth: '540px', margin: '0 auto', background: '#ffffff', padding: '3rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--primary-50)', color: 'var(--primary-600)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <ShoppingCart size={32} />
            </div>
            <h3 className="font-heading">Your Checkout Cart is Empty</h3>
            <p className="text-secondary mt-2">
              Select diagnostic devices or clinical equipment from our catalog before checking out.
            </p>
            <div className="d-flex justify-content-center gap-3 mt-4">
              <Link to="/equipments" className="btn btn-primary">
                Explore Equipment Catalog
              </Link>
              <Link to="/cart" className="btn btn-outline">
                View Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const subtotalComputed = checkoutItems.reduce(
    (acc, item) => acc + (item.quantity || 1) * (parseFloat(item.price || item.product?.price || 0)),
    0
  );

  return (
    <div className="checkout-page py-4">
      <div className="med-container">
        <div className="checkout-header-block mb-4">
          <div className="d-flex align-items-center gap-2 mb-2">
            <Link to="/cart" className="text-secondary d-flex align-items-center gap-1 text-sm">
              <ArrowLeft size={16} /> Back to Cart
            </Link>
          </div>
          <h1 className="h2 font-heading">Complete Equipment Checkout</h1>
          <p className="text-secondary text-sm">
            Please enter your facility shipping destination and preferred payment method.
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-4 animate-shake">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder}>
          <div className="checkout-layout-grid">
            {/* Left: Shipping & Payment Details */}
            <div className="checkout-main-form">
              {/* Shipping Section */}
              <div className="med-card mb-4">
                <div className="card-section-header d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <Truck className="header-icon" size={20} />
                    <h3 className="mb-0">1. Delivery Destination & Hospital Information</h3>
                  </div>
                  {user && (
                    <Link to="/addresses" className="text-xs text-primary d-inline-flex align-items-center gap-1 text-decoration-none">
                      <MapPin size={13} /> Manage Address Book →
                    </Link>
                  )}
                </div>

                {/* Saved Address Selector (if user has saved addresses) */}
                {user && savedAddresses.length > 0 && (
                  <div className="saved-addresses-selector mb-4">
                    <label className="form-label text-xs fw-bold text-secondary text-uppercase mb-2">
                      Choose From Saved Clinical Destinations:
                    </label>

                    <div className="saved-address-grid">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id && !isNewAddress;
                        return (
                          <div
                            key={addr.id}
                            className={`checkout-address-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectAddress(addr)}
                          >
                            <input
                              type="radio"
                              name="checkoutAddressRadio"
                              className="card-radio"
                              checked={isSelected}
                              onChange={() => handleSelectAddress(addr)}
                            />

                            {addr.is_default && (
                              <div className="checkout-default-badge">
                                <Star size={10} fill="#ea580c" /> Primary Default
                              </div>
                            )}

                            <div className="checkout-addr-name">
                              {addr.full_name}
                            </div>
                            <div className="text-xs text-muted mb-1">
                              {addr.address_type ? addr.address_type.replace(/_/g, ' ') : 'Hospital'}
                            </div>
                            <div className="checkout-addr-line">
                              {addr.address_line}
                            </div>
                            {addr.landmark && (
                              <div className="text-xs text-muted mb-1">
                                Near {addr.landmark}
                              </div>
                            )}
                            <div className="checkout-addr-pin">
                              PIN: {addr.pin_code} • {addr.phone}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className={`new-addr-option-btn ${isNewAddress ? 'active' : ''}`}
                      onClick={handleChooseNewAddress}
                    >
                      <Plus size={15} /> Deliver to a Different Address
                    </button>
                  </div>
                )}

                {/* Form Inputs (Visible if entering new address or manual edit) */}
                {(isNewAddress || savedAddresses.length === 0) ? (
                  <div className="new-address-form-block animate-fade-in">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Full Name / Hospital Department *</label>
                        <input
                          type="text"
                          name="deliveryName"
                          className="form-input"
                          value={formData.deliveryName}
                          onChange={handleChange}
                          placeholder="Dr. John Doe / Clinic Manager"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Contact Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          className="form-input"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="orders@hospital.org"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Phone Number *</label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          className="form-input"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          placeholder="10-digit telephone/mobile"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Postal / PIN Code *</label>
                        <input
                          type="text"
                          name="pinCode"
                          className="form-input"
                          value={formData.pinCode}
                          onChange={handleChange}
                          placeholder="e.g. 560001"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Complete Street Address / Facility Wing *</label>
                      <textarea
                        rows={2}
                        name="address"
                        className="form-textarea"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Department, building name, hospital wing, street address..."
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Nearby Landmark (Optional)</label>
                      <input
                        type="text"
                        name="landmark"
                        className="form-input"
                        value={formData.landmark}
                        onChange={handleChange}
                        placeholder="e.g. Opposite Main Gate / Ground Floor Reception"
                      />
                    </div>

                    {user && (
                      <div className="p-3 bg-light rounded border mt-3">
                        <div className="form-check mb-2">
                          <input
                            type="checkbox"
                            id="saveAddrCheckbox"
                            className="form-check-input"
                            checked={saveAddressForFuture}
                            onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                          />
                          <label htmlFor="saveAddrCheckbox" className="form-check-label text-xs fw-semibold text-slate-800">
                            Save this address to my account for future orders
                          </label>
                        </div>
                        {saveAddressForFuture && (
                          <div className="form-check ms-3">
                            <input
                              type="checkbox"
                              id="setDefaultCheckbox"
                              className="form-check-input"
                              checked={setAsDefaultAfterOrder}
                              onChange={(e) => setSetAsDefaultAfterOrder(e.target.checked)}
                            />
                            <label htmlFor="setDefaultCheckbox" className="form-check-label text-xs text-secondary">
                              Set as my primary default delivery address
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="selected-address-summary-box p-3 rounded bg-light border d-flex justify-content-between align-items-center">
                    <div>
                      <div className="text-xs text-muted text-uppercase fw-bold mb-1">Delivering to Selected Location:</div>
                      <div className="fw-bold text-slate-900">{formData.deliveryName}</div>
                      <div className="text-sm text-secondary">{formData.address}{formData.landmark ? `, Near ${formData.landmark}` : ''}</div>
                      <div className="text-xs text-muted">PIN: {formData.pinCode} • Contact: {formData.phoneNumber} • {formData.email}</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => setIsNewAddress(true)}
                    >
                      Deliver to Different Location
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Section */}
              <div className="med-card">
                <div className="card-section-header">
                  <Lock className="header-icon" size={20} />
                  <h3>2. Payment Method</h3>
                </div>

                {/* Tabs */}
                <div className="payment-method-selector">
                  <label className={`method-tile ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                    />
                    <div className="tile-content">
                      <Truck size={20} />
                      <div>
                        <strong>Cash on Delivery (COD)</strong>
                        <p>Pay upon delivery inspection at clinic</p>
                      </div>
                    </div>
                  </label>

                  <label className={`method-tile ${paymentMethod === 'creditCard' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="creditCard"
                      checked={paymentMethod === 'creditCard'}
                      onChange={() => setPaymentMethod('creditCard')}
                    />
                    <div className="tile-content">
                      <CreditCard size={20} />
                      <div>
                        <strong>Credit / Debit Card</strong>
                        <p>Visa, MasterCard, RuPay, Amex</p>
                      </div>
                    </div>
                  </label>

                  <label className={`method-tile ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                    />
                    <div className="tile-content">
                      <Smartphone size={20} />
                      <div>
                        <strong>UPI Instant Transfer</strong>
                        <p>Google Pay, PhonePe, Paytm</p>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Card Fields */}
                {paymentMethod === 'creditCard' && (
                  <div className="payment-fields-box animate-fade-in">
                    <div className="form-group">
                      <label className="form-label">16-Digit Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        className="form-input"
                        placeholder="4532 8920 1204 4242"
                        value={cardDetails.cardNumber}
                        onChange={handleCardChange}
                        maxLength="19"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Cardholder Name</label>
                      <input
                        type="text"
                        name="cardName"
                        className="form-input"
                        placeholder="Name as printed on card"
                        value={cardDetails.cardName}
                        onChange={handleCardChange}
                      />
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Expiry Date</label>
                        <input
                          type="text"
                          name="expiryDate"
                          className="form-input"
                          placeholder="MM/YY"
                          value={cardDetails.expiryDate}
                          onChange={handleCardChange}
                          maxLength="5"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">CVV</label>
                        <input
                          type="password"
                          name="cvv"
                          className="form-input"
                          placeholder="3 digits"
                          value={cardDetails.cvv}
                          onChange={handleCardChange}
                          maxLength="4"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Fields */}
                {paymentMethod === 'upi' && (
                  <div className="payment-fields-box animate-fade-in">
                    <div className="form-group">
                      <label className="form-label">Virtual Payment Address (UPI ID)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="hospital@okhdfcbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="checkout-summary-area">
              <div className="med-card sticky-card">
                <h3 className="summary-card-title">Order Review</h3>

                <div className="order-items-scroll">
                  {checkoutItems.map((item, idx) => {
                    const pImg = item.imageUrl || item.image || item.product?.imageUrl || item.product?.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=60';
                    const itemTotal = (item.quantity || 1) * parseFloat(item.price || item.product?.price || 0);
                    return (
                      <div key={idx} className="checkout-item-row">
                        <img
                          src={pImg}
                          alt={item.productName || item.name}
                          className="checkout-item-thumb"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=60';
                          }}
                        />
                        <div className="checkout-item-meta">
                          <span className="checkout-item-name">{item.productName || item.name}</span>
                          <span className="checkout-item-qty">Qty: {item.quantity}</span>
                        </div>
                        <span className="checkout-item-price">
                          ₹{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="summary-divider"></div>

                <div className="summary-line">
                  <span>Subtotal</span>
                  <span>₹{subtotalComputed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="summary-line">
                  <span>Hospital Shipping</span>
                  <span className="free-shipping-tag">FREE</span>
                </div>

                <div className="summary-line total-amount-line">
                  <span>Total Amount</span>
                  <span className="total-val">₹{subtotalComputed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 mt-4 place-order-btn"
                  disabled={loading}
                >
                  {loading ? 'Confirming Order & Reserving Stock...' : 'Confirm Order & Checkout'}
                </button>

                <div className="checkout-security-notice">
                  <ShieldCheck size={16} />
                  <span>Inventory reserved atomically. Prices verified authoritatively by server.</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
