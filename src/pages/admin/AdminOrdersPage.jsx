import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Search,
  Filter,
  Eye,
  XCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Package,
  Calendar,
  MapPin,
  CreditCard,
  RotateCcw,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { ordersApi } from '../../api';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modals & Action states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const ordersRes = await ordersApi.getOrders();
      const oList = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.results || []);
      setOrders(oList);
    } catch (err) {
      console.error('Failed to load platform orders:', err);
      showNotice('Failed to fetch platform orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotice = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      showNotice(`Order #${orderId} status advanced to ${newStatus.toUpperCase().replace(/_/g, ' ')}.`);
      loadData();
    } catch (err) {
      console.error('Update status error:', err);
      showNotice(err.message || 'Failed to update order status. Status cannot go backwards.', 'error');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Cancel Order #${orderId}? Reserved medical inventory will be automatically restored to stock.`)) return;
    try {
      await ordersApi.cancelOrder(orderId);
      showNotice(`Order #${orderId} cancelled and inventory restocked.`);
      loadData();
    } catch (err) {
      console.error('Cancel order error:', err);
      showNotice(err.message || 'Failed to cancel order.', 'error');
    }
  };

  // Helper to determine strictly forward valid transition options
  const getNextStatusOptions = (currentStatus) => {
    const s = (currentStatus || '').toLowerCase();
    switch (s) {
      case 'pending':
        return [
          { value: 'pending', label: 'Pending (Current)', disabled: true },
          { value: 'confirmed', label: 'Advance to Confirmed' },
          { value: 'cancelled', label: 'Cancel Order' },
        ];
      case 'confirmed':
        return [
          { value: 'confirmed', label: 'Confirmed (Current)', disabled: true },
          { value: 'processing', label: 'Advance to Processing' },
          { value: 'cancelled', label: 'Cancel Order' },
        ];
      case 'processing':
        return [
          { value: 'processing', label: 'Processing (Current)', disabled: true },
          { value: 'shipped', label: 'Advance to Shipped' },
          { value: 'cancelled', label: 'Cancel Order' },
        ];
      case 'shipped':
        return [
          { value: 'shipped', label: 'Shipped (Locked)', disabled: true },
          { value: 'out_for_delivery', label: 'Advance to Out for Delivery' },
        ];
      case 'out_for_delivery':
        return [
          { value: 'out_for_delivery', label: 'Out for Delivery (Locked)', disabled: true },
          { value: 'delivered', label: 'Advance to Delivered' },
        ];
      case 'delivered':
        return [
          { value: 'delivered', label: 'Delivered (Complete)', disabled: true },
        ];
      case 'return_requested':
        return [
          { value: 'return_requested', label: 'Return Under Review', disabled: true },
        ];
      case 'returned':
        return [
          { value: 'returned', label: 'Returned & Restocked', disabled: true },
        ];
      case 'return_rejected':
        return [
          { value: 'return_rejected', label: 'Return Rejected', disabled: true },
        ];
      case 'cancelled':
        return [
          { value: 'cancelled', label: 'Cancelled (Closed)', disabled: true },
        ];
      default:
        return [{ value: s, label: s, disabled: true }];
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'confirmed':
        return <span className="badge badge-primary">Confirmed</span>;
      case 'processing':
        return <span className="badge badge-warning" style={{ background: '#f59e0b', color: '#fff' }}>Processing</span>;
      case 'shipped':
        return <span className="badge" style={{ background: '#7e22ce', color: '#fff' }}>Shipped</span>;
      case 'out_for_delivery':
        return <span className="badge" style={{ background: '#0284c7', color: '#fff' }}>Out for Delivery</span>;
      case 'delivered':
        return <span className="badge badge-success">Delivered</span>;
      case 'cancelled':
        return <span className="badge badge-danger">Cancelled</span>;
      case 'return_requested':
        return <span className="badge" style={{ background: '#ea580c', color: '#fff' }}>Return Requested</span>;
      case 'returned':
        return <span className="badge" style={{ background: '#475569', color: '#fff' }}>Returned & Restocked</span>;
      case 'return_rejected':
        return <span className="badge badge-danger" style={{ background: '#dc2626', color: '#fff' }}>Return Rejected</span>;
      default:
        return <span className="badge badge-secondary">{status || 'Pending'}</span>;
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      o.order_number?.toLowerCase().includes(q) ||
      o.delivery_name?.toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q) ||
      o.phone_number?.includes(q);

    const matchesStatus = statusFilter === 'ALL' || o.status?.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="h2 font-heading">Fulfillment & Orders</h1>
          <p className="text-secondary text-sm">
            Manage hospital equipment orders and advance stages (Confirmed → Processing → Shipped → Out for Delivery → Delivered). 
            <strong> Status moves forward only.</strong> Equipment return requests are initiated by customers upon delivery and managed separately in the Returns portal.
          </p>
        </div>
        <div className="admin-header-actions" style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/admin/returns" className="btn btn-primary btn-sm" style={{ background: '#ea580c', borderColor: '#ea580c' }}>
            <RotateCcw size={16} /> Returns Portal
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={loadData} title="Refresh orders">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {notification && (
        <div className={`alert ${notification.type === 'error' ? 'alert-error' : 'alert-success'} mb-4`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card p-4 mb-4" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by Order #, healthcare client, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ minWidth: '200px' }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RETURN_REQUESTED">Return Requested</option>
            <option value="RETURNED">Returned</option>
            <option value="RETURN_REJECTED">Return Rejected</option>
          </select>
        </div>

        <div className="text-sm text-secondary">
          Showing <strong>{filteredOrders.length}</strong> of {orders.length} orders
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center p-5 text-secondary">
            <div className="spinner-border text-primary mb-2" role="status"></div>
            <div>Retrieving orders...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center p-5 text-secondary">
            <Package size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
            <h4>No orders match your criteria</h4>
            <p className="text-sm">New orders placed by healthcare providers will display here.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Order # / Date</th>
                  <th>Healthcare Client</th>
                  <th>Total Amount</th>
                  <th>Current Status</th>
                  <th>Quick Advance</th>
                  <th style={{ textAlign: 'right', minWidth: '220px' }}>Admin Management</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  const items = o.order_items || o.orderItems || [];
                  const dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A';
                  const s = (o.status || '').toLowerCase();
                  const canCancel = ['pending', 'confirmed', 'processing'].includes(s);
                  const isDelivered = s === 'delivered';
                  const isReturnRequested = s === 'return_requested';

                  return (
                    <tr key={o.id}>
                      <td>
                        <div className="fw-bold font-mono text-primary-700">
                          {o.order_number || `#ORD-${o.id}`}
                        </div>
                        <div className="text-xs text-secondary d-flex align-items-center gap-1 mt-1">
                          <Calendar size={12} /> {dateStr}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold text-slate-900">{o.delivery_name || 'Guest Client'}</div>
                        <div className="text-xs text-secondary">{o.email}</div>
                        <div className="text-xs text-muted">{o.phone_number}</div>
                      </td>
                      <td>
                        <div className="fw-bold text-slate-900 font-mono">
                          ₹{parseFloat(o.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-secondary">
                          {items.length} item{items.length !== 1 ? 's' : ''} ({o.payment_method?.toUpperCase() || 'COD'})
                        </div>
                        {items.length > 0 && (
                          <div className="order-thumb-stack" title={items.map(i => i.product_name || i.productName).join(', ')}>
                            {items.slice(0, 3).map((it, iIdx) => {
                              const itImg = it.imageUrl || it.image || it.productImage || it.product_image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=60';
                              return (
                                <img
                                  key={iIdx}
                                  src={itImg}
                                  alt={it.product_name || it.productName || 'Equipment'}
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
                      </td>
                      <td>
                        {getStatusBadge(o.status)}
                      </td>
                      <td>
                        {/* Quick One-Click Status Advance */}
                        {s === 'confirmed' && (
                          <button
                            className="btn btn-warning btn-sm text-xs py-1 px-2"
                            onClick={() => handleStatusChange(o.id, 'processing')}
                            title="Move to Biomedical Verification & Packing"
                          >
                            Process →
                          </button>
                        )}
                        {s === 'processing' && (
                          <button
                            className="btn btn-sm text-xs py-1 px-2"
                            style={{ background: '#7e22ce', color: '#fff' }}
                            onClick={() => handleStatusChange(o.id, 'shipped')}
                            title="Mark as Shipped / Dispatched"
                          >
                            Ship Out →
                          </button>
                        )}
                        {s === 'shipped' && (
                          <button
                            className="btn btn-sm text-xs py-1 px-2"
                            style={{ background: '#0284c7', color: '#fff' }}
                            onClick={() => handleStatusChange(o.id, 'out_for_delivery')}
                            title="Mark as Out for Hospital Delivery"
                          >
                            Out for Delivery →
                          </button>
                        )}
                        {s === 'out_for_delivery' && (
                          <button
                            className="btn btn-success btn-sm text-xs py-1 px-2"
                            onClick={() => handleStatusChange(o.id, 'delivered')}
                            title="Acknowledge Delivery at Hospital"
                          >
                            Mark Delivered ✓
                          </button>
                        )}
                        {isReturnRequested && (
                          <Link
                            to="/admin/returns"
                            className="btn btn-sm text-xs py-1 px-2"
                            style={{ background: '#ea580c', color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            title="Review return in Returns section"
                          >
                            <RotateCcw size={12} /> Review Return →
                          </Link>
                        )}
                        {(s === 'delivered' || s === 'cancelled' || s === 'returned' || s === 'return_rejected') && (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          {/* Direct Status Selector (Forward-Only) */}
                          {(() => {
                            const options = getNextStatusOptions(o.status);
                            const hasActiveChoices = options.some(opt => !opt.disabled);
                            return (
                              <select
                                className="form-select form-select-sm"
                                style={{ width: '150px', fontSize: '0.78rem', padding: '0.25rem 0.5rem', opacity: hasActiveChoices ? 1 : 0.7 }}
                                value={o.status?.toLowerCase() || 'pending'}
                                disabled={!hasActiveChoices}
                                title={hasActiveChoices ? "Advance status forward" : "Status locked (cannot move backward)"}
                                onChange={(e) => {
                                  if (e.target.value && e.target.value !== o.status?.toLowerCase()) {
                                    handleStatusChange(o.id, e.target.value);
                                  }
                                }}
                              >
                                {options.map((opt) => (
                                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            );
                          })()}

                          {/* View Breakdown */}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.5rem' }}
                            onClick={() => setSelectedOrder(o)}
                            title="View Full Order Breakdown"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Cancel Order (Allowed ONLY before shipping) */}
                          {canCancel && (
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: '0.3rem 0.5rem' }}
                              onClick={() => handleCancelOrder(o.id)}
                              title="Cancel & Restock Inventory"
                            >
                              <XCircle size={14} />
                            </button>
                          )}

                          {/* Return review link in Returns portal */}
                          {isReturnRequested && (
                            <Link
                              to="/admin/returns"
                              className="btn btn-outline btn-sm text-xs"
                              style={{ padding: '0.3rem 0.5rem', color: '#ea580c', borderColor: '#ea580c' }}
                              title="Manage Return in Dedicated Returns Portal"
                            >
                              <RotateCcw size={13} />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box" style={{ maxWidth: '680px' }}>
            <div className="admin-modal-header">
              <div>
                <h3 className="h4 font-heading mb-0">Order Breakdown</h3>
                <span className="text-xs font-mono text-primary-700">
                  {selectedOrder.order_number || `#ORD-${selectedOrder.id}`}
                </span>
              </div>
              <button className="modal-close-x" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="admin-modal-body">
              {/* Shipping & Payment summary */}
              <div className="row g-3 mb-4" style={{ background: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div className="col-md-6">
                  <div className="text-xs text-secondary text-uppercase fw-bold mb-1 d-flex align-items-center gap-1">
                    <MapPin size={12} /> Facility Destination
                  </div>
                  <div className="fw-semibold text-slate-800">{selectedOrder.delivery_name}</div>
                  <div className="text-sm text-secondary">{selectedOrder.address}</div>
                  {selectedOrder.landmark && <div className="text-xs text-muted">Landmark: {selectedOrder.landmark}</div>}
                  <div className="text-xs text-secondary">PIN: {selectedOrder.pin_code} • Phone: {selectedOrder.phone_number}</div>
                </div>

                <div className="col-md-6">
                  <div className="text-xs text-secondary text-uppercase fw-bold mb-1 d-flex align-items-center gap-1">
                    <CreditCard size={12} /> Payment & Fulfillment
                  </div>
                  <div className="text-sm mb-1">
                    Payment Method: <strong className="text-uppercase">{selectedOrder.payment_method || 'COD'}</strong>
                  </div>
                  <div className="text-sm mb-1">
                    Payment Status: <span className="badge badge-outline">{selectedOrder.payment_status || 'Pending'}</span>
                  </div>
                  <div className="text-sm">
                    Fulfillment Status: {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <h5 className="font-heading mb-2">Purchased Medical Equipment</h5>
              <div className="table-responsive border rounded mb-3">
                <table className="table mb-0 text-sm align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '56px' }}>Device</th>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th>Unit Price</th>
                      <th>Qty</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.order_items || selectedOrder.orderItems || []).map((item, idx) => {
                      const pImg = item.imageUrl || item.image || item.productImage || item.product_image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=60';
                      return (
                        <tr key={idx}>
                          <td>
                            <img
                              src={pImg}
                              alt={item.product_name || item.productName}
                              className="admin-item-thumb"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=60';
                              }}
                            />
                          </td>
                          <td className="fw-semibold text-slate-900">{item.product_name || item.productName}</td>
                          <td className="font-mono text-xs text-muted">{item.product_sku || item.productSku || 'N/A'}</td>
                          <td>₹{parseFloat(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td><span className="badge badge-secondary">{item.quantity}</span></td>
                          <td style={{ textAlign: 'right' }} className="fw-bold font-mono">
                            ₹{parseFloat(item.total_price || (item.price * item.quantity)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Authoritative Financials */}
              <div className="d-flex justify-content-end">
                <div style={{ width: '280px' }}>
                  <div className="d-flex justify-content-between text-sm py-1">
                    <span className="text-secondary">Subtotal:</span>
                    <span>₹{parseFloat(selectedOrder.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="d-flex justify-content-between text-sm py-1">
                    <span className="text-secondary">Hospital Dispatch Fee:</span>
                    <span className="text-success fw-bold">FREE</span>
                  </div>
                  <div className="d-flex justify-content-between fw-bold font-heading text-lg pt-2 border-top">
                    <span>Grand Total:</span>
                    <span className="text-primary-700">₹{parseFloat(selectedOrder.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
