import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Phone, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.name.trim()) return 'Please enter your full name or clinical title.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Please enter a valid email address.';
    if (!/^\d{10}$/.test(formData.phone.replace(/[^0-9]/g, ''))) return 'Please enter a valid 10-digit mobile number.';
    if (formData.password.length < 6) return 'Password must be at least 6 characters.';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirm_password: formData.confirmPassword,
        role: formData.role
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-shell med-card animate-fade-in max-w-500">
        <div className="auth-card-top text-center">
          <div className="auth-logo-badge">
            <span className="logo-text-main">MED<span className="logo-accent">Q</span></span>
          </div>
          <h2>Create Professional Account</h2>
          <p className="text-muted">Register your clinic, hospital, or provider account</p>
        </div>

        {error && (
          <div className="alert-banner alert-danger mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert-banner alert-success mb-4">
            <CheckCircle2 size={18} />
            <span>Account created successfully! Redirecting you to login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name / Clinical Representative *</label>
            <div className="auth-input-wrapper">
              <User size={18} className="auth-icon" />
              <input
                type="text"
                name="name"
                className="form-input with-icon"
                placeholder="Dr. Emily Watson"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Official Email Address *</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-icon" />
              <input
                type="email"
                name="email"
                className="form-input with-icon"
                placeholder="emily@stjudehospital.org"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">10-Digit Mobile / Phone Number *</label>
            <div className="auth-input-wrapper">
              <Phone size={18} className="auth-icon" />
              <input
                type="tel"
                name="phone"
                className="form-input with-icon"
                placeholder="9876543210"
                maxLength="10"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-input with-icon"
                  placeholder="Min 6 chars"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="form-input with-icon"
                  placeholder="Re-type password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Account Type</label>
            <select
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="CUSTOMER">Customer / Healthcare Clinic & Hospital Provider</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-100 mt-2" disabled={loading}>
            {loading ? 'Creating Account...' : (
              <>
                <UserPlus size={18} /> Register Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-prompt text-center mt-4">
          <p>
            Already have an account? <Link to="/login" className="text-bold">Sign In here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
