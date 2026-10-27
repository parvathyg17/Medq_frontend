import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Truck,
  Headphones,
  ArrowRight,
  ChevronRight,
  Activity,
  HeartPulse,
  Microscope,
  Bed,
  CheckCircle2,
  Stethoscope,
  Sparkles
} from 'lucide-react';
import ProductCard from '../components/products/ProductCard';
import { productsApi } from '../api';
import './HomePage.css';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [prodData, catData] = await Promise.all([
          productsApi.getFeatured(),
          productsApi.getCategories()
        ]);

        let prods = prodData.results || (Array.isArray(prodData) ? prodData : []);
        // If featured products is empty, fallback to general products list
        if (prods.length === 0) {
          const allProds = await productsApi.getProducts();
          prods = allProds.results || (Array.isArray(allProds) ? allProds : []);
        }

        setFeaturedProducts(prods);
        setCategories(catData.results || (Array.isArray(catData) ? catData : []));
      } catch (err) {
        console.warn('Error loading home data:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const getCategoryIcon = (slug, name) => {
    const s = (slug || name || '').toLowerCase();
    if (s.includes('diagnos')) return <Activity size={24} />;
    if (s.includes('therap') || s.includes('cardio')) return <HeartPulse size={24} />;
    if (s.includes('lab') || s.includes('centri')) return <Microscope size={24} />;
    if (s.includes('surg') || s.includes('or')) return <Stethoscope size={24} />;
    return <Bed size={24} />;
  };

  return (
    <div className="home-page-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="med-container hero-inner-grid">
          <div className="hero-content">
            <div className="hero-badge">
              <ShieldCheck size={14} />
              <span>Biomedical & Clinical Grade Solutions</span>
            </div>

            <h1 className="hero-title">
              Precision Medical Equipment for Hospitals & Clinics
            </h1>

            <p className="hero-description">
              Procure certified diagnostic instruments, surgical tools, and patient care systems with verified calibration, guaranteed inventory, and insured clinical dispatch.
            </p>

            <div className="hero-actions">
              <Link to="/equipments" className="btn btn-primary btn-lg">
                Shop Equipment <ArrowRight size={18} />
              </Link>
              <a href="#categories" className="btn btn-outline btn-lg">
                Explore Categories
              </a>
            </div>

            <div className="hero-trust-points">
              <div className="trust-point">
                <CheckCircle2 size={16} className="text-primary-600" />
                <span>ISO 13485 & CE Compliant</span>
              </div>
              <div className="trust-point">
                <CheckCircle2 size={16} className="text-primary-600" />
                <span>Standard 1-Year Warranty</span>
              </div>
              <div className="trust-point">
                <CheckCircle2 size={16} className="text-primary-600" />
                <span>Express Clinic Delivery</span>
              </div>
            </div>
          </div>

          <div className="hero-image-wrapper">
            <div className="hero-image-card">
              <img
                src="/images/medq2.jpg"
                alt="Medical Equipment Diagnostics"
                className="hero-main-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80';
                }}
              />
              <div className="hero-floating-stat">
                <div className="stat-icon-shell">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="stat-main-text">100% Verified Stock</div>
                  <div className="stat-sub-text">Directly from Certified Manufacturers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="med-container">
          <div className="benefits-grid">
            <div className="benefit-card med-card">
              <div className="benefit-icon-box">
                <ShieldCheck size={26} />
              </div>
              <h3 className="benefit-title">Quality Equipment</h3>
              <p className="benefit-text">
                All devices adhere to CE, ISO 13485, and FDA regulations, backed by official manufacturer warranties.
              </p>
            </div>

            <div className="benefit-card med-card">
              <div className="benefit-icon-box">
                <Lock size={26} />
              </div>
              <h3 className="benefit-title">Secure Checkout</h3>
              <p className="benefit-text">
                End-to-end encrypted order placement with verified address validation and immediate stock reservation.
              </p>
            </div>

            <div className="benefit-card med-card">
              <div className="benefit-icon-box">
                <Truck size={26} />
              </div>
              <h3 className="benefit-title">Order Tracking</h3>
              <p className="benefit-text">
                Real-time milestone tracking from inventory picking to insured courier delivery at your medical facility.
              </p>
            </div>

            <div className="benefit-card med-card">
              <div className="benefit-icon-box">
                <Headphones size={26} />
              </div>
              <h3 className="benefit-title">Customer Support</h3>
              <p className="benefit-text">
                24/7 technical hotline and biomedical specialists available for equipment guidance and inquiries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section id="categories" className="categories-section">
        <div className="med-container">
          <div className="section-head-bar">
            <div>
              <span className="section-eyebrow">Clinical Departments</span>
              <h2 className="section-title">Explore Equipment by Category</h2>
            </div>
            <Link to="/equipments" className="view-all-link">
              View All Equipment <ChevronRight size={16} />
            </Link>
          </div>

          <div className="categories-grid">
            {categories.map((cat) => (
              <Link
                key={cat.id || cat.slug || cat.name}
                to={`/category/${cat.slug || cat.name}`}
                className="category-card med-card"
              >
                <div className="category-icon-bubble">
                  {getCategoryIcon(cat.slug, cat.name)}
                </div>
                <h3 className="category-name">{cat.name}</h3>
                <p className="category-desc">
                  {cat.description || 'Specialized clinical instruments and diagnostic devices.'}
                </p>
                <div className="category-card-footer">
                  <span className="category-link-cta">
                    Browse Department <ArrowRight size={14} />
                  </span>
                  {cat.product_count !== undefined && (
                    <span className="badge badge-secondary">{cat.product_count} items</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products-section">
        <div className="med-container">
          <div className="section-head-bar">
            <div>
              <span className="section-eyebrow">Medical Inventory</span>
              <h2 className="section-title">Featured Clinical Equipment</h2>
            </div>
            <Link to="/equipments" className="btn btn-outline btn-sm">
              See All Products
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <p className="text-secondary">Loading clinical equipment catalog...</p>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="med-card p-5 text-center text-secondary">
              No products currently available in this view.
            </div>
          ) : (
            <div className="products-grid">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id || product.slug} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Clean Support / Contact CTA */}
      <section className="support-cta-section">
        <div className="med-container">
          <div className="support-cta-card med-card">
            <div className="support-cta-text">
              <span className="badge badge-primary mb-2">Hospital Procurement & Bulk Quotes</span>
              <h2 className="support-cta-title">Need Specialized Equipment or Institutional Pricing?</h2>
              <p className="support-cta-desc">
                Our team of biomedical engineers and procurement specialists is ready to provide tailored quotes, warranty terms, and volume supply schedules for your hospital or medical clinic.
              </p>
            </div>
            <div className="support-cta-actions">
              <Link to="/help" className="btn btn-primary btn-lg">
                Contact Specialist Team
              </Link>
              <Link to="/chat" className="btn btn-outline btn-lg">
                Live Chat Inquiry
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
