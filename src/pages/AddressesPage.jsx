import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Star,
  Building2,
  Phone,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  X
} from 'lucide-react';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import './AddressesPage.css';

const ADDRESS_TYPES = [
  { value: 'HOSPITAL', label: 'Hospital / Medical Center' },
  { value: 'CLINIC', label: 'Clinic / Practice' },
  { value: 'LABORATORY', label: 'Diagnostic Laboratory' },
  { value: 'OFFICE', label: 'Institutional Office' },
  { value: 'HOME', label: 'Home / Residence' },
  { value: 'OTHER', label: 'Other Destination' }
];

const INITIAL_FORM = {
  full_name: '',
  phone: '',
  address_line: '',
  city: '',
  state: '',
  landmark: '',
  pin_code: '',
  address_type: 'HOSPITAL',
  is_default: false
};

const AddressesPage = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authApi.getAddresses();
      setAddresses(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      console.error('Failed to load addresses:', err);
      setError(err.message || 'Unable to load clinical delivery addresses.');
    } finally {
      setLoading(false);
    }
  };

  const showNotice = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const openAddModal = () => {
    setEditingAddressId(null);
    setFormData({
      ...INITIAL_FORM,
      full_name: user?.full_name || user?.name || '',
      phone: user?.phone || '',
      is_default: addresses.length === 0
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addr) => {
    setEditingAddressId(addr.id);
    setFormData({
      full_name: addr.full_name || '',
      phone: addr.phone || '',
      address_line: addr.address_line || '',
      city: addr.city || '',
      state: addr.state || '',
      landmark: addr.landmark || '',
      pin_code: addr.pin_code || '',
      address_type: addr.address_type || 'HOSPITAL',
      is_default: Boolean(addr.is_default)
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddressId(null);
    setFormData(INITIAL_FORM);
    setFormError(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.full_name.trim()) {
      setFormError('Please enter recipient or facility name.');
      return;
    }
    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid phone number (at least 10 digits).');
      return;
    }
    if (!formData.address_line.trim()) {
      setFormError('Please enter the street address or department location.');
      return;
    }
    if (!formData.pin_code.trim() || formData.pin_code.trim().length < 4) {
      setFormError('Please enter a valid postal PIN code.');
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingAddressId) {
        await authApi.updateAddress(editingAddressId, formData);
        showNotice('Address updated successfully.');
      } else {
        await authApi.addAddress(formData);
        showNotice('New clinical delivery location added.');
      }
      closeModal();
      fetchAddresses();
    } catch (err) {
      console.error('Save address error:', err);
      setFormError(err.message || 'Failed to save address.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleSetDefault = async (addrId) => {
    try {
      await authApi.setDefaultAddress(addrId);
      showNotice('Default delivery address updated.');
      fetchAddresses();
    } catch (err) {
      console.error('Set default error:', err);
      showNotice(err.message || 'Failed to set default address.', 'error');
    }
  };

  const handleDelete = async (addrId, addrName) => {
    if (!window.confirm(`Delete address '${addrName}'? This cannot be undone.`)) return;

    try {
      await authApi.deleteAddress(addrId);
      showNotice('Delivery address deleted.');
      fetchAddresses();
    } catch (err) {
      console.error('Delete error:', err);
      showNotice(err.message || 'Failed to delete address.', 'error');
    }
  };

  const defaultAddress = addresses.find((a) => a.is_default);

  return (
    <div className="addresses-page py-4">
      <div className="med-container">
        {/* Navigation Breadcrumb */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <Link to="/myorders" className="back-link d-inline-flex align-items-center gap-1 text-secondary text-sm">
            <ArrowLeft size={16} /> Return to Orders
          </Link>
          <Link to="/checkout" className="btn btn-outline btn-sm">
            Proceed to Checkout
          </Link>
        </div>

        {/* Header Block */}
        <div className="addresses-header mb-4">
          <div className="header-titles">
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge badge-primary-light">
                <MapPin size={14} className="icon-mr" /> Address Book
              </span>
              <span className="text-xs text-muted">Client: {user?.email}</span>
            </div>
            <h1 className="page-title font-heading">Clinical Delivery Locations</h1>
            <p className="page-subtitle text-secondary">
              Manage hospital receiving bays, clinical departments, and primary default shipping destinations for biomedical equipment.
            </p>
          </div>

          <button className="btn btn-primary btn-md add-address-btn" onClick={openAddModal}>
            <Plus size={18} /> Add New Address
          </button>
        </div>

        {/* Notification Alert */}
        {notification && (
          <div className={`alert ${notification.type === 'error' ? 'alert-error' : 'alert-success'} mb-4 animate-fade-in`}>
            {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{notification.msg}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="address-metrics-grid mb-5">
          <div className="metric-box card p-3">
            <span className="metric-label text-xs text-secondary">Total Saved Locations</span>
            <span className="metric-value font-heading text-xl fw-bold text-slate-900">{addresses.length}</span>
            <span className="text-xs text-muted">Verified destinations</span>
          </div>

          <div className="metric-box card p-3">
            <span className="metric-label text-xs text-secondary">Primary Default Destination</span>
            <span className="metric-value font-heading text-base fw-bold text-primary-700 text-truncate">
              {defaultAddress ? defaultAddress.full_name : 'No default selected'}
            </span>
            <span className="text-xs text-muted">
              {defaultAddress ? `PIN: ${defaultAddress.pin_code} • ${defaultAddress.address_type}` : 'First address defaults automatically'}
            </span>
          </div>

          <div className="metric-box card p-3">
            <span className="metric-label text-xs text-secondary">Logistics Readiness</span>
            <span className="metric-value text-base fw-bold text-success d-flex align-items-center gap-1">
              <ShieldCheck size={18} /> Express Clinical Dispatch
            </span>
            <span className="text-xs text-muted">Sterile packaging & cold chain ready</span>
          </div>
        </div>

        {/* Addresses Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-2" role="status"></div>
            <p className="text-secondary">Loading clinical destinations...</p>
          </div>
        ) : addresses.length === 0 ? (
          <div className="empty-addresses-card card text-center p-5">
            <div className="empty-icon-circle mx-auto mb-3">
              <Building2 size={36} className="text-primary" />
            </div>
            <h3 className="font-heading mb-2">No Delivery Locations Saved Yet</h3>
            <p className="text-secondary text-sm mb-4" style={{ maxWidth: '440px', margin: '0 auto 1.5rem' }}>
              Add your hospital receiving department, clinic, or diagnostic practice to speed up equipment procurement and checkout.
            </p>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={16} /> Add Your First Delivery Address
            </button>
          </div>
        ) : (
          <div className="addresses-grid">
            {addresses.map((addr) => {
              const typeObj = ADDRESS_TYPES.find((t) => t.value === addr.address_type);
              const typeLabel = typeObj ? typeObj.label : addr.address_type || 'Hospital';

              return (
                <div
                  key={addr.id}
                  className={`address-card card ${addr.is_default ? 'is-default-card' : ''}`}
                >
                  <div className="card-top-bar">
                    <span className="address-type-pill">
                      <Building2 size={13} /> {typeLabel}
                    </span>
                    {addr.is_default && (
                      <span className="default-star-badge">
                        <Star size={12} fill="#ea580c" color="#ea580c" /> Primary Default
                      </span>
                    )}
                  </div>

                  <div className="card-body-content">
                    <h3 className="recipient-name font-heading">{addr.full_name}</h3>
                    <p className="street-address text-secondary text-sm">
                      {addr.address_line}
                    </p>
                    {(addr.city || addr.state) && (
                      <p className="city-state text-secondary text-xs">
                        {[addr.city, addr.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {addr.landmark && (
                      <p className="landmark-tag text-xs text-muted">
                        <strong>Landmark:</strong> {addr.landmark}
                      </p>
                    )}
                    <div className="pin-phone-block mt-3 pt-2 border-top d-flex justify-content-between align-items-center text-xs">
                      <span className="font-mono fw-semibold text-slate-800">
                        PIN: {addr.pin_code}
                      </span>
                      <span className="text-secondary d-flex align-items-center gap-1">
                        <Phone size={12} /> {addr.phone}
                      </span>
                    </div>
                  </div>

                  <div className="card-footer-actions">
                    {!addr.is_default && (
                      <button
                        className="btn btn-outline btn-xs set-default-btn"
                        onClick={() => handleSetDefault(addr.id)}
                        title="Set this as your primary address for all checkouts"
                      >
                        <Star size={13} /> Set as Default
                      </button>
                    )}
                    <div className="edit-delete-group ms-auto d-flex gap-1">
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => openEditModal(addr)}
                        title="Edit address"
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        className="btn btn-danger btn-xs"
                        onClick={() => handleDelete(addr.id, addr.full_name)}
                        title="Delete address"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="address-modal-overlay">
            <div className="address-modal-card animate-fade-in">
              <div className="modal-header">
                <div>
                  <h3 className="font-heading h4 mb-0">
                    {editingAddressId ? 'Edit Delivery Location' : 'Add Clinical Delivery Location'}
                  </h3>
                  <span className="text-xs text-secondary">
                    {editingAddressId ? 'Update facility shipping details' : 'Save a new clinic, hospital, or department address'}
                  </span>
                </div>
                <button className="modal-close-btn" onClick={closeModal} title="Close modal">
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="alert alert-error m-3 mb-0">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Facility / Recipient Name */}
                    <div className="col-md-7">
                      <label className="form-label text-xs fw-bold">Facility / Recipient Name *</label>
                      <input
                        type="text"
                        name="full_name"
                        className="form-control"
                        placeholder="e.g. Dr. Sarah Patel / ICU Receiving Bay"
                        required
                        value={formData.full_name}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Facility Destination Type */}
                    <div className="col-md-5">
                      <label className="form-label text-xs fw-bold">Location Type</label>
                      <select
                        name="address_type"
                        className="form-select"
                        value={formData.address_type}
                        onChange={handleFormChange}
                      >
                        {ADDRESS_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Phone Number */}
                    <div className="col-md-6">
                      <label className="form-label text-xs fw-bold">Contact Telephone / Mobile *</label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        placeholder="+91 98765 43210"
                        required
                        value={formData.phone}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Postal PIN Code */}
                    <div className="col-md-6">
                      <label className="form-label text-xs fw-bold">Postal PIN Code *</label>
                      <input
                        type="text"
                        name="pin_code"
                        className="form-control font-mono"
                        placeholder="e.g. 560001"
                        required
                        value={formData.pin_code}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Complete Address */}
                    <div className="col-12">
                      <label className="form-label text-xs fw-bold">Street Address / Facility Wing *</label>
                      <textarea
                        name="address_line"
                        className="form-control"
                        rows="3"
                        placeholder="Building name, Floor/Wing, Street, Clinical department..."
                        required
                        value={formData.address_line}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* City */}
                    <div className="col-md-6">
                      <label className="form-label text-xs fw-bold">City / Town</label>
                      <input
                        type="text"
                        name="city"
                        className="form-control"
                        placeholder="e.g. Bengaluru, Mumbai"
                        value={formData.city}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* State */}
                    <div className="col-md-6">
                      <label className="form-label text-xs fw-bold">State / Province</label>
                      <input
                        type="text"
                        name="state"
                        className="form-control"
                        placeholder="e.g. Karnataka, Maharashtra"
                        value={formData.state}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Landmark */}
                    <div className="col-12">
                      <label className="form-label text-xs fw-bold">Receiving Landmark / Gate</label>
                      <input
                        type="text"
                        name="landmark"
                        className="form-control"
                        placeholder="e.g. Gate 3, Ambulance Bay, Opposite Diagnostic Center"
                        value={formData.landmark}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Set as Default Checkbox */}
                    <div className="col-12">
                      <div className="form-check p-2 rounded bg-light border">
                        <input
                          type="checkbox"
                          id="is_default_checkbox"
                          name="is_default"
                          className="form-check-input ms-1 me-2"
                          checked={formData.is_default}
                          onChange={handleFormChange}
                        />
                        <label htmlFor="is_default_checkbox" className="form-check-label text-xs fw-bold text-slate-800">
                          Set as my primary default delivery address for all orders
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer p-3 bg-light d-flex justify-content-end gap-2 border-top">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={closeModal}
                    disabled={formSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? 'Saving...' : editingAddressId ? 'Update Address' : 'Save Address'}
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

export default AddressesPage;
