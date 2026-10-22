import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './NavbarStyles.module.css';
import { 
  Home, Bed, User, LogIn, LogOut, Menu, X, Shield, 
  Sun, Moon, ChevronDown 
} from 'lucide-react';

const Navbar = ({ toggleTheme, theme }) => {
  const { user, logout, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!profileOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) setProfileOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileOpen]);

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/rooms', label: 'Rooms', icon: Bed },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar ${styles.root}`}>
      <div className="container flex items-center justify-between" style={{ height: '70px' }}>
        <Link to="/" className="logo flex items-center gap-sm">
          <Bed size={28} className="logo-icon" />
          <span className="logo-text">New Regent<small className="logo-tagline">GUEST HOUSE</small></span>
        </Link>

        <div className="nav-links flex items-center gap-lg">
          {navLinks.map(link => (
            <Link 
              key={link.path} 
              to={link.path}
              className={`nav-link flex items-center gap-sm ${isActive(link.path) ? 'active' : ''}`}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          ))}
        </div>

        <div className="nav-actions flex items-center gap-md">
          <button onClick={toggleTheme} className="theme-btn">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {user ? (
            <div className="profile-menu" ref={profileMenuRef}>
              <button 
                className="profile-btn flex items-center gap-sm"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <div className="avatar flex items-center justify-center">
                  <User size={18} />
                </div>
                <span className="username">{user.name}</span>
                <ChevronDown size={16} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div 
                    className="dropdown"
                    role="menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {isAdmin && (
                      <button role="menuitem" onClick={() => { navigate('/admin'); setProfileOpen(false); }}>
                        <Shield size={16} /> Admin Panel
                      </button>
                    )}
                    <button role="menuitem" onClick={() => { navigate('/dashboard'); setProfileOpen(false); }}>
                      <User size={16} /> My Dashboard
                    </button>
                    <button role="menuitem" onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}>
                      <LogOut size={16} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="auth-links flex items-center gap-md">
              <Link to="/login" className="nav-link flex items-center gap-sm">
                <LogIn size={18} /> Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </div>
          )}

          <button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {navLinks.map(link => (
              <Link 
                key={link.path} 
                to={link.path}
                className={`mobile-link flex items-center gap-sm ${isActive(link.path) ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                {isAdmin && (
                  <button onClick={() => { navigate('/admin'); setMenuOpen(false); }} className="mobile-link flex items-center gap-sm">
                    <Shield size={18} /> Admin Panel
                  </button>
                )}
                <button onClick={() => { navigate('/dashboard'); setMenuOpen(false); }} className="mobile-link flex items-center gap-sm">
                  <User size={18} /> My Dashboard
                </button>
                <button onClick={() => { logout(); setMenuOpen(false); }} className="mobile-link flex items-center gap-sm">
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-link flex items-center gap-sm" onClick={() => setMenuOpen(false)}>
                  <LogIn size={18} /> Login
                </Link>
                <Link to="/register" className="mobile-link flex items-center gap-sm" onClick={() => setMenuOpen(false)}>
                  <User size={18} /> Register
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
