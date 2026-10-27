import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '../api';
import './Auth.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Request token, 2: Reset password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      setLoading(true);
      const res = await authApi.forgotPassword(email);
      setMessage(res.message);
      if (res.token) {
        setResetToken(res.token);
      }
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to request reset token.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      setLoading(true);
      const res = await authApi.resetPassword(resetToken, newPassword);
      setMessage(res.message);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-shell med-card animate-fade-in">
        <div className="auth-card-top text-center">
          <div className="auth-logo-badge">
            <KeyRound size={28} className="text-primary" />
          </div>
          <h2>Reset Account Password</h2>
          <p className="text-muted">Recover access to your MEDQ clinical account</p>
        </div>

        {error && (
          <div className="alert-banner alert-danger mb-4">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="alert-banner alert-success mb-4">
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestToken}>
            <div className="form-group">
              <label className="form-label">Registered Email Address</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-icon" />
                <input
                  type="email"
                  className="form-input with-icon"
                  placeholder="doctor@hospital.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-100 mt-3" disabled={loading}>
              {loading ? 'Generating Token...' : 'Generate Reset Token'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">Reset Token</label>
              <input
                type="text"
                className="form-input"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste token or enter here"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-100 mt-3" disabled={loading}>
              {loading ? 'Resetting Password...' : 'Update Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-3">
            <p className="text-success font-bold mb-3">Your password has been reset successfully!</p>
            <Link to="/login" className="btn btn-primary w-100">
              Return to Login
            </Link>
          </div>
        )}

        <div className="auth-footer-prompt text-center mt-4">
          <Link to="/login" className="back-link">
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
