import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Filter,
  Search,
  SlidersHorizontal,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  PackageX
} from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import { productsApi } from '../api';
import './CatalogPage.css';

const CatalogPage = () => {
  const { category: urlCategory } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState(urlCategory || 'all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [priceRange, setPriceRange] = useState(100000);
  const [sortBy, setSortBy] = useState('-created_at');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    if (urlCategory) {
      setSelectedCategory(urlCategory);
    } else {
      setSelectedCategory('all');
    }
  }, [urlCategory]);

  const isCatSelected = (cat) => {
    if (!selectedCategory || selectedCategory === 'all') return false;
    const s = selectedCategory.toLowerCase();
    return (
      s === cat.slug?.toLowerCase() ||
      s === cat.name?.toLowerCase() ||
      s === String(cat.id)
    );
  };

  const handleCategorySelect = (catVal) => {
    setSelectedCategory(catVal);
    if (!catVal || catVal === 'all') {
      navigate('/equipments');
    } else {
      navigate(`/category/${catVal}`);
    }
  };

  useEffect(() => {
    const term = searchParams.get('search');
    if (term !== null) {
      setSearchTerm(term);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const catData = await productsApi.getCategories();
        setCategories(catData.results || catData || []);
      } catch (err) {
        console.warn('Error loading categories:', err.message);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const params = {
          no_page: 'true',
          ordering: sortBy,
        };

        if (selectedCategory && selectedCategory !== 'all') {
          params.category = selectedCategory;
        }

        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        if (inStockOnly) {
          params.in_stock = 'true';
        }

        if (priceRange < 100000) {
          params.max_price = priceRange;
        }

        const data = await productsApi.getProducts(params);
        setProducts(data.results || data || []);
      } catch (err) {
        console.warn('Error fetching products:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [selectedCategory, searchTerm, inStockOnly, priceRange, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchTerm('');
    setInStockOnly(false);
    setPriceRange(100000);
    setSortBy('-created_at');
    setSearchParams({});
  };

  const getActiveCategoryTitle = () => {
    if (!selectedCategory || selectedCategory === 'all') return 'All Medical Equipment';
    const found = categories.find(
      (c) => c.slug?.toLowerCase() === selectedCategory.toLowerCase() ||
             c.name?.toLowerCase() === selectedCategory.toLowerCase()
    );
    return found ? found.name : selectedCategory.replace('-', ' ').toUpperCase();
  };

  return (
    <div className="catalog-page">
      {/* Catalog Hero Banner */}
      <div className="catalog-header-bar">
        <div className="med-container">
          <div className="breadcrumbs">
            <Link to="/">Home</Link> <ChevronRight size={14} /> <span>Medical Equipment Catalog</span>
          </div>
          <h1 className="catalog-title">{getActiveCategoryTitle()}</h1>
          <p className="catalog-subtitle">
            Explore certified biomedical instrumentation, clinical diagnostics, therapeutics, and laboratory solutions.
          </p>

          {/* Quick Category Chips */}
          <div className="category-chips-row">
            <button
              className={`cat-chip-btn ${selectedCategory === 'all' || !selectedCategory ? 'active' : ''}`}
              onClick={() => handleCategorySelect('all')}
            >
              All Equipment
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id || cat.slug}
                className={`cat-chip-btn ${isCatSelected(cat) ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat.slug || cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="med-container catalog-content-layout">
        {/* Sidebar Filters */}
        <aside className={`catalog-sidebar ${mobileFilterOpen ? 'mobile-visible' : ''}`}>
          <div className="sidebar-header">
            <h3><SlidersHorizontal size={18} /> Filters</h3>
            <button className="reset-filter-link" onClick={handleResetFilters}>
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          {/* Search within catalog */}
          <div className="filter-group">
            <label className="filter-label">Search Equipment</label>
            <div className="filter-search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Name, model, brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Price Range */}
          <div className="filter-group">
            <div className="d-flex-between">
              <label className="filter-label">Max Price</label>
              <span className="price-tag-value">₹{priceRange.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="price-slider"
            />
            <div className="d-flex-between text-muted small">
              <span>₹1,000</span>
              <span>₹100,000+</span>
            </div>
          </div>

          {/* In-Stock Filter */}
          <div className="filter-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
              />
              <span>In-Stock Items Only</span>
            </label>
          </div>

          {/* Category List in Sidebar */}
          <div className="filter-group">
            <label className="filter-label">Department / Category</label>
            <div className="sidebar-cat-list">
              <label className="cat-radio-row">
                <input
                  type="radio"
                  name="cat_radio"
                  checked={selectedCategory === 'all' || !selectedCategory}
                  onChange={() => handleCategorySelect('all')}
                />
                <span>All Categories</span>
              </label>
              {categories.map((cat) => (
                <label key={cat.id || cat.slug} className="cat-radio-row">
                  <input
                    type="radio"
                    name="cat_radio"
                    checked={isCatSelected(cat)}
                    onChange={() => handleCategorySelect(cat.slug || cat.name)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid & Controls */}
        <main className="catalog-results-area">
          {/* Top Control Bar */}
          <div className="results-control-bar">
            <div className="results-count">
              Found <strong>{products.length}</strong> medical equipment {products.length === 1 ? 'item' : 'items'}
            </div>

            <div className="sort-controls">
              <span className="sort-label">Sort By:</span>
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="-created_at">Newest Arrivals</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="name">Product Name (A-Z)</option>
              </select>

              <button
                className="mobile-filter-toggle-btn"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              >
                <Filter size={16} /> Filters
              </button>
            </div>
          </div>

          {/* Product Cards Grid */}
          {loading ? (
            <div className="text-center py-5">
              <div className="pulse-loader"></div>
              <p className="mt-3 text-muted">Updating equipment results...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-catalog-state">
              <PackageX size={64} className="empty-catalog-icon" />
              <h3>No Medical Equipment Found</h3>
              <p>We couldn't find any products matching your specific filters or search keywords.</p>
              <button className="btn btn-primary" onClick={handleResetFilters}>
                <RotateCcw size={16} /> Reset All Filters
              </button>
            </div>
          ) : (
            <div className="catalog-products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CatalogPage;
