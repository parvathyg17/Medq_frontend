import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Truck,
  CheckCircle2,
  Package,
  Clock,
  Search,
  ArrowLeft,
  ShieldCheck,
  Building2,
  AlertCircle,
  RotateCcw,
  MapPin,
  Calendar
} from 'lucide-react';
import { ordersApi } from '../api';
import './TrackOrderPage.css';

const TrackOrderPage = () => {
  const location = useLocation();
  const queryOrderId = new URLSearchParams(location.search).get('orderId');
  const [orderId, setOrderId] = useState(location.state?.orderId || queryOrderId || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrackOrder = async (idToSearch) => {
    if (!idToSearch) return;
    try {
      setLoading(true);
      setError(null);
      const data = await ordersApi.getOrderById(idToSearch);
      setOrder(data);
    } catch (err) {
      setError(err.message || `Order '${idToSearch}' could not be located in our clinical tracking system.`);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const targetId = location.state?.orderId || queryOrderId;
    if (targetId) {
      setOrderId(targetId);
      fetchTrackOrder(targetId);
    }
  }, [location.state, queryOrderId]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (orderId && orderId.trim()) {
      fetchTrackOrder(orderId.trim());
    }
  };

  // 5-Stage Hospital Fulfillment Progress
  const steps = [
    { title: 'Order Confirmed', desc: 'Order registered & stock allocated', statusKey: 'confirmed' },
    { title: 'Biomedical Verification', desc: 'Testing, calibration & sterile packaging', statusKey: 'processing' },
    { title: 'Dispatched / Shipped', desc: 'Dispatched from central medical warehouse', statusKey: 'shipped' },
    { title: 'Out for Delivery', desc: 'En route to hospital / clinic receiving bay', statusKey: 'out_for_delivery' },
    { title: 'Delivered', desc: 'Received & acknowledged by clinical department', statusKey: 'delivered' }
  ];

  const getStepIndex = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') return 4;
    if (s === 'out_for_delivery') return 3;
    if (s === 'shipped') return 2;
    if (s === 'processing') return 1;
    if (s === 'confirmed' || s === 'pending') return 0;
    if (s === 'cancelled' || s === 'returned' || s === 'return_requested' || s === 'return_rejected') return -1;
    return 0;
  };

  const currentStep = getStepIndex(order?.status);
  const normalizedStatus = (order?.status || '').toLowerCase();

  return (
    <div className="track-order-page py-4">
      <div className="med-container">
        <div className="track-header text-center">
          <Link to="/myorders" className="back-link mb-3 d-inline-flex">
            <ArrowLeft size={16} /> Return to Orders
          </Link>
          <h1 className="page-title">Live Hospital Shipment Tracking</h1>
          <p className="page-subtitle">Monitor real-time fulfillment and transit stages for your medical equipment.</p>

          {/* Quick Order Lookup Input */}
          <form className="track-search-bar" onSubmit={handleSearch}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Enter Order ID or Number (e.g. 1, MEDQ-4HMZF9)..."
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="track-input"
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Locating...' : 'Track'}
            </button>
          </form>
        </div>

        {error && (
          <div className="alert-banner alert-danger text-center max-w-600 mx-auto mt-4">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {order && (
          <div className="track-details-container med-card mt-5 animate-fade-in">
            {/* Order Heading Info */}
            <div className="track-meta-header">
              <div>
                <span className="order-tag">Order #{order.id} ({order.orderNumber || order.order_number})</span>
                <h2>{order.deliveryName || order.delivery_name}</h2>
                <p className="text-muted"><Building2 size={15} /> {order.address}, PIN: {order.pinCode || order.pin_code}</p>
                <p className="text-xs text-muted d-flex align-items-center gap-1 mt-1">
                  <Calendar size={13} /> Order Placed: {new Date(order.createdAt || order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-end">
                <span className="meta-price-tag">₹{parseFloat(order.totalAmount || order.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                <span className={`badge badge-lg mt-2 ${normalizedStatus === 'delivered' ? 'badge-success' : normalizedStatus === 'cancelled' ? 'badge-danger' : normalizedStatus === 'shipped' ? 'badge-purple' : 'badge-info'}`}>
                  {order.status?.toUpperCase().replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Special Status Notices */}
            {normalizedStatus === 'cancelled' && (
              <div className="cancelled-notice-box mt-4">
                <AlertCircle size={28} />
                <div>
                  <h4>This Order Was Cancelled</h4>
                  <p>Reserved medical inventory was restored to stock. No hospital delivery is in transit.</p>
                </div>
              </div>
            )}

            {normalizedStatus === 'return_requested' && (
              <div className="alert-banner alert-warning mt-4 p-3 d-flex align-items-center gap-3">
                <RotateCcw size={28} />
                <div>
                  <h4 className="mb-1">Equipment Return Requested</h4>
                  <p className="mb-0 text-sm">A return authorization request has been initiated by the healthcare client. Our biomedical engineering team is reviewing equipment calibration and serials.</p>
                </div>
              </div>
            )}

            {normalizedStatus === 'returned' && (
              <div className="alert-banner alert-neutral mt-4 p-3 d-flex align-items-center gap-3" style={{ background: '#f1f5f9' }}>
                <CheckCircle2 size={28} className="text-success" />
                <div>
                  <h4 className="mb-1">Equipment Returned & Restocked</h4>
                  <p className="mb-0 text-sm">The medical equipment was safely returned, quality tested, and restocked into clinical inventory.</p>
                </div>
              </div>
            )}

            {normalizedStatus === 'return_rejected' && (
              <div className="alert-banner alert-danger mt-4 p-3 d-flex align-items-center gap-3">
                <AlertCircle size={28} />
                <div>
                  <h4 className="mb-1">Equipment Return Request Rejected</h4>
                  <p className="mb-0 text-sm">
                    The return request was reviewed by biomedical engineering and could not be authorized.
                    {order.return_admin_response || order.returnAdminResponse ? ` Note: ${order.return_admin_response || order.returnAdminResponse}` : ''}
                  </p>
                </div>
              </div>
            )}

            {/* 5-Step Stepper Timeline (for active fulfillment) */}
            {normalizedStatus !== 'cancelled' && normalizedStatus !== 'returned' && normalizedStatus !== 'return_rejected' && (
              <div className="stepper-horizontal mt-5">
                {steps.map((st, idx) => {
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div key={idx} className={`step-node ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                      <div className="node-icon-circle">
                        {isDone ? <CheckCircle2 size={20} /> : <span>{idx + 1}</span>}
                      </div>
                      <div className="node-text-wrap">
                        <span className="node-title">{st.title}</span>
                        <span className="node-desc">{st.desc}</span>
                      </div>
                      {idx < steps.length - 1 && <div className={`step-connector-line ${idx < currentStep ? 'filled' : ''}`} />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Equipment Snapshot in this Shipment */}
            <div className="tracked-items-section mt-5">
              <h3>Equipment in this Shipment</h3>
              <div className="tracked-items-grid">
                {(order.orderItems || order.order_items || []).map((item, idx) => {
                  const pImage = item.imageUrl || item.image || item.productImage || item.product_image || item.product?.image || item.product?.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=60';
                  return (
                    <div key={idx} className="tracked-item-pill">
                      <img
                        src={pImage}
                        alt={item.productName || item.product_name}
                        className="tracked-item-thumb"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=60';
                        }}
                      />
                      <div className="tracked-item-details">
                        <span className="item-name">{item.productName || item.product_name}</span>
                        {(item.productSku || item.product_sku) && (
                          <span className="item-sku-tag">SKU: {item.productSku || item.product_sku}</span>
                        )}
                      </div>
                      <span className="item-qty">x{item.quantity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrderPage;
