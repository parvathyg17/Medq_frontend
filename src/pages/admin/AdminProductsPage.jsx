import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Package,
  ExternalLink,
  Upload,
  RefreshCw
} from 'lucide-react';
import { productsApi } from '../../api';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form State
  const initialForm = {
    name: '',
    brand: '',
    category: '',
    price: '',
    discount_price: '',
    stock_quantity: 10,
    image_url: '',
    description: '',
    is_active: true
  };
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodsData, catsData] = await Promise.all([
        productsApi.getProducts(),
        productsApi.getCategories()
      ]);
      const list = Array.isArray(prodsData) ? prodsData : (prodsData?.results || []);
      setProducts(list);
      setCategories(Array.isArray(catsData) ? catsData : (catsData?.results || []));
    } catch (err) {
      console.error('Error fetching admin products:', err);
      showNotice('Failed to load products. Check server connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotice = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData(initialForm);
    setImageFile(null);
    setShowModal(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      brand: prod.brand || '',
      category: prod.category_name || (typeof prod.category === 'object' ? prod.category?.name : prod.category) || '',
      price: prod.price || '',
      discount_price: prod.discount_price || '',
      stock_quantity: prod.stock_quantity ?? prod.quantity ?? 0,
      image_url: prod.image_url || '',
      description: prod.description || '',
      is_active: prod.is_active ?? true
    });
    setImageFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('brand', formData.brand);
      data.append('category', formData.category);
      data.append('price', formData.price);
      if (formData.discount_price) {
        data.append('discount_price', formData.discount_price);
      }
      data.append('stock_quantity', formData.stock_quantity);
      if (formData.image_url) {
        data.append('image_url', formData.image_url);
      }
      if (imageFile) {
        data.append('image', imageFile);
      }
      data.append('description', formData.description);
      data.append('is_active', formData.is_active);

      if (editingProduct) {
        await productsApi.updateProduct(editingProduct.id, data);
        showNotice(`Product "${formData.name}" updated successfully.`);
      } else {
        await productsApi.createProduct(data);
        showNotice(`Product "${formData.name}" added to inventory.`);
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Product save error:', err);
      const errMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save product.';
      showNotice(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await productsApi.deleteProduct(id);
      showNotice(`Product "${name}" deleted.`);
      loadData();
    } catch (err) {
      console.error('Delete product error:', err);
      showNotice('Failed to delete product.', 'error');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const catName = p.category_name || (typeof p.category === 'object' ? p.category?.name : p.category);
    const matchesCat = !selectedCategory || catName === selectedCategory;

    return matchesSearch && matchesCat;
  });

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="h2 font-heading">Equipment & Inventory</h1>
          <p className="text-secondary text-sm">
            Manage your certified healthcare catalog, pricing, and stock levels.
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={loadData} title="Refresh catalog">
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} /> Add New Equipment
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
            placeholder="Search equipment by name, brand, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ minWidth: '200px' }}>
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="text-sm text-secondary">
          Showing <strong>{filteredProducts.length}</strong> of {products.length} items
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center p-5 text-secondary">
            <div className="spinner-border text-primary mb-2" role="status"></div>
            <div>Loading catalog inventory...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center p-5 text-secondary">
            <Package size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
            <h4>No medical equipment found</h4>
            <p className="text-sm">Try adjusting your filters or click "Add New Equipment" to register items.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>Image</th>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const effective = p.effective_price || p.price;
                  const isLow = p.stock_quantity < 5;
                  const isOut = p.stock_quantity <= 0;
                  return (
                    <tr key={p.id}>
                      <td>
                        <img
                          src={p.imageUrl || p.image_url || '/images/cardio.png'}
                          alt={p.name}
                          style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', background: 'var(--slate-50)', padding: '2px', border: '1px solid var(--slate-200)' }}
                          onError={(e) => { e.target.src = '/images/cardio.png'; }}
                        />
                      </td>
                      <td>
                        <div className="fw-semibold text-slate-900">{p.name}</div>
                        <div className="text-xs text-secondary">{p.brand || 'MEDQ Certified'} {p.sku ? `• SKU: ${p.sku}` : ''}</div>
                      </td>
                      <td>
                        <span className="badge badge-outline">
                          {p.category_name || (typeof p.category === 'object' ? p.category?.name : p.category) || 'Equipment'}
                        </span>
                      </td>
                      <td>
                        <div className="fw-bold text-slate-900">${parseFloat(effective).toFixed(2)}</div>
                        {p.discount_price && (
                          <div className="text-xs text-muted text-decoration-line-through">
                            ${parseFloat(p.price).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${isOut ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'}`}>
                          {p.stock_quantity} in stock
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${p.is_active ? 'badge-success' : 'badge-secondary'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.35rem 0.6rem' }}
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Equipment"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.35rem 0.6rem' }}
                            onClick={() => handleDelete(p.id, p.name)}
                            title="Delete Equipment"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <div className="admin-modal-header">
              <h3 className="h4 font-heading mb-0">
                {editingProduct ? 'Edit Medical Equipment' : 'Add New Medical Equipment'}
              </h3>
              <button className="modal-close-x" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div className="mb-3">
                  <label className="form-label">Equipment Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. 12-Lead Diagnostic ECG Machine"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Brand / Manufacturer *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. CardioTech, BioMed"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Category *</label>
                    <input
                      type="text"
                      list="category-suggestions"
                      required
                      className="form-control"
                      placeholder="Select or enter category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                    <datalist id="category-suggestions">
                      {categories.map(c => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="form-label">Base Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      className="form-control"
                      placeholder="999.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Discount Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      placeholder="Optional"
                      value={formData.discount_price}
                      onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Stock Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      className="form-control"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Image URL</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://... or select image file below"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Or Upload Image File</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0] || null)}
                  />
                  <div className="text-xs text-secondary mt-1">
                    Accepts PNG, JPG, WebP. High resolution square ratio recommended.
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Clinical Description & Specifications</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Describe clinical applications, warranty, specifications, and certifications..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isActiveToggle"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="isActiveToggle">
                    Listed and Available for Purchase
                  </label>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving Equipment...' : editingProduct ? 'Save Changes' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
