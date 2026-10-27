import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Lock, Mail, ShieldCheck, AlertCircle, Sparkles, UserCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const res = await login(identifier, password);
      if (res.role === 'ADMIN') {
        navigate('/admin');
      } else if (res.role === 'DELIVERY_PERSON') {
        navigate('/delivery-dashboard');
      } else {
        navigate(from === '/login' ? '/' : from);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPassword) => {
    setIdentifier(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-shell med-card animate-fade-in">
        <div className="auth-card-top text-center">
          <div className="auth-logo-badge">
            <span className="logo-text-main">MED<span className="logo-accent">Q</span></span>
          </div>
          <h2>Welcome Back</h2>
          <p className="text-muted">Sign in to your MEDQ clinical account</p>
        </div>

        {error && (
          <div className="alert-banner alert-danger mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email or Phone Number</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-icon" />
              <input
                type="text"
                className="form-input with-icon"
                placeholder="doctor@hospital.org or phone"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="d-flex-between mb-1">
              <label className="form-label mb-0">Password</label>
              <Link to="/forgot" className="forgot-pass-link">
                Forgot Password?
              </Link>
            </div>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input with-icon"
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button type="submit" className="btn btn-primary btn-lg w-100 mt-3" disabled={loading}>
            {loading ? 'Authenticating...' : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="demo-credentials-box mt-4">
          <span className="demo-label"><Sparkles size={14} /> Quick Demo Logins:</span>
          <div className="demo-buttons-grid">
            <button
              type="button"
              className="demo-btn admin-demo"
              onClick={() => handleQuickDemo('admin@medq.com', 'Admin@123')}
            >
              Demo Admin
            </button>
            <button
              type="button"
              className="demo-btn customer-demo"
              onClick={() => handleQuickDemo('customer@medq.com', 'Customer@123')}
            >
              Demo Customer
            </button>
          </div>
        </div>

        <div className="auth-footer-prompt text-center mt-4">
          <p>
            Don't have an account yet? <Link to="/signup" className="text-bold">Register as a Clinic or Provider</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
