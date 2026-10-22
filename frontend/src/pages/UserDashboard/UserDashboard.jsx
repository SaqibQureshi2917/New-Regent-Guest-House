import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, CreditCard, LogOut, Settings, Bed, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { bookingAPI, paymentAPI, authAPI } from '../../services/api.js';
import { getRoomImageSource, handleRoomImageError } from '../../lib/roomImages.js';
import styles from './UserDashboardStyles.module.css';
import { formatCurrency } from '../../lib/currency.js';
import ConfirmationDialog from '../../components/ConfirmationDialog/ConfirmationDialog.jsx';
import { toast } from 'sonner';

const UserDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileData, setProfileData] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [activeTab, setActiveTab] = useState('bookings');
  const [confirmation, setConfirmation] = useState(null);
  const closeConfirmation = useCallback(() => setConfirmation(null), []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setDataError('');
    try {
      const [bookingsRes, paymentsRes] = await Promise.all([
        bookingAPI.getMyBookings(),
        paymentAPI.getMyPayments()
      ]);
      setBookings(bookingsRes.bookings || []);
      setPayments(paymentsRes.payments || []);
    } catch (err) {
      console.error(err);
      setDataError('Your account data could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await authAPI.updateProfile(profileData);
      updateUser(res.user);
      setProfileEdit(false);
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not update your profile.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      await bookingAPI.cancel(bookingId, 'User cancelled');
      toast.success('Booking cancelled successfully.');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not cancel this booking.');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'badge-available',
      pending: 'badge-pending',
      cancelled: 'badge-booked',
      completed: 'badge-available'
    };
    return <span className={`badge ${styles[status] || 'badge-pending'}`}>{status}</span>;
  };

  const tabs = [
    { id: 'bookings', label: 'My Bookings', icon: Bed },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <div className={`dashboard-page ${styles.root}`}>
      <div className={`container ${styles.dashboardLayout}`}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarBrand}>
            <span className={styles.brandMark}><Bed size={20} /></span>
            <div><strong>Guest account</strong><span>New Regent</span></div>
          </div>
          <p className={styles.sidebarLabel}>YOUR STAY</p>
          <nav className={styles.sidebarNav} aria-label="User dashboard sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.sidebarLink} ${activeTab === tab.id ? styles.sidebarLinkActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className={styles.sidebarIcon}><tab.icon size={18} /></span> <span>{tab.label}</span>
                {tab.id === 'bookings' && bookings.length > 0 && <span className={styles.sidebarCount}>{bookings.length}</span>}
              </button>
            ))}
          </nav>
          <div className={styles.sidebarAccount}>
            <div className={styles.sidebarAvatar}>{user?.name?.charAt(0)?.toUpperCase() || <User size={18} />}</div>
            <div className={styles.sidebarIdentity}><strong>{user?.name}</strong><span>Guest</span></div>
            <button className={styles.sidebarLogout} onClick={logout} aria-label="Log out"><LogOut size={18} /></button>
          </div>
        </aside>
        <main className={styles.dashboardMain}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="dashboard-header flex items-center justify-between" style={{ marginBottom: '2rem' }}>
            <div>
              <h1 className="dashboard-title">Welcome, {user?.name}</h1>
              <p className="dashboard-subtitle">Manage your bookings and account</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="stats-row flex flex-wrap" style={{ gap: '1rem', marginBottom: '2rem' }}>
            <div className="stat-card card flex items-center gap-md" style={{ flex: '1 1 200px', padding: '1.25rem' }}>
              <div className="stat-icon-bg">
                <Bed size={24} />
              </div>
              <div>
                <h3>{bookings.length}</h3>
                <p>Total Bookings</p>
              </div>
            </div>
            <div className="stat-card card flex items-center gap-md" style={{ flex: '1 1 200px', padding: '1.25rem' }}>
              <div className="stat-icon-bg" style={{ background: 'rgba(39, 174, 96, 0.15)', color: 'var(--success)' }}>
                <Check size={24} />
              </div>
              <div>
                <h3>{bookings.filter(b => b.status === 'confirmed').length}</h3>
                <p>Confirmed</p>
              </div>
            </div>
            <div className="stat-card card flex items-center gap-md" style={{ flex: '1 1 200px', padding: '1.25rem' }}>
              <div className="stat-icon-bg" style={{ background: 'rgba(201, 169, 110, 0.15)', color: 'var(--primary)' }}>
                <CreditCard size={24} />
              </div>
              <div>
                <h3>{formatCurrency(payments.filter(p => p.status === 'completed').reduce((a, p) => a + (p.amount || 0), 0))}</h3>
                <p>Total Spent</p>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {loading ? (
            <div className="flex items-center justify-center" style={{ padding: '3rem' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : dataError ? (
            <div role="alert" className="empty-state card text-center" style={{ padding: '2rem' }}>
              <p>{dataError}</p>
              <button type="button" className="btn btn-secondary" onClick={fetchData}>Try again</button>
            </div>
          ) : (
            <>
              {activeTab === 'bookings' && (
                <div className="bookings-list">
                  {bookings.length === 0 ? (
                    <div className="empty-state card text-center" style={{ padding: '3rem' }}>
                      <Bed size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                      <h3>No bookings yet</h3>
                      <p>Start exploring our rooms and book your stay!</p>
                    </div>
                  ) : (
                    bookings.map((booking, i) => (
                      <motion.div
                        key={booking._id || i}
                        className="booking-card card"
                        style={{ padding: '1.25rem', marginBottom: '1rem' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex" style={{ gap: '1rem' }}>
                            <img 
                              src={getRoomImageSource(booking.room)}
                              alt={booking.room?.name}
                              className="booking-thumb"
                              onError={(event) => handleRoomImageError(event, booking.room)}
                            />
                            <div>
                              <h4>{booking.room?.name || 'Room'}</h4>
                              <p className="booking-id">Booking ID: {booking.bookingId}</p>
                              <p className="booking-dates">
                                <Calendar size={14} /> {booking.checkIn && new Date(booking.checkIn).toLocaleDateString()} - {booking.checkOut && new Date(booking.checkOut).toLocaleDateString()}
                              </p>
                              <p className="booking-price">{formatCurrency(booking.totalPrice)} · {booking.nights} nights</p>
                              <div style={{ marginTop: '0.5rem' }}>
                                {getStatusBadge(booking.status)}
                                <span className="badge badge-pending" style={{ marginLeft: '0.5rem' }}>{booking.paymentStatus}</span>
                              </div>
                            </div>
                          </div>
                          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                              onClick={() => setConfirmation({ title: 'Cancel this booking?', description: `Your booking for ${booking.room?.name || 'this room'} will be cancelled.`, confirmLabel: 'Cancel booking', onConfirm: () => handleCancelBooking(booking._id) })}
                            >
                              <X size={14} /> Cancel
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="payments-list">
                  {payments.length === 0 ? (
                    <div className="empty-state card text-center" style={{ padding: '3rem' }}>
                      <CreditCard size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                      <h3>No payments yet</h3>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Booking ID</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment, i) => (
                            <tr key={payment._id || i}>
                              <td>{payment.booking?.bookingId || '-'}</td>
                              <td>{formatCurrency(payment.amount)}</td>
                              <td>{payment.paymentMethod}</td>
                              <td>{getStatusBadge(payment.status)}</td>
                              <td>{payment.createdAt && new Date(payment.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="profile-section card" style={{ padding: '1.5rem', maxWidth: '500px' }}>
                  {!profileEdit ? (
                    <>
                      <div className="profile-header flex items-center gap-md" style={{ marginBottom: '1.5rem' }}>
                        <div className="avatar-large flex items-center justify-center">
                          <User size={32} />
                        </div>
                        <div>
                          <h3>{user?.name}</h3>
                          <p className="text-muted">{user?.email}</p>
                        </div>
                      </div>
                      <div className="profile-details">
                        <div className="profile-row flex items-center justify-between" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                          <span className="text-muted">Phone</span>
                          <span>{user?.phone}</span>
                        </div>
                        <div className="profile-row flex items-center justify-between" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                          <span className="text-muted">Role</span>
                          <span className="badge badge-available">{user?.role}</span>
                        </div>
                        <div className="profile-row flex items-center justify-between" style={{ padding: '0.75rem 0' }}>
                          <span className="text-muted">Member Since</span>
                          <span>{new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button className="btn btn-primary w-full" style={{ marginTop: '1.5rem' }} onClick={() => setProfileEdit(true)}>
                        <Settings size={18} /> Edit Profile
                      </button>
                    </>
                  ) : (
                    <form onSubmit={handleUpdateProfile}>
                      <h3 style={{ marginBottom: '1rem' }}>Edit Profile</h3>
                      <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                          type="tel"
                          className="form-input"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-md" style={{ marginTop: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setProfileEdit(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Changes</button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
        </motion.div>
        </main>
      </div>
      <ConfirmationDialog
        open={Boolean(confirmation)}
        title={confirmation?.title}
        description={confirmation?.description}
        confirmLabel={confirmation?.confirmLabel}
        onConfirm={confirmation?.onConfirm}
        onClose={closeConfirmation}
      />
    </div>
  );
};

export default UserDashboard;
