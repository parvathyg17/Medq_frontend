import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  Truck,
  RotateCcw,
  Users,
  Warehouse,
  BarChart3,
  MessageSquare,
  ArrowLeft,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="admin-wrapper">
      {/* Sidebar */}
      <aside className="admin-sidebar-nav">
        <div className="admin-sidebar-header">
          <Link to="/" className="admin-brand">
            <span className="logo-text-main">MED<span className="logo-accent">Q</span></span>
            <span className="admin-badge">Portal</span>
          </Link>
          <span className="admin-user-tag">Admin: {user?.full_name?.split(' ')[0] || 'Administrator'}</span>
        </div>

        <nav className="admin-nav-links">
          <NavLink to="/admin" end className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> <span>Dashboard</span>
          </NavLink>

          <NavLink to="/admin/products" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Box size={18} /> <span>Products</span>
          </NavLink>

          <NavLink to="/admin/orders" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Truck size={18} /> <span>Orders</span>
          </NavLink>

          <NavLink to="/admin/returns" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <RotateCcw size={18} /> <span>Returns</span>
          </NavLink>

          <NavLink to="/admin/stock" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Warehouse size={18} /> <span>Stock Manager</span>
          </NavLink>

          <NavLink to="/admin/users" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <Users size={18} /> <span>Users</span>
          </NavLink>

          <NavLink to="/admin/reports" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <MessageSquare size={18} /> <span>Inquiries</span>
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="btn btn-outline btn-sm w-100 back-store-btn mb-2">
            <ArrowLeft size={14} /> Back to Storefront
          </Link>
          <button
            onClick={handleLogout}
            className="btn btn-danger btn-sm w-100"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="admin-main-canvas">
        <div className="admin-content-pad">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
