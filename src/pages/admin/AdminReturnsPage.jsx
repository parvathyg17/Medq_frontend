import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  RefreshCw,
  Package,
  Calendar,
  Building2,
  Eye,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { ordersApi } from '../../api';

const AdminReturnsPage = () => {
  const [returnOrders, setReturnOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Decision Modal States
  const [activeModalOrder, setActiveModalOrder] = useState(null);
  const [modalType, setModalType] = useState(null); // 'approve' | 'reject' | 'view'
  const [decisionNote, setDecisionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.getReturns();
      const list = Array.isArray(data) ? data : (data?.results || []);
      setReturnOrders(list);
    } catch (err) {
      console.error('Failed to load return requests:', err);
      showNotice('Failed to retrieve return records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotice = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const openDecisionModal = (order, type) => {
    setActiveModalOrder(order);
    setModalType(type);
    if (type === 'approve') {
      setDecisionNote('Equipment received, biomedical calibration and sterile package inspected. Approved for inventory restock.');
    } else if (type === 'reject') {
      setDecisionNote('Return request rejected: Equipment seal broken or does not meet clinical return criteria.');
    } else {
      setDecisionNote('');
    }
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!activeModalOrder) return;

    setActionLoading(true);
    try {
      if (modalType === 'approve') {
        await ordersApi.approveReturn(activeModalOrder.id, decisionNote);
        showNotice(`Return approved for Order #${activeModalOrder.order_number || activeModalOrder.id}. Medical inventory has been restocked.`);
      } else if (modalType === 'reject') {
        await ordersApi.rejectReturn(activeModalOrder.id, decisionNote);
        showNotice(`Return rejected for Order #${activeModalOrder.order_number || activeModalOrder.id}. Customer notified.`);
      }
      setActiveModalOrder(null);
      setModalType(null);
      loadReturns();
    } catch (err) {
      console.error('Decision error:', err);
      showNotice(err.message || 'Failed to submit return decision.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getReturnBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'return_requested':
        return <span className="badge" style={{ background: '#ea580c', color: '#fff' }}>Pending Quality Review</span>;
      case 'returned':
        return <span className="badge badge-success">Approved & Restocked</span>;
      case 'return_rejected':
        return <span className="badge badge-danger">Return Rejected</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const filteredReturns = returnOrders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      o.order_number?.toLowerCase().includes(q) ||
      o.delivery_name?.toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q) ||
      o.return_reason?.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || o.status?.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = returnOrders.filter(o => o.status === 'return_requested').length;
  const approvedCount = returnOrders.filter(o => o.status === 'returned').length;
  const rejectedCount = returnOrders.filter(o => o.status === 'return_rejected').length;

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="h2 font-heading"><RotateCcw className="icon-mr" /> Biomedical Returns Management</h1>
          <p className="text-secondary text-sm">
            Separately review customer equipment return requests submitted after delivery. Verify clinical reasons and approve inventory restock or reject requests.
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={loadReturns} title="Refresh return requests">
            <RefreshCw size={16} /> Refresh Returns
          </button>
        </div>
      </div>

      {notification && (
        <div className={`alert ${notification.type === 'error' ? 'alert-error' : 'alert-success'} mb-4`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="admin-stats-grid mb-4">
        <div className="admin-stat-card">
          <div className="stat-icon-wrapper amber">
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Pending Quality Review</span>
            <span className="stat-number">{pendingCount}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper emerald">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Approved & Restocked</span>
            <span className="stat-number">{approvedCount}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper red">
            <XCircle size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Rejected Return Requests</span>
            <span className="stat-number">{rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 mb-4" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search return requests by order #, clinic name, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ minWidth: '220px' }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Return Decisions ({returnOrders.length})</option>
            <option value="RETURN_REQUESTED">Pending Review ({pendingCount})</option>
            <option value="RETURNED">Approved & Restocked ({approvedCount})</option>
            <option value="RETURN_REJECTED">Rejected Requests ({rejectedCount})</option>
          </select>
        </div>

        <div className="text-sm text-secondary">
          Showing <strong>{filteredReturns.length}</strong> return records
        </div>
      </div>

      {/* Returns Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center p-5 text-secondary">
            <div className="spinner-border text-primary mb-2" role="status"></div>
            <div>Retrieving clinical return records...</div>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="text-center p-5 text-secondary">
            <ShieldCheck size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
            <h4>No return requests found</h4>
            <p className="text-sm">When healthcare providers submit an equipment return after delivery, it will appear here for review.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Order # / Returned Date</th>
                  <th>Healthcare Client</th>
                  <th>Returned Equipment</th>
                  <th>Customer Return Reason</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', minWidth: '220px' }}>Review Decision</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map((o) => {
                  const items = o.order_items || o.orderItems || [];
                  const isPending = o.status === 'return_requested';
                  const isApproved = o.status === 'returned';
                  const isRejected = o.status === 'return_rejected';
                  const reqDate = o.return_requested_at || o.returnRequestedAt || o.updated_at;
                  const dateStr = reqDate ? new Date(reqDate).toLocaleDateString() : 'Recent';

                  return (
                    <tr key={o.id}>
                      <td>
                        <div className="fw-bold font-mono text-primary-700">
                          {o.order_number || `#ORD-${o.id}`}
                        </div>
                        <div className="text-xs text-secondary d-flex align-items-center gap-1 mt-1">
                          <Calendar size={12} /> Requested: {dateStr}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold text-slate-900">{o.delivery_name || 'Hospital Client'}</div>
                        <div className="text-xs text-secondary">{o.email}</div>
                        <div className="text-xs text-muted">{o.phone_number}</div>
                      </td>
                      <td>
                        <div className="text-sm fw-semibold text-slate-800">
                          {items.length} equipment {items.length !== 1 ? 'items' : 'item'}
                        </div>
                        <div className="text-xs text-secondary">
                          Value: ₹{parseFloat(o.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                      <td style={{ maxWidth: '280px' }}>
                        <div
                          className="p-2 rounded border text-xs"
                          style={{ background: '#fffbeb', borderColor: '#fef3c7', color: '#92400e' }}
                        >
                          <strong>Reason:</strong> {o.return_reason || o.returnReason || 'No specific reason entered.'}
                        </div>
                        {o.return_admin_response && (
                          <div className="text-xs text-muted mt-1">
                            <em>Admin Note: {o.return_admin_response}</em>
                          </div>
                        )}
                      </td>
                      <td>
                        {getReturnBadge(o.status)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.5rem' }}
                            onClick={() => openDecisionModal(o, 'view')}
                            title="Inspect Order Breakdown"
                          >
                            <Eye size={14} />
                          </button>

                          {isPending && (
                            <>
                              <button
                                className="btn btn-success btn-sm text-xs py-1 px-2"
                                onClick={() => openDecisionModal(o, 'approve')}
                                title="Approve Return and Restock Equipment"
                              >
                                <CheckCircle2 size={13} className="me-1" /> Approve
                              </button>
                              <button
                                className="btn btn-danger btn-sm text-xs py-1 px-2"
                                onClick={() => openDecisionModal(o, 'reject')}
                                title="Reject Return Request"
                              >
                                <XCircle size={13} className="me-1" /> Reject
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <span className="text-xs text-success fw-semibold">
                              ✓ Restocked
                            </span>
                          )}

                          {isRejected && (
                            <span className="text-xs text-danger fw-semibold">
                              ✕ Rejected
                            </span>
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

      {/* Decision Modal (Approve / Reject / View) */}
      {activeModalOrder && modalType && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box" style={{ maxWidth: modalType === 'view' ? '680px' : '520px' }}>
            <div className="admin-modal-header">
              <div>
                <h3 className="h4 font-heading mb-0">
                  {modalType === 'approve' && 'Approve Equipment Return'}
                  {modalType === 'reject' && 'Reject Equipment Return'}
                  {modalType === 'view' && 'Return Inspection Details'}
                </h3>
                <span className="text-xs font-mono text-primary-700">
                  Order #{activeModalOrder.order_number || activeModalOrder.id}
                </span>
              </div>
              <button className="modal-close-x" onClick={() => setActiveModalOrder(null)}>✕</button>
            </div>

            {modalType === 'view' ? (
              <div className="admin-modal-body">
                {/* View Details */}
                <div className="mb-3 p-3 bg-light rounded border text-sm">
                  <p className="mb-1"><strong>Facility Recipient:</strong> {activeModalOrder.delivery_name}</p>
                  <p className="mb-1"><strong>Address:</strong> {activeModalOrder.address}, PIN: {activeModalOrder.pin_code}</p>
                  <p className="mb-1"><strong>Customer Stated Reason:</strong> {activeModalOrder.return_reason || 'N/A'}</p>
                  {activeModalOrder.return_admin_response && (
                    <p className="mb-0 text-primary"><strong>Admin Response:</strong> {activeModalOrder.return_admin_response}</p>
                  )}
                </div>

                <h5 className="font-heading mb-2">Purchased Equipment Items</h5>
                <div className="table-responsive border rounded mb-3">
                  <table className="table mb-0 text-sm align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '56px' }}>Device</th>
                        <th>Product Name</th>
                        <th>SKU</th>
                        <th>Qty</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeModalOrder.order_items || activeModalOrder.orderItems || []).map((it, idx) => {
                        const pImg = it.imageUrl || it.image || it.productImage || it.product_image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=60';
                        return (
                          <tr key={idx}>
                            <td>
                              <img
                                src={pImg}
                                alt={it.product_name || it.productName}
                                className="admin-item-thumb"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=60';
                                }}
                              />
                            </td>
                            <td className="fw-semibold text-slate-900">{it.product_name || it.productName}</td>
                            <td className="font-mono text-xs">{it.product_sku || it.productSku || 'N/A'}</td>
                            <td><span className="badge badge-secondary">{it.quantity}</span></td>
                            <td style={{ textAlign: 'right' }} className="fw-bold font-mono">
                              ₹{parseFloat(it.total_price || (it.price * it.quantity)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDecisionSubmit}>
                <div className="admin-modal-body">
                  <div className="mb-3 p-3 rounded border text-sm bg-light">
                    <p className="mb-1"><strong>Customer:</strong> {activeModalOrder.delivery_name} ({activeModalOrder.email})</p>
                    <p className="mb-0"><strong>Customer's Reason:</strong> <em>"{activeModalOrder.return_reason}"</em></p>
                  </div>

                  {modalType === 'approve' && (
                    <div className="alert alert-success text-xs mb-3">
                      <CheckCircle2 size={14} className="me-1 inline" />
                      Approving this request will safely replenish all equipment items in this order back into active warehouse inventory.
                    </div>
                  )}

                  {modalType === 'reject' && (
                    <div className="alert alert-error text-xs mb-3">
                      <XCircle size={14} className="me-1 inline" />
                      Rejecting this request will mark the return as rejected and will NOT alter inventory stock quantities.
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label text-sm fw-bold">
                      {modalType === 'approve' ? 'Biomedical Quality Assurance Note' : 'Rejection Justification for Customer'}
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      required
                      value={decisionNote}
                      onChange={(e) => setDecisionNote(e.target.value)}
                      placeholder="Enter verification notes or rejection justification..."
                    />
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveModalOrder(null)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn ${modalType === 'approve' ? 'btn-success' : 'btn-danger'} btn-sm`}
                    disabled={actionLoading || !decisionNote.trim()}
                  >
                    {actionLoading ? 'Processing...' : modalType === 'approve' ? 'Confirm Approval & Restock' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            )}

            {modalType === 'view' && (
              <div className="admin-modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveModalOrder(null)}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReturnsPage;
