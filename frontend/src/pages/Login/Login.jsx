import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { authAPI } from '../../services/api.js';
import AuthModal from '../../components/AuthModal/AuthModal.jsx';
import styles from './LoginStyles.module.css';
import { toast } from 'sonner';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accountNotFound, setAccountNotFound] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const closeModal = useCallback(() => navigate('/'), [navigate]);

  React.useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAccountNotFound(false);
    try {
      const res = await authAPI.login(formData);
      login(res.user, res.token);
      toast.success(`Welcome back, ${res.user.name || 'guest'}!`, { description: 'You have signed in successfully.' });
      navigate(res.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'We could not sign you in. Please try again.');
      setAccountNotFound(err.response?.data?.code === 'ACCOUNT_NOT_FOUND');
      toast.error(err.response?.data?.message || 'We could not sign you in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthModal
      className={`auth-page ${styles.root}`}
      title="Sign in to New Regent"
      backgroundImage="/room-royal-1.jpg"
      onClose={closeModal}
    >
        <div className="auth-card card">
          <div className="text-center" style={{ marginBottom: '1.5rem' }}>
            <LogIn size={40} className="auth-icon" />
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Sign in to your account</p>
          </div>

          {error && (
            <div className="error-message" role="alert" style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(192, 57, 43, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)' }}>
              {error}
              {accountNotFound && <p style={{ margin: '0.5rem 0 0' }}>New to New Regent? <Link to="/register">Create an account</Link></p>}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email" className="form-label flex items-center gap-sm">
                <Mail size={16} /> Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                aria-label="Email address"
                className="form-input"
                placeholder="your@email.com"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password" className="form-label flex items-center gap-sm">
                <Lock size={16} /> Password
              </label>
              <div className="password-input">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="form-input"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer text-center" style={{ marginTop: '1.5rem' }}>
            <p>Don't have an account? <Link to="/register">Register</Link></p>
            <Link to="/" className="flex items-center justify-center gap-sm" style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>
        </div>
    </AuthModal>
  );
};

export default Login;
