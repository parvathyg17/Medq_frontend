import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  Box,
  Truck,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { adminApi } from '../../api';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalDeliveryBoys: 0,
    lowStockCount: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getStats();
        setStats(data);
      } catch (err) {
        console.warn('Error fetching admin stats:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const monthlySales = [
    { month: 'Jan', sales: 45000 },
    { month: 'Feb', sales: 52000 },
    { month: 'Mar', sales: 68000 },
    { month: 'Apr', sales: 74000 },
    { month: 'May', sales: 89000 },
    { month: 'Jun', sales: 92000 },
    { month: 'Jul', sales: 110000 },
    { month: 'Aug', sales: 125000 },
    { month: 'Sep', sales: 140000 },
    { month: 'Oct', sales: 165000 },
  ];

  const maxSale = Math.max(...monthlySales.map((m) => m.sales));

  return (
    <div className="admin-dashboard-page">
      <div className="admin-page-header">
        <div>
          <h1 className="page-title">Hospital Equipment Operations Dashboard</h1>
          <p className="page-subtitle">Real-time platform metrics, sales analytics, and fulfillment status.</p>
        </div>
        <Link to="/admin/products" className="btn btn-primary">
          + Add New Equipment
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon-wrapper blue">
            <Users size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Total Customers</span>
            <span className="stat-number">{stats.totalUsers}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper teal">
            <Package size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Total Orders</span>
            <span className="stat-number">{stats.totalOrders}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper emerald">
            <Box size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Active Equipment</span>
            <span className="stat-number">{stats.totalProducts}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper purple">
            <Truck size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Tracked Shipments</span>
            <span className="stat-number">{stats.totalOrders}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper amber">
            <IndianRupee size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Platform Revenue</span>
            <span className="stat-number">₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper amber">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Low Stock Alerts</span>
            <span className="stat-number text-danger">{stats.lowStockCount}</span>
          </div>
        </div>
      </div>

      {/* Sales Overview Bar Graphic */}
      <div className="med-card mb-4">
        <div className="d-flex-between mb-4">
          <div>
            <h3><TrendingUp size={20} className="icon-mr text-teal" /> Clinical Equipment Sales Volume</h3>
            <p className="text-muted small">Monthly gross procurement volume across clinics and hospitals</p>
          </div>
          <span className="badge badge-success">+24.8% Year-Over-Year</span>
        </div>

        <div className="sales-bar-chart-container" style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '220px', padding: '1rem 0', borderBottom: '1px solid var(--slate-200)' }}>
          {monthlySales.map((item, idx) => {
            const heightPercent = (item.sales / maxSale) * 100;
            return (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--slate-500)', marginBottom: '4px' }}>
                  ₹{(item.sales / 1000).toFixed(0)}k
                </span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '42px',
                    height: `${heightPercent}%`,
                    background: 'var(--gradient-primary)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.5s ease'
                  }}
                  title={`₹${item.sales.toLocaleString()}`}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--slate-600)', marginTop: '8px' }}>
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Links Row */}
      <div className="admin-quick-links-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <Link to="/admin/orders" className="med-card" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4>Review Customer Orders</h4>
            <p className="text-muted small">Fulfill pending orders, assign couriers, and track deliveries.</p>
          </div>
          <ArrowRight size={20} className="text-primary" />
        </Link>

        <Link to="/admin/stock" className="med-card" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4>Inventory & Stock Restock</h4>
            <p className="text-muted small">Monitor products running below 5 units and update quantities.</p>
          </div>
          <ArrowRight size={20} className="text-primary" />
        </Link>

        <Link to="/admin/reports" className="med-card" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4>Review Clinical Inquiries</h4>
            <p className="text-muted small">Read messages and hospital RFP quote submissions.</p>
          </div>
          <ArrowRight size={20} className="text-primary" />
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
