import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, AlertTriangle, ArrowLeft } from 'lucide-react';
import styles from './NotFoundStyles.module.css';

const NotFound = () => {
  return (
    <div className={`not-found-page flex items-center justify-center ${styles.root}`}>
      <motion.div
        className="not-found-content text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <AlertTriangle size={64} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found</h2>
        <p className="not-found-desc">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary flex items-center justify-center gap-sm" style={{ margin: '2rem auto 0', maxWidth: '200px' }}>
          <ArrowLeft size={18} /> Back to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
