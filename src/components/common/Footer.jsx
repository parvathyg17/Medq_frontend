import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Clock, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="med-footer">
      {/* Trust Badges Strip */}
      <div className="footer-trust-strip">
        <div className="med-container trust-grid">
          <div className="trust-item">
            <div className="trust-icon-box">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4>CE & ISO 13485 Certified</h4>
              <p>Strict clinical quality compliance</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-box">
              <Award size={24} />
            </div>
            <div>
              <h4>Biomedical Warranty</h4>
              <p>Comprehensive manufacturer warranty</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-box">
              <Clock size={24} />
            </div>
            <div>
              <h4>Express Medical Dispatch</h4>
              <p>Insured courier to hospitals & clinics</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-box">
              <Phone size={24} />
            </div>
            <div>
              <h4>24/7 Clinical Support</h4>
              <p>Direct specialist & engineer assistance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="med-container footer-main">
        {/* Brand Column */}
        <div className="footer-col brand-col">
          <div className="footer-brand">
            <span className="brand-logo-text">MED<span className="text-accent">Q</span></span>
            <span className="brand-pill">Medical Equipment</span>
          </div>
          <p className="footer-desc">
            MEDQ is a certified healthcare equipment platform supplying state-of-the-art diagnostic,
            therapeutic, surgical, and ICU care devices to hospitals, diagnostic clinics, and practitioners worldwide.
          </p>
          <div className="contact-details">
            <div className="contact-line">
              <MapPin size={16} /> <span>742 Evergreen Medical Parkway, Healthcare District</span>
            </div>
            <div className="contact-line">
              <Phone size={16} /> <span>+1 (800) 555-MEDQ (Mon-Sat 8am-8pm EST)</span>
            </div>
            <div className="contact-line">
              <Mail size={16} /> <span>support@medq-equipment.com</span>
            </div>
          </div>
        </div>

        {/* Categories Column */}
        <div className="footer-col">
          <h3>Equipment Categories</h3>
          <ul className="footer-links">
            <li><Link to="/category/Diagnostic">Diagnostic Imaging & ECG</Link></li>
            <li><Link to="/category/Surgical">Surgical & OR Instruments</Link></li>
            <li><Link to="/category/Therapeutic">Therapeutic & Dialysis</Link></li>
            <li><Link to="/category/Laboratory">Laboratory & Centrifuges</Link></li>
            <li><Link to="/category/Patient%20Care">Patient Care & Monitoring</Link></li>
            <li><Link to="/equipments">Full Medical Catalog</Link></li>
          </ul>
        </div>

        {/* Customer Support Column */}
        <div className="footer-col">
          <h3>Customer Support</h3>
          <ul className="footer-links">
            <li><Link to="/help">Help Center & FAQ</Link></li>
            <li><Link to="/myorders">Order History & Tracking</Link></li>
            <li><Link to="/addresses">Shipping Address Book</Link></li>
            <li><Link to="/chat">Specialist Inquiry</Link></li>
            <li><Link to="/help">Returns & Warranty Policy</Link></li>
          </ul>
        </div>

        {/* Compliance & My Account */}
        <div className="footer-col">
          <h3>My Account & Security</h3>
          <ul className="footer-links">
            <li><Link to="/profile?tab=overview">Account Overview</Link></li>
            <li><Link to="/profile?tab=personal">Personal Information</Link></li>
            <li><Link to="/profile?tab=security">Account Security</Link></li>
            <li><Link to="/wishlist">Saved Wishlist</Link></li>
          </ul>

          <div className="compliance-box">
            <div className="compliance-title">Compliance Standards</div>
            <div className="certification-pills">
              <span className="cert-pill"><CheckCircle2 size={12} /> ISO 13485:2016</span>
              <span className="cert-pill"><CheckCircle2 size={12} /> CE Medical</span>
              <span className="cert-pill"><CheckCircle2 size={12} /> 256-bit SSL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal / Copyright */}
      <div className="footer-bottom">
        <div className="med-container bottom-flex">
          <p>&copy; {new Date().getFullYear()} MEDQ Healthcare Equipment Inc. All rights reserved.</p>
          <div className="bottom-links">
            <Link to="/help">Privacy Policy</Link>
            <span className="sep">•</span>
            <Link to="/help">Terms of Sale</Link>
            <span className="sep">•</span>
            <Link to="/help">Compliance & Safety</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
