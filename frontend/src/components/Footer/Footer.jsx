import React from 'react';
import { Link } from 'react-router-dom';
import { Bed, MapPin, Phone, Mail, Facebook, Instagram, Twitter } from 'lucide-react';
import styles from './FooterStyles.module.css';

const Footer = () => {
  return (
    <footer className={`footer ${styles.root}`}>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="logo flex items-center gap-sm" style={{ marginBottom: '1rem' }} aria-label="New Regent Guest House home">
              <Bed size={28} className="logo-icon" />
              <span className="logo-text">New Regent<small className="logo-tagline">GUEST HOUSE</small></span>
            </Link>
            <p className="footer-desc">
              Experience luxury and comfort at its finest. Our guest house offers premium accommodations with world-class amenities.
            </p>
            <div className="social-links flex items-center gap-md" style={{ marginTop: '1.5rem' }}>
              <a href="#" className="social-link"><Facebook size={20} /></a>
              <a href="#" className="social-link"><Instagram size={20} /></a>
              <a href="#" className="social-link"><Twitter size={20} /></a>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/rooms">Rooms</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Contact</h4>
            <ul className="footer-links">
              <li className="flex items-center gap-sm">
                <MapPin size={16} /> 123 Luxury Lane, City Center
              </li>
              <li className="flex items-center gap-sm">
                <Phone size={16} /> +1 (555) 123-4567
              </li>
              <li className="flex items-center gap-sm">
                <Mail size={16} /> info@guesthouse.com
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Services</h4>
            <ul className="footer-links">
              <li>Room Service</li>
              <li>Free WiFi</li>
              <li>Airport Transfer</li>
              <li>24/7 Reception</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom flex items-center justify-between">
          <p>New Regent Guest House. All rights reserved.</p>
          <div className="footer-legal flex items-center gap-md">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
