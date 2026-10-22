import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar/Navbar.jsx';
import Footer from './components/Footer/Footer.jsx';
import Home from './pages/Home/Home.jsx';
import Rooms from './pages/Rooms/Rooms.jsx';
import Login from './pages/Login/Login.jsx';
import Register from './pages/Register/Register.jsx';
import UserDashboard from './pages/UserDashboard/UserDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard.jsx';
import NotFound from './pages/NotFound/NotFound.jsx';
import LoadingScreen from './components/LoadingScreen/LoadingScreen.jsx';
import styles from './App.module.css';
import { Toaster } from 'sonner';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  
  return children;
};

const AppContent = () => {
  const { loading: authLoading } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    const introTimer = window.setTimeout(() => setIntroComplete(true), 1600);
    return () => window.clearTimeout(introTimer);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (authLoading || !introComplete) return <LoadingScreen />;

  return (
    <div className={`app-wrapper ${styles.root}`}>
      <Navbar toggleTheme={toggleTheme} theme={theme} />
      <main>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/login" element={<><Home /><Login /></>} />
            <Route path="/register" element={<><Home /><Register /></>} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
      {location.pathname !== '/dashboard' && location.pathname !== '/admin' && <Footer />}
      <Toaster position="top-right" theme={theme} richColors closeButton />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
