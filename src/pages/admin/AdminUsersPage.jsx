import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Trash2,
  ShieldCheck,
  Truck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  Phone
} from 'lucide-react';
import { adminApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

const AdminUsersPage = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers();
      const list = Array.isArray(data) ? data : (data?.results || []);
      setUsers(list);
    } catch (err) {
      console.error('Failed to load platform users:', err);
      showNotice('Failed to fetch user accounts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotice = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeleteUser = async (u) => {
    if (u.id === currentAdmin?.id || u.email === currentAdmin?.email) {
      showNotice('You cannot delete your own admin account.', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user account "${u.full_name || u.email}"? This action cannot be reversed.`)) {
      return;
    }

    setDeletingId(u.id);
    try {
      await adminApi.deleteUser(u.id);
      showNotice(`User "${u.full_name || u.email}" removed.`);
      loadUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      showNotice('Could not delete user account.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <span className="badge badge-primary"><ShieldCheck size={12} className="me-1" /> Admin</span>;
      case 'delivery_person':
        return <span className="badge badge-warning"><Truck size={12} className="me-1" /> Delivery</span>;
      case 'customer':
      default:
        return <span className="badge badge-secondary"><UserCheck size={12} className="me-1" /> Customer</span>;
    }
  };

  // Metrics
  const totalUsers = users.length;
  const customers = users.filter(u => u.role === 'customer');
  const deliveryStaff = users.filter(u => u.role === 'delivery_person');
  const admins = users.filter(u => u.role === 'admin');

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.username?.toLowerCase().includes(q);

    const matchesRole = roleFilter === 'ALL' || u.role?.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="h2 font-heading">User Directory & Roles</h1>
          <p className="text-secondary text-sm">
            Manage registered healthcare clients, delivery logistics personnel, and system admins.
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={loadUsers} title="Refresh directory">
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

      {/* Role Metrics */}
      <div className="admin-stats-grid">
        <div
          className={`admin-stat-card ${roleFilter === 'ALL' ? 'border-primary' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setRoleFilter('ALL')}
        >
          <div className="stat-icon-wrapper blue">
            <Users size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Total Accounts</span>
            <span className="stat-number">{totalUsers}</span>
          </div>
        </div>

        <div
          className={`admin-stat-card ${roleFilter === 'customer' ? 'border-primary' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setRoleFilter('customer')}
        >
          <div className="stat-icon-wrapper teal">
            <UserCheck size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Clients / Buyers</span>
            <span className="stat-number">{customers.length}</span>
          </div>
        </div>

        <div
          className={`admin-stat-card ${roleFilter === 'delivery_person' ? 'border-primary' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setRoleFilter('delivery_person')}
        >
          <div className="stat-icon-wrapper amber">
            <Truck size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Delivery Staff</span>
            <span className="stat-number">{deliveryStaff.length}</span>
          </div>
        </div>

        <div
          className={`admin-stat-card ${roleFilter === 'admin' ? 'border-primary' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setRoleFilter('admin')}
        >
          <div className="stat-icon-wrapper purple">
            <ShieldCheck size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">System Admins</span>
            <span className="stat-number">{admins.length}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 mb-4 d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <div style={{ flex: '1', minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by full name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ minWidth: '180px' }}>
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Account Roles</option>
            <option value="customer">Customers Only</option>
            <option value="delivery_person">Delivery Staff</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

        <div className="text-sm text-secondary">
          Showing <strong>{filteredUsers.length}</strong> of {users.length} accounts
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center p-5 text-secondary">
            <div className="spinner-border text-primary mb-2" role="status"></div>
            <div>Loading accounts directory...</div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center p-5 text-secondary">
            <Users size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
            <h4>No user accounts found</h4>
            <p className="text-sm">Try relaxing your search terms or filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Contact Details</th>
                  <th>Platform Role</th>
                  <th>Account Status</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right', width: '90px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isCurrent = u.id === currentAdmin?.id;
                  const dateStr = u.date_joined ? new Date(u.date_joined).toLocaleDateString() : 'N/A';

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'var(--primary-100)',
                              color: 'var(--primary-700)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '0.85rem'
                            }}
                          >
                            {(u.full_name || u.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold text-slate-900">
                              {u.full_name || 'Anonymous User'}
                              {isCurrent && <span className="badge badge-outline ms-2 text-xs">You</span>}
                            </div>
                            <div className="text-xs text-secondary font-mono">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm d-flex align-items-center gap-1">
                          <Mail size={13} className="text-secondary" /> {u.email}
                        </div>
                        {u.phone && (
                          <div className="text-xs text-muted d-flex align-items-center gap-1 mt-1">
                            <Phone size={12} /> {u.phone}
                          </div>
                        )}
                      </td>
                      <td>
                        {getRoleBadge(u.role)}
                      </td>
                      <td>
                        <span className={`badge ${u.is_active ? 'badge-success' : 'badge-secondary'}`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="text-sm text-secondary">
                        {dateStr}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!isCurrent && (
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.35rem 0.6rem' }}
                            onClick={() => handleDeleteUser(u)}
                            disabled={deletingId === u.id}
                            title="Delete User Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
