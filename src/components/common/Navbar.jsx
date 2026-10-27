import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Heart,
  HelpCircle,
  Package,
  User,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  MapPin,
  Lock,
  Headphones
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { productsApi, wishlistApi } from '../../api';
import './Navbar.css';

const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  const categoryMenuRef = useRef(null);
  const profileMenuRef = useRef(null);

  const { user, role, isAuthenticated, isAdmin, isDeliveryPerson, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setShowCategoryMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await productsApi.getCategories();
        setCategories(data.results || data || []);
      } catch (e) {
        console.warn('Could not load categories:', e.message);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated) {
        setWishlistCount(0);
        return;
      }
      try {
        const data = await wishlistApi.getWishlist();
        const items = data.results || (Array.isArray(data) ? data : []);
        setWishlistCount(items.length);
      } catch (e) {
        // Fallback or guest
      }
    };
    fetchWishlist();
  }, [isAuthenticated, location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/equipments?search=${encodeURIComponent(searchTerm.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowProfileMenu(false);
    setMobileMenuOpen(false);
  };

  const isCurrent = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/home';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="med-navbar-wrapper">
      {/* Top Clinical Strip */}
      <div className="med-topbar">
        <div className="med-container d-flex-between">
          <div className="topbar-left">
            <span className="certified-badge">
              <ShieldCheck size={14} /> Certified Biomedical & Clinical Grade Equipment
            </span>
            <span className="topbar-divider">|</span>
            <span className="topbar-text">Direct Clinic & Hospital Dispatch</span>
          </div>
          <div className="topbar-right">
            <span>Clinical Support Hotline: <strong>+1 (800) 555-MEDQ</strong></span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="med-navbar">
        <div className="med-container nav-content">
          {/* Brand Logo */}
          <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="logo-icon-wrapper">
              <span className="logo-cross">+</span>
            </div>
            <div className="logo-text-block">
              <span className="logo-text-main">MED<span className="logo-accent">Q</span></span>
              <span className="logo-tagline">Clinical Equipment</span>
            </div>
          </Link>

          {/* Search Bar */}
          <form className="nav-search-form" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrapper">
              <Search size={17} className="search-icon" />
              <input
                type="text"
                className="search-field"
                placeholder="Search diagnostic, surgical, patient care devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="search-btn">
                Search
              </button>
            </div>
          </form>

          {/* Navigation Links */}
          <div className={`nav-links-cluster ${mobileMenuOpen ? 'open' : ''}`}>
            <Link
              to="/"
              className={`nav-link-item ${isCurrent('/') && location.pathname !== '/equipments' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>

            <Link
              to="/equipments"
              className={`nav-link-item ${isCurrent('/equipments') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </Link>

            {/* Category Dropdown */}
            <div
              ref={categoryMenuRef}
              className="nav-dropdown"
              onMouseEnter={() => setShowCategoryMenu(true)}
            >
              <button
                type="button"
                className={`nav-link-item ${location.pathname.startsWith('/category') ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCategoryMenu((prev) => !prev);
                }}
              >
                <span>Categories</span>
                <ChevronDown size={14} className={`dropdown-icon ${showCategoryMenu ? 'rotate' : ''}`} />
              </button>

              {showCategoryMenu && (
                <div className="dropdown-panel animate-fade-in">
                  <button
                    type="button"
                    className={`dropdown-link all-cats ${location.pathname === '/equipments' ? 'active' : ''}`}
                    onClick={() => {
                      setShowCategoryMenu(false);
                      setMobileMenuOpen(false);
                      navigate('/equipments');
                    }}
                  >
                    <span>All Medical Equipment</span>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Catalog</span>
                  </button>
                  <div className="dropdown-divider"></div>
                  {categories.map((cat) => {
                    const isCatActive =
                      location.pathname === `/category/${cat.slug}` ||
                      location.pathname === `/category/${encodeURIComponent(cat.name)}`;
                    return (
                      <button
                        key={cat.id || cat.slug || cat.name}
                        type="button"
                        className={`dropdown-link ${isCatActive ? 'active' : ''}`}
                        onClick={() => {
                          setShowCategoryMenu(false);
                          setMobileMenuOpen(false);
                          navigate(`/category/${cat.slug || cat.name}`);
                        }}
                      >
                        <span>{cat.name}</span>
                        {cat.product_count !== undefined && (
                          <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                            {cat.product_count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              to="/help"
              className={`nav-link-item ${isCurrent('/help') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Support
            </Link>

            {/* Quick Actions Group: Wishlist & Cart */}
            <div className="nav-action-icons">
              <Link
                to="/wishlist"
                className={`nav-icon-link ${isCurrent('/wishlist') ? 'active' : ''}`}
                title="Wishlist"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart size={20} />
                {wishlistCount > 0 && <span className="nav-badge-count">{wishlistCount}</span>}
              </Link>

              <Link
                to="/cart"
                className="nav-cart-btn"
                onClick={() => setMobileMenuOpen(false)}
                title="Shopping Cart"
              >
                <div className="cart-icon-shell">
                  <ShoppingCart size={19} />
                  {itemCount > 0 && <span className="cart-count-bubble">{itemCount}</span>}
                </div>
                <span className="cart-text">Cart</span>
              </Link>
            </div>

            {/* Auth / Profile Area */}
            {isAuthenticated ? (
              <div className="nav-user-cluster">
                <div
                  ref={profileMenuRef}
                  className="profile-dropdown-container"
                  onMouseEnter={() => setShowProfileMenu(true)}
                >
                  <button
                    className="profile-pill-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfileMenu((prev) => !prev);
                    }}
                    title="My Account"
                  >
                    <div className="avatar-circle">
                      <User size={15} />
                    </div>
                    <div className="profile-labels">
                      <span className="profile-name">
                        {user?.full_name?.split(' ')[0] || user?.name || user?.username?.split('@')[0] || 'Account'}
                      </span>
                      <span className="profile-role-tag">{role || 'CUSTOMER'}</span>
                    </div>
                    <ChevronDown size={13} className={`dropdown-icon ${showProfileMenu ? 'rotate' : ''}`} />
                  </button>

                  {showProfileMenu && (
                    <div className="profile-panel animate-fade-in">
                      <div className="profile-panel-header">
                        <p className="profile-panel-name">{user?.full_name || user?.username || 'MEDQ User'}</p>
                        <p className="user-email">{user?.email}</p>
                        <span className="user-role-badge">{role}</span>
                      </div>

                      <div className="profile-panel-body">
                        <Link
                          to="/profile?tab=overview"
                          className="panel-link"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <User size={15} /> Account Overview
                        </Link>
                        <Link
                          to="/profile?tab=personal"
                          className="panel-link"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <User size={15} /> Personal Info
                        </Link>
                        <Link
                          to="/profile?tab=addresses"
                          className="panel-link"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <MapPin size={15} /> My Addresses
                        </Link>
                        <Link
                          to="/profile?tab=orders"
                          className="panel-link"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Package size={15} /> My Orders
                        </Link>
                        <Link
                          to="/profile?tab=wishlist"
                          className="panel-link"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Heart size={15} /> Saved Wishlist
                        </Link>
                        <Link
                          to="/profile?tab=security"
                          className="panel-link"
                          onClick={() => setShowProfileMenu(false)}
                        >
                          <Lock size={15} /> Account Security
                        </Link>

                        {isAdmin && (
                          <>
                            <div className="dropdown-divider"></div>
                            <Link
                              to="/admin"
                              className="panel-link panel-link-highlight"
                              onClick={() => setShowProfileMenu(false)}
                            >
                              <LayoutDashboard size={15} /> Admin Portal
                            </Link>
                          </>
                        )}

                        {isDeliveryPerson && (
                          <>
                            <div className="dropdown-divider"></div>
                            <Link
                              to="/delivery-dashboard"
                              className="panel-link panel-link-highlight"
                              onClick={() => setShowProfileMenu(false)}
                            >
                              <Package size={15} /> Delivery Portal
                            </Link>
                          </>
                        )}
                      </div>

                      <div className="dropdown-divider"></div>
                      <button className="panel-logout-btn" onClick={handleLogout}>
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="auth-action-buttons">
                <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setMobileMenuOpen(false)}>
                  Log In
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm" onClick={() => setMobileMenuOpen(false)}>
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
