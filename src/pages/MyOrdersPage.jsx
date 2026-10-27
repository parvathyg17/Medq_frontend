import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Calendar,
  Truck,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  CreditCard,
  UserCheck,
  Mail,
  FileText,
  RotateCcw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { ordersApi } from '../api';
import { useAuth } from '../context/AuthContext';
import './MyOrdersPage.css';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Return modal state
  const [returnModalOrder, setReturnModalOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('Defective equipment or sensor calibration');
  const [customReason, setCustomReason] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersApi.getOrders(user?.email);
      const list = Array.isArray(data) ? data : data?.results || [];
      setOrders(list);

      // Automatically expand the latest order so details are immediately visible
      if (list.length > 0) {
        setExpandedOrderId((prev) => (prev !== null ? prev : list[0].id));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch clinical orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const toggleExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  // Cancel order handler - permitted ONLY before shipping
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? Reserved medical equipment inventory will be immediately restored to stock.')) {
      return;
    }

    try {
      setActionLoading(true);
      await ordersApi.cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
      );
      alert('Order has been cancelled and medical stock returned to inventory.');
    } catch (err) {
      alert(err.message || 'Failed to cancel order.');
    } finally {
      setActionLoading(false);
    }
  };

  // Return request submission handler
  const handleOpenReturnModal = (order) => {
    setReturnModalOrder(order);
    setReturnReason('Defective equipment or sensor calibration');
    setCustomReason('');
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!returnModalOrder) return;

    const finalReason = returnReason === 'Other' ? (customReason.trim() || 'Other customer reason') : returnReason;

    try {
      setActionLoading(true);
      await ordersApi.returnOrder(returnModalOrder.id, finalReason);
      setOrders((prev) =>
        prev.map((o) => (o.id === returnModalOrder.id ? { ...o, status: 'return_requested' } : o))
      );
      setReturnModalOrder(null);
      alert('Your equipment return request has been submitted. Our biomedical team will review and approve the return.');
    } catch (err) {
      alert(err.message || 'Failed to submit return request.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') return 'badge-success';
    if (s === 'out_for_delivery') return 'badge-info';
    if (s === 'shipped') return 'badge-purple';
    if (s === 'processing' || s === 'confirmed') return 'badge-warning';
    if (s === 'cancelled') return 'badge-danger';
    if (s === 'return_requested') return 'badge-warning';
    if (s === 'return_rejected') return 'badge-danger';
    if (s === 'returned') return 'badge-neutral';
    return 'badge-neutral';
  };

  const getProgressPercentage = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'confirmed': return 20;
      case 'processing': return 40;
      case 'shipped': return 65;
      case 'out_for_delivery': return 85;
      case 'delivered': return 100;
      case 'cancelled': return 0;
      case 'return_requested': return 100;
      case 'returned': return 0;
      case 'return_rejected': return 100;
      default: return 15;
    }
  };

  const formatPaymentMethod = (method) => {
    const m = (method || '').toLowerCase();
    if (m === 'creditcard') return 'Credit / Debit Card';
    if (m === 'upi') return 'UPI Instant Transfer';
    return 'Cash on Delivery (COD)';
  };

  if (loading) {
    return (
      <div className="med-container py-5 text-center">
        <div className="pulse-loader"></div>
        <p className="mt-3 text-muted">Retrieving hospital order records and equipment dispatches...</p>
      </div>
    );
  }

  return (
    <div className="my-orders-page py-4">
      <div className="med-container">
        <div className="orders-header">
          <div>
            <h1 className="page-title"><ShoppingBag className="icon-mr" /> My Clinical Orders</h1>
            <p className="page-subtitle">Track hospital dispatches, download invoices, request equipment returns, or track shipments.</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link to="/addresses" className="btn btn-outline btn-sm">
              <MapPin size={15} /> Delivery Addresses
            </Link>
            <button className="btn btn-secondary btn-sm" onClick={fetchOrders}>
              Refresh Orders
            </button>
          </div>
        </div>

        {error && (
          <div className="alert-banner alert-danger mb-4">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="empty-orders-card">
            <Package size={64} className="empty-icon" />
            <h2>No Orders Placed Yet</h2>
            <p>You have not placed any orders yet. Browse our verified biomedical equipment catalog to procure supplies.</p>
            <Link to="/equipments" className="btn btn-primary btn-lg mt-3">
              Explore Equipment Catalog
            </Link>
          </div>
        ) : (
          <div className="orders-stack">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const items = order.orderItems || order.order_items || [];
              const status = (order.status || 'confirmed').toLowerCase();
              
              // Business Rules:
              // 1. Cancel allowed ONLY prior to dispatch (pending, confirmed, processing)
              // 2. Cancel locked once shipped, out_for_delivery, delivered
              // 3. Return allowed when delivered
              const canCancel = ['pending', 'confirmed', 'processing'].includes(status);
              const isShippedOrOut = ['shipped', 'out_for_delivery'].includes(status);
              const isDelivered = status === 'delivered';
              const isReturnRequested = status === 'return_requested';
              const isReturned = status === 'returned';
              const isReturnRejected = status === 'return_rejected';

              const total = parseFloat(order.totalAmount || order.total_amount || 0);
              const subtotal = parseFloat(order.subtotal || total);

              return (
                <div key={order.id} className="order-item-card med-card">
                  {/* Summary Bar */}
                  <div className="order-summary-row" onClick={() => toggleExpand(order.id)}>
                    <div className="summary-col-primary">
                      <span className="order-id-label">Order #{order.id}</span>
                      <span className="order-num-text">{order.orderNumber || order.order_number}</span>
                      <div className="order-date-text">
                        <Calendar size={13} /> {new Date(order.createdAt || order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="summary-col-items">
                      <span>{items.length} {items.length === 1 ? 'equipment item' : 'equipment items'}</span>
                      <strong className="summary-price-highlight">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
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

                    <div className="summary-col-status">
                      <span className={`badge ${getStatusBadgeClass(status)}`}>
                        {status.toUpperCase().replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="summary-col-toggle">
                      <button
                        className="expand-details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(order.id);
                        }}
                        aria-label="Toggle order details"
                      >
                        {isExpanded ? (
                          <>
                            <span>Hide Details</span>
                            <ChevronUp size={16} />
                          </>
                        ) : (
                          <>
                            <span>View Details</span>
                            <ChevronDown size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="order-progress-track">
                    <div
                      className={`order-progress-fill ${status === 'cancelled' || status === 'returned' ? 'cancelled' : ''}`}
                      style={{ width: `${getProgressPercentage(status)}%` }}
                    />
                  </div>

                  {/* Expanded Full Order Details Body */}
                  {isExpanded && (
                    <div className="order-expanded-body animate-fade-in">
                      <div className="expanded-grid">
                        {/* 1. Itemized Equipment Breakdown */}
                        <div className="expanded-items-block">
                          <h4>Purchased Clinical Equipment ({items.length})</h4>
                          <div className="items-list-wrap">
                            {items.length === 0 ? (
                              <p className="text-muted py-2">Item details are being updated by the dispensary.</p>
                            ) : (
                              items.map((item, idx) => {
                                const unitPrice = parseFloat(item.price || 0);
                                const lineTotal = parseFloat(item.total_price || (unitPrice * item.quantity));
                                const pImage = item.imageUrl || item.image || item.productImage || item.product_image || item.product?.image || item.product?.image_url || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=60";
                                const sku = item.productSku || item.product_sku;

                                return (
                                  <div key={idx} className="order-product-row">
                                    <img
                                      src={pImage}
                                      alt={item.productName || item.product_name}
                                      className="order-product-thumb"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=60";
                                      }}
                                    />
                                    <div className="product-info-left">
                                      <strong className="product-title-text">{item.productName || item.product_name}</strong>
                                      <div className="product-meta-row">
                                        {sku && <span className="item-sku-tag">SKU: {sku}</span>}
                                        <span className="item-qty-tag">Quantity: {item.quantity}</span>
                                        <span className="item-unit-price">@ ₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                      </div>
                                    </div>
                                    <div className="product-row-price-wrap">
                                      <span className="product-row-price">
                                        ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Invoice Financial Breakdown */}
                          <div className="order-cost-breakdown mt-3">
                            <div className="cost-row">
                              <span>Equipment Subtotal:</span>
                              <strong>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                            </div>
                            <div className="cost-row">
                              <span>Medical Express Dispatch:</span>
                              <span className="free-shipping-tag">FREE DISPATCH</span>
                            </div>
                            <div className="cost-row grand-total-row">
                              <span>Grand Total Amount:</span>
                              <strong className="grand-total-amount">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                            </div>
                            <div className="payment-summary-pill">
                              <span className="payment-method-text">
                                <CreditCard size={14} className="icon-mr" />
                                Payment Method: <strong>{formatPaymentMethod(order.paymentMethod || order.payment_method)}</strong>
                              </span>
                              <span className={`payment-status-badge ${(order.payment_status || '').toLowerCase() === 'completed' ? 'paid' : 'pending'}`}>
                                {(order.payment_status || 'PENDING').toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Facility Destination & Fulfillment Tracker */}
                        <div className="expanded-delivery-block">
                          <h4>Hospital Delivery & Fulfillment Information</h4>
                          <div className="delivery-card-inner">
                            <p className="delivery-info-line">
                              <UserCheck size={15} className="info-icon" />
                              <span><strong>Recipient / Department:</strong> {order.deliveryName || order.delivery_name}</span>
                            </p>
                            <p className="delivery-info-line">
                              <MapPin size={15} className="info-icon" />
                              <span><strong>Facility Destination:</strong> {order.address}{order.landmark ? `, Near ${order.landmark}` : ''}, PIN: {order.pinCode || order.pin_code}</span>
                            </p>
                            <p className="delivery-info-line">
                              <Phone size={15} className="info-icon" />
                              <span><strong>Contact Telephone:</strong> {order.phoneNumber || order.phone_number}</span>
                            </p>
                            <p className="delivery-info-line">
                              <Mail size={15} className="info-icon" />
                              <span><strong>Confirmation Email:</strong> {order.email}</span>
                            </p>
                          </div>

                          {/* Hospital Fulfillment Status Tracker */}
                          <div className="fulfillment-status-card mt-3">
                            <span className="status-label">
                              <Truck size={14} className="icon-mr" /> Live Fulfillment Stage
                            </span>
                            <div className="fulfillment-step-pill">
                              <div className="step-badge-wrap">
                                <span className={`badge ${getStatusBadgeClass(status)}`}>
                                  {status.toUpperCase().replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p className="step-desc">
                                {status === 'confirmed' && 'Order confirmed. Stock allocated from medical equipment inventory.'}
                                {status === 'processing' && 'Safety verification, sensor calibration, and clinical packaging in progress.'}
                                {status === 'shipped' && 'Dispatched from central medical warehouse. In transit to destination.'}
                                {status === 'out_for_delivery' && 'Arrived at regional distribution center. Out for hospital receiving delivery.'}
                                {status === 'delivered' && 'Delivered to hospital receiving bay and acknowledged by recipient.'}
                                {status === 'cancelled' && 'Order cancelled. Reserved inventory was restored to stock.'}
                                {status === 'return_requested' && 'Return request initiated. Under review by biomedical quality team.'}
                                {status === 'returned' && 'Equipment returned, sanitized, and restocked into inventory.'}
                                {status === 'return_rejected' && `Return request rejected by quality review. Note: ${order.return_admin_response || order.returnAdminResponse || 'Criteria not met.'}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Action Footer */}
                      <div className="order-footer-actions">
                        {/* 1. Track Order Button */}
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate('/trackorder', { state: { orderId: order.id, status } })}
                        >
                          <Truck size={15} /> Track Shipment Progress
                        </button>

                        {/* 2. Receipt Summary */}
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => alert(`Invoice Summary for Order #${order.orderNumber || order.order_number}:\nRecipient: ${order.deliveryName || order.delivery_name}\nAddress: ${order.address}\nTotal Amount: ₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\nCurrent Status: ${status.toUpperCase().replace(/_/g, ' ')}`)}
                        >
                          <FileText size={15} /> View Receipt Summary
                        </button>

                        {/* 3. Cancel Order (Allowed ONLY before shipping) */}
                        {canCancel && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={actionLoading}
                          >
                            <XCircle size={15} /> Cancel Order
                          </button>
                        )}

                        {/* Locked cancellation message once shipped */}
                        {isShippedOrOut && (
                          <span className="cancel-locked-pill" title="Order has already been dispatched. Cancellation is not permitted after shipping.">
                            <Clock size={13} /> Cancellation locked (Product Dispatched)
                          </span>
                        )}

                        {/* 4. Request Return (Allowed once Delivered) */}
                        {isDelivered && (
                          <button
                            className="btn btn-warning btn-sm"
                            style={{ background: '#ea580c', borderColor: '#ea580c', color: '#fff' }}
                            onClick={() => handleOpenReturnModal(order)}
                            disabled={actionLoading}
                          >
                            <RotateCcw size={15} /> Request Equipment Return
                          </button>
                        )}

                        {/* Return Status Badges */}
                        {isReturnRequested && (
                          <span className="return-pending-badge">
                            <RotateCcw size={13} className="spin-slow" /> Return Under Quality Inspection
                          </span>
                        )}

                        {isReturned && (
                          <span className="returned-badge">
                            <CheckCircle2 size={13} /> Returned & Restocked
                          </span>
                        )}

                        {isReturnRejected && (
                          <span className="badge badge-danger text-xs p-2 d-inline-flex align-items-center gap-1" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                            <XCircle size={13} /> Return Rejected: {order.return_admin_response || order.returnAdminResponse || 'Does not meet warranty criteria'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Return Equipment Modal */}
        {returnModalOrder && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-box" style={{ maxWidth: '520px' }}>
              <div className="admin-modal-header">
                <div>
                  <h3 className="h4 font-heading mb-0">Request Equipment Return</h3>
                  <span className="text-xs text-muted">
                    Order #{returnModalOrder.orderNumber || returnModalOrder.order_number}
                  </span>
                </div>
                <button className="modal-close-x" onClick={() => setReturnModalOrder(null)}>✕</button>
              </div>

              <form onSubmit={handleSubmitReturn}>
                <div className="admin-modal-body">
                  <p className="text-sm text-secondary mb-3">
                    Submit a return request for clinical equipment delivered under this order. Our biomedical quality assurance team will verify the equipment calibration and authorize pickup.
                  </p>

                  <div className="mb-3">
                    <label className="form-label text-sm fw-bold">Reason for Equipment Return</label>
                    <select
                      className="form-select"
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                    >
                      <option value="Defective equipment or sensor calibration">Defective equipment or sensor calibration</option>
                      <option value="Damaged in transit / broken sterile seal">Damaged in transit / broken sterile seal</option>
                      <option value="Incompatible clinical specifications">Incompatible clinical specifications</option>
                      <option value="Surplus / Duplicate institutional order">Surplus / Duplicate institutional order</option>
                      <option value="Other">Other clinical reason</option>
                    </select>
                  </div>

                  {returnReason === 'Other' && (
                    <div className="mb-3">
                      <label className="form-label text-sm">Please specify reason</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        required
                        placeholder="Explain clinical or equipment issue..."
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="return-guideline-box p-3 rounded border text-xs text-muted bg-light">
                    <ShieldCheck size={16} className="text-primary icon-mr" />
                    Returned equipment must include all biomedical accessories, manuals, and protective casing.
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setReturnModalOrder(null)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Submitting...' : 'Submit Return Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
