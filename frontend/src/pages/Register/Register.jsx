import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, Eye, EyeOff, Phone, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { authAPI } from '../../services/api.js';
import AuthModal from '../../components/AuthModal/AuthModal.jsx';
import styles from './RegisterStyles.module.css';
import { toast } from 'sonner';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
    try {
      const res = await authAPI.register(formData);
      login(res.user, res.token);
      toast.success('Account created successfully.', { description: `Welcome to New Regent, ${res.user.name || 'guest'}!` });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'We could not create your account. Please try again.');
      toast.error(err.response?.data?.message || 'We could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthModal
      className={`auth-page ${styles.root}`}
      title="Create a New Regent account"
      backgroundImage="/room-deluxe-1.jpg"
      onClose={closeModal}
    >
        <div className="auth-card card">
          <div className="text-center" style={{ marginBottom: '1.5rem' }}>
            <UserPlus size={40} className="auth-icon" />
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-subtitle">Join New Regent today</p>
          </div>

          {error && (
            <div className="error-message" role="alert" style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(192, 57, 43, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="register-name" className="form-label flex items-center gap-sm">
                <User size={16} /> Full Name
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                className="form-input"
                placeholder="John Doe"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-email" className="form-label flex items-center gap-sm">
                <Mail size={16} /> Email
              </label>
              <input
                id="register-email"
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
              <label htmlFor="register-phone" className="form-label flex items-center gap-sm">
                <Phone size={16} /> Phone
              </label>
              <input
                id="register-phone"
                type="tel"
                autoComplete="tel"
                className="form-input"
                placeholder="+1 (555) 123-4567"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-password" className="form-label flex items-center gap-sm">
                <Lock size={16} /> Password
              </label>
              <div className="password-input">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="form-input"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer text-center" style={{ marginTop: '1.5rem' }}>
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
            <Link to="/" className="flex items-center justify-center gap-sm" style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>
        </div>
    </AuthModal>
  );
};

export default Register;
