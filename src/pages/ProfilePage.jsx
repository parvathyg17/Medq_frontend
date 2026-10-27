import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  User,
  Package,
  MapPin,
  Heart,
  Lock,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  ArrowRight,
  Eye,
  EyeOff,
  ShoppingBag,
  ShoppingCart,
  RotateCcw,
  XCircle,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { authApi, ordersApi, wishlistApi } from '../api';
import './ProfilePage.css';

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'addresses', label: 'My Addresses', icon: MapPin },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'wishlist', label: 'Saved Wishlist', icon: Heart },
  { id: 'security', label: 'Account Security', icon: Lock }
];

const ProfilePage = () => {
  const { user, role, logout, updateUser } = useAuth();
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentTab = searchParams.get('tab') || 'overview';

  // State
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Personal Info Form
  const [personalForm, setPersonalForm] = useState({
    fullName: user?.full_name || user?.name || '',
    phone: user?.phone || '',
    email: user?.email || ''
  });
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    full_name: '',
    phone: '',
    address_line: '',
    city: '',
    state: '',
    pin_code: '',
    landmark: '',
    address_type: 'HOME',
    is_default: false
  });

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [returnModalOrder, setReturnModalOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('');

  // Wishlist State
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Security Form
  const [securityForm, setSecurityForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Keep personal form synced with user
  useEffect(() => {
    if (user) {
      setPersonalForm({
        fullName: user.full_name || user.name || '',
        phone: user.phone || '',
        email: user.email || ''
      });
    }
  }, [user]);

  // Load Data based on active tab or overview
  useEffect(() => {
    loadAddresses();
    loadOrders();
    loadWishlist();
  }, []);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
    setFeedback({ type: '', message: '' });
  };

  // -------------------- Addresses Logic --------------------
  const loadAddresses = async () => {
    setAddressLoading(true);
    try {
      const data = await authApi.getAddresses();
      setAddresses(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.warn('Failed to load addresses:', err);
    } finally {
      setAddressLoading(false);
    }
  };

  const openAddressModal = (addr = null) => {
    if (addr) {
      setEditingAddress(addr);
      setAddressForm({
        full_name: addr.full_name || '',
        phone: addr.phone || '',
        address_line: addr.address_line || '',
        city: addr.city || '',
        state: addr.state || '',
        pin_code: addr.pin_code || '',
        landmark: addr.landmark || '',
        address_type: addr.address_type || 'HOME',
        is_default: Boolean(addr.is_default)
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
        address_line: '',
        city: '',
        state: '',
        pin_code: '',
        landmark: '',
        address_type: 'HOME',
        is_default: addresses.length === 0
      });
    }
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.full_name || !addressForm.phone || !addressForm.address_line || !addressForm.city || !addressForm.pin_code) {
      setFeedback({ type: 'error', message: 'Please complete all required address fields.' });
      return;
    }

    setLoading(true);
    try {
      if (editingAddress) {
        await authApi.updateAddress(editingAddress.id, addressForm);
        setFeedback({ type: 'success', message: 'Address updated successfully.' });
      } else {
        await authApi.addAddress(addressForm);
        setFeedback({ type: 'success', message: 'New shipping address added.' });
      }
      setShowAddressModal(false);
      loadAddresses();
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Error saving address.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await authApi.deleteAddress(id);
      setFeedback({ type: 'success', message: 'Address deleted.' });
      loadAddresses();
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to delete address.' });
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await authApi.setDefaultAddress(id);
      setFeedback({ type: 'success', message: 'Default shipping address updated.' });
      loadAddresses();
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to set default address.' });
    }
  };

  // -------------------- Personal Info Logic --------------------
  const handleSavePersonal = async (e) => {
    e.preventDefault();
    if (!personalForm.fullName.trim()) {
      setFeedback({ type: 'error', message: 'Full name cannot be empty.' });
      return;
    }

    setLoading(true);
    try {
      const updated = await authApi.updateProfile({
        full_name: personalForm.fullName.trim(),
        phone: personalForm.phone.trim()
      });
      updateUser({ ...user, ...updated });
      setIsEditingPersonal(false);
      setFeedback({ type: 'success', message: 'Profile details updated successfully.' });
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to update profile.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Orders Logic --------------------
  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await ordersApi.getOrders(user?.email);
      setOrders(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.warn('Failed to load orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelModalOrder) return;
    setLoading(true);
    try {
      await ordersApi.cancelOrder(cancelModalOrder.id || cancelModalOrder.orderId);
      setFeedback({ type: 'success', message: `Order #${cancelModalOrder.orderId || cancelModalOrder.id} has been cancelled.` });
      setCancelModalOrder(null);
      loadOrders();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to cancel order.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleReturnOrder = async (e) => {
    e.preventDefault();
    if (!returnModalOrder) return;
    if (!returnReason.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a clinical or technical reason for the return.' });
      return;
    }
    setLoading(true);
    try {
      await ordersApi.returnOrder(returnModalOrder.id || returnModalOrder.orderId, returnReason.trim());
      setFeedback({ type: 'success', message: `Return request submitted for Order #${returnModalOrder.orderId || returnModalOrder.id}. Our biomedical team will review it.` });
      setReturnModalOrder(null);
      setReturnReason('');
      loadOrders();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to submit return request.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Wishlist Logic --------------------
  const loadWishlist = async () => {
    setWishlistLoading(true);
    try {
      const data = await wishlistApi.getWishlist();
      setWishlistItems(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.warn('Failed to load wishlist:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleRemoveWishlist = async (productId) => {
    try {
      await wishlistApi.removeItem(productId);
      setWishlistItems((prev) => prev.filter((item) => (item.product?.id || item.product_id || item.id) !== productId));
      setFeedback({ type: 'success', message: 'Item removed from wishlist.' });
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to remove item.' });
    }
  };

  const handleAddToCartFromWishlist = (product) => {
    addToCart(product, 1);
    setFeedback({ type: 'success', message: `${product.name} added to your cart.` });
  };

  // -------------------- Security Logic --------------------
  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    if (!securityForm.current_password) {
      setFeedback({ type: 'error', message: 'Please provide your current password.' });
      return;
    }
    if (securityForm.new_password.length < 8) {
      setFeedback({ type: 'error', message: 'New password must be at least 8 characters long.' });
      return;
    }
    if (securityForm.new_password !== securityForm.confirm_password) {
      setFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword({
        current_password: securityForm.current_password,
        new_password: securityForm.new_password
      });
      setFeedback({ type: 'success', message: 'Password changed successfully. Your account is secure.' });
      setSecurityForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const msg = err.response?.data?.current_password?.[0] ||
                  err.response?.data?.new_password?.[0] ||
                  err.response?.data?.detail ||
                  'Failed to change password. Please check your credentials.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out of MEDQ?')) {
      logout();
      navigate('/login');
    }
  };

  const defaultAddress = addresses.find((a) => a.is_default) || addresses[0];

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'ALL') return true;
    return (o.status || '').toUpperCase() === orderFilter;
  });

  return (
    <div className="profile-page-wrapper">
      <div className="med-container profile-page-container">
        {/* Breadcrumb */}
        <div className="profile-breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <span className="current">My Account</span>
          {currentTab !== 'overview' && (
            <>
              <ChevronRight size={14} />
              <span className="current">{TABS.find((t) => t.id === currentTab)?.label}</span>
            </>
          )}
        </div>

        {/* Global Feedback Alert */}
        {feedback.message && (
          <div className={`alert-banner mb-4 animate-fade-in ${feedback.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
            {feedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{feedback.message}</span>
            <button
              className="alert-close-btn"
              onClick={() => setFeedback({ type: '', message: '' })}
              aria-label="Dismiss alert"
            >
              &times;
            </button>
          </div>
        )}

        <div className="profile-layout-grid">
          {/* ==================== LEFT SIDEBAR ==================== */}
          <aside className="profile-sidebar med-card">
            <div className="profile-sidebar-user">
              <div className="sidebar-avatar">
                {(user?.full_name || user?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="sidebar-user-info">
                <h3 className="sidebar-user-name">{user?.full_name || user?.name || 'Medical Professional'}</h3>
                <p className="sidebar-user-email">{user?.email}</p>
                <div className="sidebar-role-badge">
                  <ShieldCheck size={12} />
                  <span>{role || 'CUSTOMER'}</span>
                </div>
              </div>
            </div>

            <nav className="profile-nav-menu">
              {TABS.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`profile-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <IconComponent size={18} />
                    <span className="nav-label">{tab.label}</span>
                    {tab.id === 'orders' && orders.length > 0 && (
                      <span className="nav-count-pill">{orders.length}</span>
                    )}
                    {tab.id === 'wishlist' && wishlistItems.length > 0 && (
                      <span className="nav-count-pill">{wishlistItems.length}</span>
                    )}
                    {tab.id === 'addresses' && addresses.length > 0 && (
                      <span className="nav-count-pill">{addresses.length}</span>
                    )}
                  </button>
                );
              })}

              <div className="nav-menu-divider"></div>

              <button type="button" className="profile-nav-item logout-nav-item" onClick={handleLogout}>
                <LogOut size={18} />
                <span className="nav-label">Sign Out</span>
              </button>
            </nav>
          </aside>

          {/* ==================== MAIN CONTENT AREA ==================== */}
          <main className="profile-main-content">
            {/* 1. OVERVIEW TAB */}
            {currentTab === 'overview' && (
              <div className="tab-pane animate-fade-in">
                <div className="pane-header">
                  <div>
                    <h1 className="pane-title">Account Overview</h1>
                    <p className="pane-subtitle">Manage your clinical profile, active equipment orders, and shipping addresses.</p>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="kpi-cards-grid">
                  <div className="kpi-card med-card" onClick={() => handleTabChange('orders')}>
                    <div className="kpi-icon-box bg-blue-50 text-blue-600">
                      <Package size={24} />
                    </div>
                    <div className="kpi-content">
                      <span className="kpi-label">Total Orders</span>
                      <span className="kpi-value">{orders.length}</span>
                    </div>
                    <ChevronRight size={18} className="kpi-arrow" />
                  </div>

                  <div className="kpi-card med-card" onClick={() => handleTabChange('addresses')}>
                    <div className="kpi-icon-box bg-blue-50 text-blue-600">
                      <MapPin size={24} />
                    </div>
                    <div className="kpi-content">
                      <span className="kpi-label">Saved Addresses</span>
                      <span className="kpi-value">{addresses.length}</span>
                    </div>
                    <ChevronRight size={18} className="kpi-arrow" />
                  </div>

                  <div className="kpi-card med-card" onClick={() => handleTabChange('wishlist')}>
                    <div className="kpi-icon-box bg-blue-50 text-blue-600">
                      <Heart size={24} />
                    </div>
                    <div className="kpi-content">
                      <span className="kpi-label">Saved in Wishlist</span>
                      <span className="kpi-value">{wishlistItems.length}</span>
                    </div>
                    <ChevronRight size={18} className="kpi-arrow" />
                  </div>
                </div>

                {/* Profile Information Summary */}
                <div className="overview-sections-grid">
                  <div className="med-card overview-card">
                    <div className="overview-card-header">
                      <div className="d-flex align-items-center gap-2">
                        <User size={18} className="text-primary-600" />
                        <h2 className="overview-section-title">Personal Details</h2>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleTabChange('personal')}
                      >
                        Edit
                      </button>
                    </div>
                    <div className="overview-details-list">
                      <div className="detail-row">
                        <span className="detail-label">Full Name:</span>
                        <span className="detail-value">{user?.full_name || user?.name || 'Not specified'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Email Address:</span>
                        <span className="detail-value">{user?.email}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Phone Number:</span>
                        <span className="detail-value">{user?.phone || 'Not added'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Account Role:</span>
                        <span className="badge badge-primary">{role || 'CUSTOMER'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Shipping Address */}
                  <div className="med-card overview-card">
                    <div className="overview-card-header">
                      <div className="d-flex align-items-center gap-2">
                        <MapPin size={18} className="text-primary-600" />
                        <h2 className="overview-section-title">Default Shipping Address</h2>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleTabChange('addresses')}
                      >
                        Manage
                      </button>
                    </div>
                    {defaultAddress ? (
                      <div className="default-address-display">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <span className="address-recipient-name">{defaultAddress.full_name}</span>
                          <span className="badge badge-secondary">{defaultAddress.address_type}</span>
                          <span className="badge badge-success">Default</span>
                        </div>
                        <p className="address-text-line">{defaultAddress.address_line}</p>
                        {defaultAddress.landmark && (
                          <p className="address-landmark-text">Landmark: {defaultAddress.landmark}</p>
                        )}
                        <p className="address-text-line">
                          {defaultAddress.city}, {defaultAddress.state} - <strong>{defaultAddress.pin_code}</strong>
                        </p>
                        <p className="address-phone-line">Phone: {defaultAddress.phone}</p>
                      </div>
                    ) : (
                      <div className="empty-overview-address">
                        <p className="text-secondary mb-3">No default delivery address configured.</p>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => openAddressModal()}
                        >
                          <Plus size={14} /> Add Address
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Orders Preview */}
                <div className="med-card recent-orders-card mt-4">
                  <div className="overview-card-header">
                    <div className="d-flex align-items-center gap-2">
                      <Package size={18} className="text-primary-600" />
                      <h2 className="overview-section-title">Recent Orders</h2>
                    </div>
                    {orders.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-link text-primary-600 font-semibold p-0"
                        onClick={() => handleTabChange('orders')}
                      >
                        View All ({orders.length}) <ArrowRight size={14} />
                      </button>
                    )}
                  </div>

                  {ordersLoading ? (
                    <div className="p-4 text-center text-secondary">Loading your recent orders...</div>
                  ) : orders.length === 0 ? (
                    <div className="empty-state-box text-center p-5">
                      <ShoppingBag size={40} className="text-slate-300 mb-2" />
                      <h4 className="font-heading mb-1">No Orders Placed Yet</h4>
                      <p className="text-secondary mb-3">Explore our certified medical equipment and procure hospital-grade devices.</p>
                      <Link to="/equipments" className="btn btn-primary btn-sm">
                        Explore Catalog
                      </Link>
                    </div>
                  ) : (
                    <div className="recent-orders-list">
                      {orders.slice(0, 3).map((order) => {
                        const orderId = order.orderId || order.id;
                        const dateFormatted = order.createdAt || order.created_at || order.orderDate
                          ? new Date(order.createdAt || order.created_at || order.orderDate).toLocaleDateString()
                          : 'Recent';
                        const items = order.orderItems || order.order_items || order.items || [];
                        return (
                          <div key={orderId} className="recent-order-item">
                            <div className="order-meta-col">
                              <span className="order-number">Order #{orderId}</span>
                              <span className="order-date"><Clock size={12} /> {dateFormatted}</span>
                            </div>
                            <div className="order-summary-col">
                              <span className="order-items-count">
                                {items.length} {items.length === 1 ? 'equipment item' : 'equipment items'}
                              </span>
                              <span className="order-price">₹{parseFloat(order.totalAmount || order.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              {items.length > 0 && (
                                <div className="order-thumb-stack" title={items.map(i => i.productName || i.product_name).join(', ')}>
                                  {items.slice(0, 3).map((it, iIdx) => {
                                    const itImg = it.imageUrl || it.image || it.productImage || it.product_image || it.product?.image || it.product?.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=60';
                                    return (
                                      <img
                                        key={iIdx}
                                        src={itImg}
                                        alt={it.productName || it.product_name || 'Equipment'}
                                        className="order-thumb-avatar"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=60';
                                        }}
                                      />
                                    );
                                  })}
                                  {items.length > 3 && (
                                    <span className="order-thumb-more">+{items.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="order-status-col">
                              <span className={`badge ${
                                (order.status || '').toUpperCase() === 'DELIVERED' ? 'badge-success' :
                                (order.status || '').toUpperCase() === 'CANCELLED' ? 'badge-danger' :
                                (order.status || '').toUpperCase() === 'SHIPPED' ? 'badge-primary' : 'badge-warning'
                              }`}>
                                {order.status || 'PROCESSING'}
                              </span>
                            </div>
                            <div className="order-action-col">
                              <Link to={`/trackorder?orderId=${orderId}`} className="btn btn-outline btn-sm">
                                Track
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. PERSONAL INFORMATION TAB */}
            {currentTab === 'personal' && (
              <div className="tab-pane animate-fade-in">
                <div className="pane-header">
                  <div>
                    <h1 className="pane-title">Personal Information</h1>
                    <p className="pane-subtitle">Update your personal contact details for billing and shipping communication.</p>
                  </div>
                  {!isEditingPersonal && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setIsEditingPersonal(true)}
                    >
                      <Edit2 size={14} /> Edit Information
                    </button>
                  )}
                </div>

                <div className="med-card p-4">
                  <form onSubmit={handleSavePersonal}>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label" htmlFor="fullName">Full Name</label>
                        <input
                          id="fullName"
                          type="text"
                          className="form-control"
                          value={personalForm.fullName}
                          disabled={!isEditingPersonal}
                          onChange={(e) => setPersonalForm({ ...personalForm, fullName: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="email">Email Address</label>
                        <div className="input-with-badge">
                          <input
                            id="email"
                            type="email"
                            className="form-control"
                            value={personalForm.email}
                            disabled
                          />
                          <span className="verified-pill">
                            <ShieldCheck size={12} /> Verified
                          </span>
                        </div>
                        <small className="form-hint">Email address is permanently linked to your medical credentials.</small>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="phone">Phone Number</label>
                        <input
                          id="phone"
                          type="tel"
                          className="form-control"
                          placeholder="+1 (555) 000-0000"
                          value={personalForm.phone}
                          disabled={!isEditingPersonal}
                          onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                        />
                        <small className="form-hint">Used for carrier delivery alerts and shipping dispatch updates.</small>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Account Role</label>
                        <input
                          type="text"
                          className="form-control"
                          value={role || 'CUSTOMER'}
                          disabled
                        />
                      </div>
                    </div>

                    {isEditingPersonal && (
                      <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setIsEditingPersonal(false);
                            setPersonalForm({
                              fullName: user?.full_name || user?.name || '',
                              phone: user?.phone || '',
                              email: user?.email || ''
                            });
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* 3. MY ADDRESSES TAB */}
            {currentTab === 'addresses' && (
              <div className="tab-pane animate-fade-in">
                <div className="pane-header">
                  <div>
                    <h1 className="pane-title">Shipping Address Book</h1>
                    <p className="pane-subtitle">Manage delivery addresses for clinics, hospital units, and practices.</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => openAddressModal()}
                  >
                    <Plus size={16} /> Add New Address
                  </button>
                </div>

                {addressLoading ? (
                  <div className="med-card p-5 text-center text-secondary">Loading address records...</div>
                ) : addresses.length === 0 ? (
                  <div className="med-card empty-state-box text-center p-5">
                    <MapPin size={48} className="text-slate-300 mb-2" />
                    <h4 className="font-heading mb-1">No Saved Addresses</h4>
                    <p className="text-secondary mb-4">Add your hospital, clinic, or practice destination for seamless 1-click checkout.</p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => openAddressModal()}
                    >
                      <Plus size={16} /> Add First Address
                    </button>
                  </div>
                ) : (
                  <div className="addresses-grid">
                    {addresses.map((addr) => (
                      <div key={addr.id} className={`med-card address-card ${addr.is_default ? 'is-default-card' : ''}`}>
                        <div className="address-card-header">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge badge-secondary">{addr.address_type || 'HOME'}</span>
                            {addr.is_default && <span className="badge badge-success">Default Shipping</span>}
                          </div>
                          <div className="address-card-actions">
                            <button
                              type="button"
                              className="btn-icon"
                              title="Edit Address"
                              onClick={() => openAddressModal(addr)}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon text-danger"
                              title="Delete Address"
                              onClick={() => handleDeleteAddress(addr.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="address-card-body">
                          <h4 className="address-recipient-name">{addr.full_name}</h4>
                          <p className="address-text-line">{addr.address_line}</p>
                          {addr.landmark && (
                            <p className="address-landmark-text">Landmark: {addr.landmark}</p>
                          )}
                          <p className="address-text-line">
                            {addr.city}, {addr.state} - <strong>{addr.pin_code}</strong>
                          </p>
                          <p className="address-phone-line">Phone: {addr.phone}</p>
                        </div>

                        {!addr.is_default && (
                          <div className="address-card-footer">
                            <button
                              type="button"
                              className="btn-make-default"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                            >
                              <Check size={14} /> Set as Default
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. MY ORDERS TAB */}
            {currentTab === 'orders' && (
              <div className="tab-pane animate-fade-in">
                <div className="pane-header">
                  <div>
                    <h1 className="pane-title">Order History & Fulfillment</h1>
                    <p className="pane-subtitle">View and track all procurement transactions, invoices, and delivery milestones.</p>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="order-filter-pills mb-4">
                  {['ALL', 'PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`filter-pill ${orderFilter === st ? 'active' : ''}`}
                      onClick={() => setOrderFilter(st)}
                    >
                      {st === 'ALL' ? 'All Orders' : st}
                    </button>
                  ))}
                </div>

                {ordersLoading ? (
                  <div className="med-card p-5 text-center text-secondary">Loading order records...</div>
                ) : filteredOrders.length === 0 ? (
                  <div className="med-card empty-state-box text-center p-5">
                    <Package size={48} className="text-slate-300 mb-2" />
                    <h4 className="font-heading mb-1">No Orders Found</h4>
                    <p className="text-secondary mb-4">There are no orders matching this fulfillment filter.</p>
                    <Link to="/equipments" className="btn btn-primary">
                      Procure Equipment
                    </Link>
                  </div>
                ) : (
                  <div className="orders-stack">
                    {filteredOrders.map((order) => {
                      const orderId = order.orderId || order.id;
                      const dateFormatted = order.createdAt || order.created_at || order.orderDate
                        ? new Date(order.createdAt || order.created_at || order.orderDate).toLocaleDateString()
                        : 'Recent';
                      const items = order.orderItems || order.order_items || order.items || [];
                      const statusUpper = (order.status || '').toUpperCase();
                      const isDelivered = statusUpper === 'DELIVERED';
                      const canCancel = ['PLACED', 'PENDING', 'PROCESSING'].includes(statusUpper);

                      return (
                        <div key={orderId} className="med-card order-full-card">
                          <div className="order-full-header">
                            <div className="order-header-main">
                              <div>
                                <span className="order-label-tag">Order Reference</span>
                                <h4 className="order-main-number">#{orderId}</h4>
                              </div>
                              <div>
                                <span className="order-label-tag">Placed On</span>
                                <span className="order-header-val">{dateFormatted}</span>
                              </div>
                              <div>
                                <span className="order-label-tag">Total Amount</span>
                                <span className="order-header-val font-bold text-navy">
                                  ₹{parseFloat(order.totalAmount || order.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                            <div className="order-header-status">
                              <span className={`badge ${
                                statusUpper === 'DELIVERED' ? 'badge-success' :
                                statusUpper === 'CANCELLED' ? 'badge-danger' :
                                statusUpper === 'SHIPPED' ? 'badge-primary' : 'badge-warning'
                              }`}>
                                {order.status || 'PROCESSING'}
                              </span>
                            </div>
                          </div>

                          <div className="order-full-body">
                            {/* Items list */}
                            <div className="order-items-list">
                              {items.map((item, idx) => {
                                const pName = item.productName || item.product_name || item.product?.name || item.name || 'Medical Equipment';
                                const pPrice = item.price || item.product?.price || 0;
                                const pQty = item.quantity || 1;
                                const pImage = item.imageUrl || item.image || item.productImage || item.product_image || item.product?.image || item.product?.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=60';
                                return (
                                  <div key={idx} className="order-item-row">
                                    <div className="order-item-thumb">
                                      <img
                                        src={pImage}
                                        alt={pName}
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=60';
                                        }}
                                      />
                                    </div>
                                    <div className="order-item-info">
                                      <h5 className="order-item-name">{pName}</h5>
                                      <span className="order-item-meta">Qty: {pQty} × ₹{parseFloat(pPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="order-item-subtotal">
                                      ₹{(pQty * parseFloat(pPrice)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Shipping address info */}
                            {order.deliveryAddress && (
                              <div className="order-shipping-summary">
                                <span className="shipping-label"><MapPin size={14} /> Destination:</span>
                                <span className="shipping-val">{order.deliveryAddress}</span>
                              </div>
                            )}
                          </div>

                          <div className="order-full-footer">
                            <div className="order-footer-actions">
                              <Link to={`/trackorder?orderId=${orderId}`} className="btn btn-outline btn-sm">
                                Track Live Status
                              </Link>

                              {isDelivered && (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm text-secondary"
                                  onClick={() => {
                                    setReturnModalOrder(order);
                                    setReturnReason('');
                                  }}
                                >
                                  <RotateCcw size={14} /> Request Return
                                </button>
                              )}

                              {canCancel && (
                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm text-danger"
                                  onClick={() => setCancelModalOrder(order)}
                                >
                                  <XCircle size={14} /> Cancel Order
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 5. SAVED WISHLIST TAB */}
            {currentTab === 'wishlist' && (
              <div className="tab-pane animate-fade-in">
                <div className="pane-header">
                  <div>
                    <h1 className="pane-title">Saved Wishlist</h1>
                    <p className="pane-subtitle">Keep track of medical equipment and clinical instrumentation for future orders.</p>
                  </div>
                </div>

                {wishlistLoading ? (
                  <div className="med-card p-5 text-center text-secondary">Loading wishlist items...</div>
                ) : wishlistItems.length === 0 ? (
                  <div className="med-card empty-state-box text-center p-5">
                    <Heart size={48} className="text-slate-300 mb-2" />
                    <h4 className="font-heading mb-1">Your Wishlist is Empty</h4>
                    <p className="text-secondary mb-4">Save diagnostic and surgical instruments while browsing our catalog.</p>
                    <Link to="/equipments" className="btn btn-primary">
                      Browse Medical Equipment
                    </Link>
                  </div>
                ) : (
                  <div className="wishlist-grid">
                    {wishlistItems.map((item) => {
                      const prod = item.product || item;
                      const prodId = prod.id || item.product_id;
                      const inStock = prod.stock_quantity === undefined || prod.stock_quantity > 0;

                      return (
                        <div key={prodId} className="med-card wishlist-card">
                          <div className="wishlist-thumb-wrapper">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="wishlist-thumb" />
                            ) : (
                              <div className="wishlist-thumb-placeholder">
                                <Package size={32} className="text-slate-300" />
                              </div>
                            )}
                            <button
                              type="button"
                              className="wishlist-delete-btn"
                              title="Remove from Wishlist"
                              onClick={() => handleRemoveWishlist(prodId)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="wishlist-card-body">
                            <span className="wishlist-category">{prod.category?.name || prod.category || 'Clinical Device'}</span>
                            <h4 className="wishlist-item-title">
                              <Link to={`/product/${prodId}`}>{prod.name}</Link>
                            </h4>
                            <div className="d-flex align-items-center justify-content-between my-2">
                              <span className="wishlist-price">₹{parseFloat(prod.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              <span className={`badge ${inStock ? 'badge-success' : 'badge-danger'}`}>
                                {inStock ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="btn btn-primary btn-sm w-100 mt-2"
                              disabled={!inStock}
                              onClick={() => handleAddToCartFromWishlist(prod)}
                            >
                              <ShoppingCart size={14} /> Add to Cart
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 6. ACCOUNT SECURITY TAB */}
            {currentTab === 'security' && (
              <div className="tab-pane animate-fade-in">
                <div className="pane-header">
                  <div>
                    <h1 className="pane-title">Account Security</h1>
                    <p className="pane-subtitle">Manage credentials and maintain stringent HIPAA-compliant access to your procurement account.</p>
                  </div>
                </div>

                <div className="med-card p-4 security-card">

                  <form onSubmit={handleSaveSecurity} className="security-form">
                    <div className="form-group mb-3">
                      <label className="form-label" htmlFor="currentPassword">Current Password</label>
                      <div className="password-input-wrapper">
                        <input
                          id="currentPassword"
                          type={showPasswords.current ? 'text' : 'password'}
                          className="form-control"
                          placeholder="Enter your existing account password"
                          value={securityForm.current_password}
                          onChange={(e) => setSecurityForm({ ...securityForm, current_password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          className="toggle-password-btn"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        >
                          {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group mb-3">
                      <label className="form-label" htmlFor="newPassword">New Password</label>
                      <div className="password-input-wrapper">
                        <input
                          id="newPassword"
                          type={showPasswords.new ? 'text' : 'password'}
                          className="form-control"
                          placeholder="Minimum 8 characters"
                          value={securityForm.new_password}
                          onChange={(e) => setSecurityForm({ ...securityForm, new_password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          className="toggle-password-btn"
                          onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        >
                          {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group mb-4">
                      <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
                      <div className="password-input-wrapper">
                        <input
                          id="confirmPassword"
                          type={showPasswords.confirm ? 'text' : 'password'}
                          className="form-control"
                          placeholder="Re-type new password"
                          value={securityForm.confirm_password}
                          onChange={(e) => setSecurityForm({ ...securityForm, confirm_password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          className="toggle-password-btn"
                          onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        >
                          {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? 'Updating Password...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ==================== ADDRESS MODAL ==================== */}
      {showAddressModal && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setShowAddressModal(false)}>
          <div className="modal-dialog med-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title font-heading">
                {editingAddress ? 'Edit Shipping Address' : 'Add New Shipping Address'}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAddressModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveAddress}>
              <div className="modal-body">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Recipient / Facility Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Dr. John Carter / St. Jude Clinic"
                      value={addressForm.full_name}
                      onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Phone *</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="+1 (555) 000-0000"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group mt-3">
                  <label className="form-label">Street Address / Suite / Department *</label>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="e.g. 742 Evergreen Medical Parkway, Suite 400"
                    value={addressForm.address_line}
                    onChange={(e) => setAddressForm({ ...addressForm, address_line: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-3 mt-3">
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Boston"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">State / Province *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. MA"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Postal / PIN Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 02115"
                      value={addressForm.pin_code}
                      onChange={(e) => setAddressForm({ ...addressForm, pin_code: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2 mt-3">
                  <div className="form-group">
                    <label className="form-label">Nearby Landmark (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Opposite Metro Hospital"
                      value={addressForm.landmark}
                      onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Destination Type</label>
                    <select
                      className="form-control"
                      value={addressForm.address_type}
                      onChange={(e) => setAddressForm({ ...addressForm, address_type: e.target.value })}
                    >
                      <option value="HOSPITAL">Hospital / Clinic</option>
                      <option value="WORK">Office / Diagnostic Lab</option>
                      <option value="HOME">Home Practice / Residence</option>
                      <option value="OTHER">Other Clinical Site</option>
                    </select>
                  </div>
                </div>

                <div className="form-check mt-3">
                  <input
                    id="modalDefaultCheck"
                    type="checkbox"
                    className="form-check-input"
                    checked={addressForm.is_default}
                    onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                  />
                  <label htmlFor="modalDefaultCheck" className="form-check-label">
                    Set this as primary shipping address for clinical orders
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddressModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CANCEL ORDER CONFIRMATION MODAL ==================== */}
      {cancelModalOrder && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setCancelModalOrder(null)}>
          <div className="modal-dialog med-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title font-heading text-danger">Cancel Order #{cancelModalOrder.orderId || cancelModalOrder.id}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setCancelModalOrder(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p className="text-secondary">
                Are you sure you want to cancel this equipment order? Cancellation will immediately release reserved inventory back to our stock and invalidate any scheduled dispatch.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setCancelModalOrder(null)}>Keep Order</button>
              <button type="button" className="btn btn-danger" onClick={handleCancelOrder} disabled={loading}>
                {loading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== RETURN REQUEST MODAL ==================== */}
      {returnModalOrder && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setReturnModalOrder(null)}>
          <div className="modal-dialog med-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title font-heading">Request Clinical Return / Warranty Review</h3>
              <button type="button" className="modal-close-btn" onClick={() => setReturnModalOrder(null)}>&times;</button>
            </div>
            <form onSubmit={handleReturnOrder}>
              <div className="modal-body">
                <p className="text-secondary text-sm mb-3">
                  Please provide the clinical reason for the return of Order #{returnModalOrder.orderId || returnModalOrder.id}. Our quality control team will evaluate your request within 24 business hours.
                </p>
                <div className="form-group">
                  <label className="form-label">Return Reason / Equipment Defect Details *</label>
                  <textarea
                    rows={4}
                    className="form-control"
                    placeholder="Specify the technical fault, calibration issue, or reason for return..."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setReturnModalOrder(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
