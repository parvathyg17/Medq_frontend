import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Phone,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { feedbackApi } from '../api';
import './HelpContactPage.css';

const HelpContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: "How are high-value biomedical instruments packaged and dispatched?",
      a: "All diagnostic monitors, ultrasound systems, and ICU equipment are packaged in shock-absorbing electrostatic foam cases with calibrated temperature monitors, shipped via insured medical couriers."
    },
    {
      q: "What warranty and service guarantees are provided on MedQ equipment?",
      a: "Every certified device includes a comprehensive 1-year manufacturer warranty covering internal biomedical sensors, electronic boards, and calibration defects. Extended 3-year hospital service contracts can be added upon procurement."
    },
    {
      q: "What payment methods are supported for hospitals and clinics?",
      a: "We support Cash on Delivery (COD) with clinic inspection, institutional Purchase Orders (Net-30 for registered healthcare systems), Credit/Debit Cards, and direct UPI bank settlements."
    },
    {
      q: "Can orders be cancelled or modified before shipment?",
      a: "Yes. Customers and clinics can cancel unfulfilled orders directly through the 'My Orders' portal before express dispatch. All reserved stock is safely returned to inventory."
    },
    {
      q: "Do you offer formal calibration and safety certification documentation?",
      a: "Yes. Every diagnostic scanner, autoclave, and centrifuge ships with a traceable laboratory calibration certificate compliant with CE and ISO 13485 standards."
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) return;

    try {
      setLoading(true);
      setError(null);
      await feedbackApi.submitContact(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      setError(err.message || 'Failed to submit your message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="help-page py-4">
      <div className="med-container">
        <div className="help-hero-banner med-card text-center mb-5">
          <HelpCircle size={48} className="help-main-icon" />
          <h1 className="page-title mt-2">Clinical Support & FAQ Center</h1>
          <p className="page-subtitle max-w-650 mx-auto">
            Find immediate answers regarding equipment specifications, warranties, institutional bidding,
            or contact our dedicated medical engineering desk.
          </p>
        </div>

        <div className="help-layout-grid">
          {/* FAQ Accordion */}
          <div className="faq-area-block">
            <h2 className="section-title mb-3">Frequently Asked Questions</h2>
            <div className="faq-accordion-stack">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div key={idx} className={`faq-card med-card ${isOpen ? 'open' : ''}`}>
                    <div className="faq-question-row" onClick={() => setActiveFaq(isOpen ? null : idx)}>
                      <h3>{faq.q}</h3>
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                    {isOpen && (
                      <div className="faq-answer-block animate-fade-in">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Inquiry Form */}
          <div className="contact-form-block">
            <div className="med-card contact-card">
              <h2 className="section-title mb-2">Send Clinical Inquiry</h2>
              <p className="text-muted small mb-4">
                Have a customized procurement question? Our biomedical engineering team typically responds within 2-4 hours.
              </p>

              {submitted && (
                <div className="alert-banner alert-success mb-3 animate-fade-in">
                  <CheckCircle2 size={18} />
                  <span>Thank you! Your inquiry has been routed to our clinical desk.</span>
                </div>
              )}

              {error && (
                <div className="alert-banner alert-danger mb-3 animate-fade-in">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name / Clinic Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Dr. Rajesh Patel / St. Jude Hospital"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="procurement@clinic.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Bulk quote for 10 Oxygen Concentrators"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Message Details *</label>
                  <textarea
                    rows={4}
                    className="form-textarea"
                    placeholder="Provide details about your medical facility requirements, timeline, or product specs..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100 btn-lg" disabled={loading}>
                  {loading ? 'Submitting Inquiry...' : (
                    <>
                      <Send size={16} /> Submit Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpContactPage;
