import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  Search,
  PlusCircle,
  RefreshCw,
  PackageCheck,
  AlertOctagon,
  ArrowUpDown
} from 'lucide-react';
import { productsApi } from '../../api';

const AdminStockPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL'); // ALL, LOW, OUT, HEALTHY
  const [restockAmount, setRestockAmount] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productsApi.getProducts();
      const list = Array.isArray(data) ? data : (data?.results || []);
      setProducts(list);
    } catch (err) {
      console.error('Failed to load products for stock management:', err);
      showNotice('Failed to fetch stock data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotice = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRestock = async (product) => {
    const qtyToAdd = parseInt(restockAmount[product.id] || 10, 10);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      showNotice('Please enter a valid positive quantity to restock.', 'error');
      return;
    }

    setUpdatingId(product.id);
    try {
      const newQty = (product.stock_quantity || 0) + qtyToAdd;
      const data = new FormData();
      data.append('stock_quantity', newQty);

      await productsApi.updateProduct(product.id, data);
      showNotice(`Successfully added +${qtyToAdd} units to "${product.name}". New stock: ${newQty}.`);
      
      // Clear input
      setRestockAmount(prev => ({ ...prev, [product.id]: '' }));
      loadProducts();
    } catch (err) {
      console.error('Restock error:', err);
      showNotice('Failed to update stock quantity.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Stock Metrics
  const totalSkus = products.length;
  const outOfStock = products.filter(p => p.stock_quantity <= 0);
  const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 5);
  const healthyStock = products.filter(p => p.stock_quantity >= 5);

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (stockFilter === 'OUT') return p.stock_quantity <= 0;
    if (stockFilter === 'LOW') return p.stock_quantity > 0 && p.stock_quantity < 5;
    if (stockFilter === 'HEALTHY') return p.stock_quantity >= 5;
    return true;
  });

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="h2 font-heading">Stock & Inventory Manager</h1>
          <p className="text-secondary text-sm">
            Monitor real-time warehouse availability, prevent shortages, and restock medical inventory.
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={loadProducts} title="Refresh Stock">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {notification && (
        <div className={`alert ${notification.type === 'error' ? 'alert-error' : 'alert-success'} mb-4`}>
          {notification.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Stock Analytics Metric Cards */}
      <div className="admin-stats-grid">
        <div
          className={`admin-stat-card ${stockFilter === 'ALL' ? 'border-primary' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setStockFilter('ALL')}
        >
          <div className="stat-icon-wrapper blue">
            <Warehouse size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Total SKUs</span>
            <span className="stat-number">{totalSkus}</span>
          </div>
        </div>

        <div
          className={`admin-stat-card ${stockFilter === 'HEALTHY' ? 'border-primary' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setStockFilter('HEALTHY')}
        >
          <div className="stat-icon-wrapper emerald">
            <PackageCheck size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Optimal Stock (&ge;5)</span>
            <span className="stat-number text-emerald-600">{healthyStock.length}</span>
          </div>
        </div>

        <div
          className={`admin-stat-card ${stockFilter === 'LOW' ? 'border-primary' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setStockFilter('LOW')}
        >
          <div className="stat-icon-wrapper amber">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Low Stock (&lt;5)</span>
            <span className="stat-number text-amber-600">{lowStock.length}</span>
          </div>
        </div>

        <div
          className={`admin-stat-card ${stockFilter === 'OUT' ? 'border-primary' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setStockFilter('OUT')}
        >
          <div className="stat-icon-wrapper purple" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <AlertOctagon size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Depleted / Zero</span>
            <span className="stat-number text-red-600">{outOfStock.length}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 mb-4 d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <div style={{ flex: '1', minWidth: '260px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search equipment by name, brand, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="d-flex gap-2">
          <button
            className={`btn btn-sm ${stockFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStockFilter('ALL')}
          >
            All Items ({totalSkus})
          </button>
          <button
            className={`btn btn-sm ${stockFilter === 'LOW' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStockFilter('LOW')}
          >
            Low Stock ({lowStock.length})
          </button>
          <button
            className={`btn btn-sm ${stockFilter === 'OUT' ? 'btn-danger' : 'btn-outline'}`}
            onClick={() => setStockFilter('OUT')}
          >
            Out of Stock ({outOfStock.length})
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center p-5 text-secondary">
            <div className="spinner-border text-primary mb-2" role="status"></div>
            <div>Auditing warehouse levels...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center p-5 text-secondary">
            <CheckCircle2 size={48} style={{ opacity: 0.3, margin: '0 auto 1rem', color: 'var(--emerald-500)' }} />
            <h4>No items match current stock filter</h4>
            <p className="text-sm">Warehouse levels meet the selected criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Thumbnail</th>
                  <th>Equipment & SKU</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Stock Health</th>
                  <th style={{ minWidth: '240px', textAlign: 'right' }}>Direct Warehouse Restock</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const qty = p.stock_quantity ?? 0;
                  const isOut = qty <= 0;
                  const isLow = qty > 0 && qty < 5;

                  return (
                    <tr key={p.id}>
                      <td>
                        <img
                          src={p.imageUrl || p.image_url || '/images/cardio.png'}
                          alt={p.name}
                          style={{ width: '42px', height: '42px', objectFit: 'contain', background: 'var(--slate-50)', padding: '2px', borderRadius: '4px', border: '1px solid var(--slate-200)' }}
                          onError={(e) => { e.target.src = '/images/cardio.png'; }}
                        />
                      </td>
                      <td>
                        <div className="fw-semibold text-slate-900">{p.name}</div>
                        <div className="text-xs text-secondary">{p.brand || 'MEDQ'} • SKU: {p.sku || 'N/A'}</div>
                      </td>
                      <td>
                        <span className="badge badge-outline">
                          {p.category_name || (typeof p.category === 'object' ? p.category?.name : p.category) || 'Equipment'}
                        </span>
                      </td>
                      <td>
                        <div className="font-mono fw-bold fs-6">
                          {qty} <span className="text-xs text-secondary fw-normal">units</span>
                        </div>
                      </td>
                      <td>
                        {isOut ? (
                          <span className="badge badge-danger">Out of Stock (0)</span>
                        ) : isLow ? (
                          <span className="badge badge-warning">Low Stock ({qty})</span>
                        ) : (
                          <span className="badge badge-success">Sufficient ({qty})</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            className="form-control form-control-sm"
                            style={{ width: '80px', textAlign: 'center' }}
                            placeholder="+10"
                            value={restockAmount[p.id] ?? ''}
                            onChange={(e) => setRestockAmount({ ...restockAmount, [p.id]: e.target.value })}
                          />
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={updatingId === p.id}
                            onClick={() => handleRestock(p)}
                            title="Add units to warehouse inventory"
                          >
                            <PlusCircle size={14} className="me-1" />
                            {updatingId === p.id ? 'Updating...' : 'Restock'}
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
    </div>
  );
};

export default AdminStockPage;
