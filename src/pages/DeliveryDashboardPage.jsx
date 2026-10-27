import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Clock,
  RefreshCw,
  Calendar,
  DollarSign,
  ShieldAlert,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../api';
import './DeliveryDashboard.css';

const DeliveryDashboardPage = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ACTIVE'); // 'ACTIVE', 'DELIVERED', 'ALL'
  const [updatingId, setUpdatingId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadAssignedOrders();
    }
  }, [user]);

  const loadAssignedOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.getAssignedOrders(user.id);
      const list = Array.isArray(data) ? data : (data?.results || []);
      setOrders(list);
    } catch (err) {
      console.error('Failed to load assigned deliveries:', err);
      showNotice('Could not fetch assigned orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotice = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      showNotice(`Order #${orderId} marked as ${newStatus.toUpperCase()}.`);
      loadAssignedOrders();
    } catch (err) {
      console.error('Error updating status:', err);
      showNotice('Failed to update delivery status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const activeDeliveries = orders.filter(o => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status?.toLowerCase()));
  const completedDeliveries = orders.filter(o => o.status?.toLowerCase() === 'delivered');

  const filteredOrders = orders.filter(o => {
    const s = o.status?.toLowerCase();
    if (filterTab === 'ACTIVE') return ['pending', 'confirmed', 'processing', 'shipped'].includes(s);
    if (filterTab === 'DELIVERED') return s === 'delivered';
    return true;
  });

  return (
    <div className="delivery-dashboard-wrapper">
      <div className="container">
        {/* Hero Header */}
        <div className="delivery-hero">
          <div className="delivery-profile-info">
            <div className="delivery-avatar">
              <Truck size={32} />
            </div>
            <div>
              <span className="badge badge-outline" style={{ color: 'var(--primary-300)', borderColor: 'rgba(255,255,255,0.2)' }}>
                Field Logistics Specialist
              </span>
              <h2 className="h3 font-heading text-white mb-1 mt-1">
                {user?.full_name || 'Delivery Partner'}
              </h2>
              <p className="text-xs text-slate-300 mb-0">
                Authorized MEDQ Healthcare Equipment Dispatcher
              </p>
            </div>
          </div>

          <div className="delivery-stats-row">
            <div className="delivery-stat-pill">
              <span className="num text-primary-400">{orders.length}</span>
              <span className="lbl">Total Assigned</span>
            </div>
            <div className="delivery-stat-pill">
              <span className="num text-amber-400">{activeDeliveries.length}</span>
              <span className="lbl">Active Pending</span>
            </div>
            <div className="delivery-stat-pill">
              <span className="num text-emerald-400">{completedDeliveries.length}</span>
              <span className="lbl">Delivered</span>
            </div>
          </div>
        </div>

        {notification && (
          <div className={`alert ${notification.type === 'error' ? 'alert-error' : 'alert-success'} mb-4`}>
            {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{notification.msg}</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div className="d-flex gap-2">
            <button
              className={`btn btn-sm ${filterTab === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterTab('ACTIVE')}
            >
              Active Dispatches ({activeDeliveries.length})
            </button>
            <button
              className={`btn btn-sm ${filterTab === 'DELIVERED' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterTab('DELIVERED')}
            >
              Completed ({completedDeliveries.length})
            </button>
            <button
              className={`btn btn-sm ${filterTab === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterTab('ALL')}
            >
              All Assignments ({orders.length})
            </button>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-secondary btn-sm" onClick={loadAssignedOrders} title="Refresh Deliveries">
              <RefreshCw size={15} className="me-1" /> Sync Orders
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              title="Sign Out"
            >
              <LogOut size={15} className="me-1" /> Sign Out
            </button>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center p-5 text-secondary card">
            <div className="spinner-border text-primary mb-2" role="status"></div>
            <div>Syncing logistics assignments...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card text-center p-5 text-secondary">
            <PackageCheck size={56} style={{ opacity: 0.3, margin: '0 auto 1rem', color: 'var(--primary-600)' }} />
            <h4>No active shipments in this view</h4>
            <p className="text-sm">You're all caught up! When hospital orders are assigned to your route, they will appear here.</p>
          </div>
        ) : (
          <div>
            {filteredOrders.map((o) => {
              const items = o.order_items || o.orderItems || [];
              const isDelivered = o.status?.toLowerCase() === 'delivered';
              const isShipped = o.status?.toLowerCase() === 'shipped';

              return (
                <div key={o.id} className="delivery-order-card">
                  {/* Header */}
                  <div className="delivery-card-header">
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold font-mono text-primary-700 fs-6">
                          {o.order_number || `#ORD-${o.id}`}
                        </span>
                        <span className={`badge ${
                          isDelivered ? 'badge-success' : isShipped ? 'badge-primary' : 'badge-warning'
                        }`}>
                          {o.status?.toUpperCase() || 'ASSIGNED'}
                        </span>
                      </div>
                      <div className="text-xs text-secondary d-flex align-items-center gap-1 mt-1">
                        <Calendar size={12} /> Placed {o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>

                    <div className="text-end">
                      <div className="fw-bold fs-5 font-mono text-slate-900">
                        ₹{parseFloat(o.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-secondary text-uppercase fw-semibold">
                        {o.payment_method === 'cod' ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Cash on Delivery (Collect ₹{parseFloat(o.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Prepaid ({o.payment_method?.toUpperCase()})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Destination Info */}
                  <div className="delivery-dest-box">
                    <div className="row g-2">
                      <div className="col-md-7">
                        <div className="text-xs text-secondary text-uppercase fw-bold mb-1 d-flex align-items-center gap-1">
                          <MapPin size={13} className="text-primary-600" /> Hospital / Clinic Destination
                        </div>
                        <div className="fw-bold text-slate-900">{o.delivery_name}</div>
                        <div className="text-sm text-slate-700">{o.address}</div>
                        {o.landmark && <div className="text-xs text-secondary">Landmark: {o.landmark}</div>}
                        <div className="text-xs text-secondary font-mono">Postal Code: {o.pin_code}</div>
                      </div>

                      <div className="col-md-5 d-flex flex-column justify-content-center">
                        <div className="text-xs text-secondary text-uppercase fw-bold mb-1">Contact Recipient</div>
                        <div className="text-sm mb-2">{o.email}</div>
                        {o.phone_number && (
                          <a
                            href={`tel:${o.phone_number}`}
                            className="btn btn-outline btn-sm d-inline-flex align-items-center gap-2"
                            style={{ width: 'fit-content' }}
                          >
                            <Phone size={14} className="text-emerald-600" /> Call {o.phone_number}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Purchased Items List */}
                  <div className="mb-3">
                    <div className="text-xs text-secondary text-uppercase fw-bold mb-2">
                      Equipment to Deliver ({items.length} item{items.length !== 1 ? 's' : ''})
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {items.map((it, idx) => {
                        const itImg = it.imageUrl || it.image || it.productImage || it.product_image || it.product?.image || it.product?.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=60';
                        return (
                          <div
                            key={idx}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid var(--border-color)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                            }}
                          >
                            <img
                              src={itImg}
                              alt={it.product_name || it.productName}
                              style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=60';
                              }}
                            />
                            <span className="fw-semibold text-slate-900">{it.product_name || it.productName}</span>
                            <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>Qty: {it.quantity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="action-bar-delivery">
                    <div className="text-xs text-secondary">
                      {isDelivered ? (
                        <span className="text-emerald-600 fw-semibold d-flex align-items-center gap-1">
                          <CheckCircle2 size={14} /> Completed & Verified
                        </span>
                      ) : (
                        <span>Update shipment status as you progress on your route.</span>
                      )}
                    </div>

                    {!isDelivered && (
                      <div className="d-flex gap-2">
                        {!isShipped && (
                          <button
                            className="btn btn-secondary btn-sm"
                            disabled={updatingId === o.id}
                            onClick={() => handleUpdateStatus(o.id, 'shipped')}
                          >
                            <Truck size={14} className="me-1" /> Mark Out for Delivery
                          </button>
                        )}

                        <button
                          className="btn btn-primary btn-sm"
                          disabled={updatingId === o.id}
                          onClick={() => handleUpdateStatus(o.id, 'delivered')}
                        >
                          <CheckCircle2 size={14} className="me-1" /> Confirm Handed Over & Delivered
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboardPage;
