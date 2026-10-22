import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Shield, Users, Bed, Calendar, CreditCard, BarChart3, 
  TrendingUp, AlertCircle, Star, Trash2, LogOut, Pencil, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { adminAPI, roomAPI, bookingAPI, paymentAPI } from '../../services/api.js';
import { getRoomImageSource, handleRoomImageError } from '../../lib/roomImages.js';
import styles from './AdminDashboardStyles.module.css';
import { formatCurrency } from '../../lib/currency.js';
import ConfirmationDialog from '../../components/ConfirmationDialog/ConfirmationDialog.jsx';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recentBookings, setRecentBookings] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [roomFiles, setRoomFiles] = useState([]);
  const [savingRoom, setSavingRoom] = useState(false);
  const [roomFormError, setRoomFormError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const closeConfirmation = useCallback(() => setConfirmation(null), []);
  const [roomForm, setRoomForm] = useState({
    name: '', roomNumber: '', type: 'standard', price: '', capacity: 1,
    description: '', images: '', bathroomImage: '', amenities: '', featured: false
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!showRoomForm) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !savingRoom) {
        resetRoomForm();
        setShowRoomForm(false);
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [showRoomForm, savingRoom]);

  const fetchData = async () => {
    setLoading(true);
    setDataError('');
    try {
      const [dashboardRes, usersRes, roomsRes, bookingsRes, paymentsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getUsers(),
        roomAPI.getAll(),
        bookingAPI.getAll(),
        paymentAPI.getAll()
      ]);
      
      setStats(dashboardRes.stats || {});
      setRecentBookings(dashboardRes.recentBookings || []);
      setMonthlyRevenue(dashboardRes.monthlyRevenue || []);
      setUsers(usersRes.users || []);
      setRooms(roomsRes.rooms || []);
      setAllBookings(bookingsRes.bookings || []);
      setPayments(paymentsRes.payments || []);
    } catch (err) {
      console.error(err);
      setDataError('Dashboard data could not be loaded. Check that the API and database are available, then try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await adminAPI.deleteUser(id);
      toast.success('User deleted successfully.');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not delete this user.');
    }
  };

  const handleDeleteRoom = async (id) => {
    try {
      await roomAPI.delete(id);
      toast.success('Room deleted successfully.');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not delete this room.');
    }
  };

  const resetRoomForm = () => {
    setRoomForm({ name: '', roomNumber: '', type: 'standard', price: '', capacity: 1, description: '', images: '', bathroomImage: '', amenities: '', featured: false });
    setEditingRoomId(null);
    setRoomFiles([]);
    setRoomFormError('');
  };

  const handleEditRoom = (room) => {
    setRoomForm({
      name: room.name || '', roomNumber: room.roomNumber || '', type: room.type || 'standard',
      price: room.price ?? '', capacity: room.capacity ?? 1, description: room.description || '',
      images: (room.images || []).join(', '), bathroomImage: room.bathroomImage || '',
      amenities: (room.amenities || []).join(', '), featured: Boolean(room.featured)
    });
    setEditingRoomId(room._id);
    setRoomFiles([]);
    setRoomFormError('');
    setShowRoomForm(true);
  };

  const handleSaveRoom = async (event) => {
    event.preventDefault();
    setRoomFormError('');
    setSavingRoom(true);
    try {
      const images = roomForm.images.split(',').map((image) => image.trim()).filter(Boolean);
      for (const file of roomFiles) {
        const uploaded = await roomAPI.uploadImage(file);
        images.push(uploaded.url);
      }
      if (!images.length) throw new Error('Add at least one image URL or choose an image file.');
      const payload = {
        ...roomForm,
        price: Number(roomForm.price),
        capacity: Number(roomForm.capacity),
        images,
        amenities: roomForm.amenities.split(',').map((item) => item.trim()).filter(Boolean)
      };
      if (editingRoomId) await roomAPI.update(editingRoomId, payload);
      else await roomAPI.create(payload);
      toast.success(editingRoomId ? 'Room updated successfully.' : 'Room added successfully.');
      resetRoomForm();
      setShowRoomForm(false);
      await fetchData();
    } catch (err) {
      setRoomFormError(err.response?.data?.message || err.message || 'Room could not be created.');
      toast.error(err.response?.data?.message || err.message || 'Room could not be saved.');
    } finally {
      setSavingRoom(false);
    }
  };

  const handleToggleFeatured = async (room) => {
    try {
      await roomAPI.update(room._id, { featured: !room.featured });
      toast.success(room.featured ? 'Room removed from featured.' : 'Room featured on the homepage.');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not update the featured setting.');
    }
  };

  const handleUpdateBookingStatus = async (id, status) => {
    try {
      await bookingAPI.updateStatus(id, status);
      toast.success(`Booking marked ${status}.`);
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not update booking status.');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'rooms', label: 'Rooms', icon: Bed },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'users', label: 'Users', icon: Users }
  ];

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: 'blue' },
    { label: 'Total Rooms', value: stats.totalRooms || 0, icon: Bed, color: 'green' },
    { label: 'Total Bookings', value: stats.totalBookings || 0, icon: Calendar, color: 'purple' },
    { label: 'Pending', value: stats.pendingBookings || 0, icon: AlertCircle, color: 'orange' },
    { label: 'Revenue', value: formatCurrency(stats.totalRevenue), icon: CreditCard, color: 'gold' }
  ];

  return (
    <div className={`admin-page ${styles.root}`}>
      <div className={`container ${styles.dashboardLayout}`}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarBrand}>
            <span className={styles.brandMark}><Shield size={20} /></span>
            <div><strong>Management</strong><span>New Regent</span></div>
          </div>
          <p className={styles.sidebarLabel}>WORKSPACE</p>
          <nav className={styles.sidebarNav} aria-label="Admin dashboard sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.sidebarLink} ${activeTab === tab.id ? styles.sidebarLinkActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className={styles.sidebarIcon}><tab.icon size={18} /></span> <span>{tab.label}</span>
              </button>
            ))}
          </nav>
          <div className={styles.sidebarAccount}>
            <div className={styles.sidebarAvatar}>{user?.name?.charAt(0)?.toUpperCase() || <Shield size={18} />}</div>
            <div className={styles.sidebarIdentity}><strong>{user?.name}</strong><span>Administrator</span></div>
            <button className={styles.sidebarLogout} onClick={() => { logout(); navigate('/'); }} aria-label="Log out"><LogOut size={18} /></button>
          </div>
        </aside>
        <main className={styles.dashboardMain}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="admin-header flex items-center justify-between" style={{ marginBottom: '2rem' }}>
            <div className="flex items-center gap-md">
              <div className="admin-icon">
                <Shield size={28} />
              </div>
              <div>
                <h1 className="dashboard-title">Admin Dashboard</h1>
                <p className="dashboard-subtitle">Manage your guest house</p>
              </div>
            </div>
          </div>

          {dataError && (
            <div role="alert" style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(192, 57, 43, 0.1)', color: 'var(--danger)' }}>
              <p style={{ margin: '0 0 0.75rem' }}>{dataError}</p>
              <button type="button" className="btn btn-secondary" onClick={fetchData}>Try again</button>
            </div>
          )}

          {/* Stats Grid */}
          {activeTab === 'overview' && (
            <>
              <div className="admin-stats flex flex-wrap" style={{ gap: '1rem', marginBottom: '2rem' }}>
                {statCards.map((stat, i) => (
                  <motion.div
                    key={i}
                    className="stat-card card"
                    style={{ flex: '1 1 180px', padding: '1.25rem' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                      <span className="stat-label">{stat.label}</span>
                      <stat.icon size={20} className={`stat-icon-${stat.color}`} />
                    </div>
                    <h3 className="stat-value">{stat.value}</h3>
                  </motion.div>
                ))}
              </div>

              {/* Revenue Chart Placeholder */}
              <div className="chart-section card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                  <TrendingUp size={20} /> Monthly Revenue
                </h3>
                <div className="revenue-chart">
                  {monthlyRevenue.map((item, i) => {
                    const maxVal = Math.max(...monthlyRevenue.map(r => r.total), 1);
                    const height = (item.total / maxVal) * 200;
                    return (
                      <div key={i} className="chart-bar-wrapper">
                        <motion.div
                          className="chart-bar"
                          initial={{ height: 0 }}
                          animate={{ height: `${height}px` }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                        />
                        <span className="chart-label">{item._id.month}/{item._id.year}</span>
                      <span className="chart-value">{formatCurrency(item.total)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="recent-bookings card" style={{ padding: '1.5rem' }}>
                <h3 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recent Bookings</h3>
                {recentBookings.length === 0 ? (
                  <p className="text-muted">No recent bookings</p>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Guest</th>
                          <th>Room</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentBookings.map((b, i) => (
                          <tr key={i}>
                            <td>{b.bookingId}</td>
                            <td>{b.user?.name || '-'}</td>
                            <td>{b.room?.name || '-'}</td>
                            <td>{formatCurrency(b.totalPrice)}</td>
                            <td>
                              <span className={`badge badge-${b.status === 'confirmed' ? 'available' : b.status === 'pending' ? 'pending' : 'booked'}`}>
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'rooms' && (
            <div className="rooms-management">
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <h3>All Rooms</h3>
                <div className="flex items-center gap-md">
                  <span className="text-muted">{rooms.length} rooms</span>
                  <button type="button" className="btn btn-primary" onClick={() => { if (showRoomForm) { resetRoomForm(); setShowRoomForm(false); } else setShowRoomForm(true); }}>
                    {showRoomForm ? 'Close' : 'Add Room'}
                  </button>
                </div>
              </div>
              {showRoomForm && (
                <div className={styles.roomModalOverlay} onMouseDown={(event) => {
                  if (event.target === event.currentTarget && !savingRoom) {
                    resetRoomForm();
                    setShowRoomForm(false);
                  }
                }}>
                  <form className={styles.roomModal} onSubmit={handleSaveRoom} role="dialog" aria-modal="true" aria-labelledby="room-form-title">
                    <div className={styles.roomModalHeader}>
                      <div><h4 id="room-form-title">{editingRoomId ? 'Edit room' : 'Add a room'}</h4><p>Set the room details, nightly PKR rate, and photos.</p></div>
                      <button type="button" className={styles.roomModalClose} onClick={() => { resetRoomForm(); setShowRoomForm(false); }} disabled={savingRoom} aria-label="Close room form"><X size={20} /></button>
                    </div>
                    <div className={styles.roomFormFields}>
                    <input className="form-input" placeholder="Room name" required value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} />
                    <input className="form-input" placeholder="Room number" required value={roomForm.roomNumber} onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })} />
                    <select className="form-input" value={roomForm.type} onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}>
                      {['standard', 'deluxe', 'suite', 'presidential'].map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                    <label className={styles.roomFormField}>Nightly rate (PKR)<input className="form-input" type="number" min="0" step="1" placeholder="e.g. 12000" required value={roomForm.price} onChange={(e) => setRoomForm({ ...roomForm, price: e.target.value })} /></label>
                    <input className="form-input" type="number" min="1" placeholder="Guest capacity" required value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} />
                    <input className="form-input" placeholder="Image URL(s), separated by commas" value={roomForm.images} onChange={(e) => setRoomForm({ ...roomForm, images: e.target.value })} />
                    <input className="form-input" placeholder="Bathroom image URL (optional)" value={roomForm.bathroomImage} onChange={(e) => setRoomForm({ ...roomForm, bathroomImage: e.target.value })} />
                    <input className="form-input" placeholder="Amenities, separated by commas" value={roomForm.amenities} onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })} />
                    <label className="form-input" style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                      <span>Upload photos from this device</span>
                      <input type="file" accept="image/*" multiple onChange={(e) => setRoomFiles(Array.from(e.target.files || []))} />
                    </label>
                    {roomFiles.length > 0 && <small>{roomFiles.map((file) => file.name).join(', ')}</small>}
                    <textarea className="form-input" placeholder="Room description" required maxLength={1000} value={roomForm.description} onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })} />
                    <label className="flex items-center gap-sm"><input type="checkbox" checked={roomForm.featured} onChange={(e) => setRoomForm({ ...roomForm, featured: e.target.checked })} /> Feature on homepage</label>
                    </div>
                    {roomFormError && <p role="alert" className={styles.roomFormError}>{roomFormError}</p>}
                    <div className={styles.roomModalActions}>
                      <button className="btn btn-secondary" type="button" onClick={() => { resetRoomForm(); setShowRoomForm(false); }} disabled={savingRoom}>Cancel</button>
                      <button className="btn btn-primary" type="submit" disabled={savingRoom}>{savingRoom ? 'Saving…' : editingRoomId ? 'Update Room' : 'Save Room'}</button>
                    </div>
                  </form>
                </div>
              )}
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Room</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Rating</th>
                      <th>Homepage</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map(room => (
                      <tr key={room._id}>
                        <td>
                          <div className="flex items-center gap-sm">
                            <img src={getRoomImageSource(room)} alt={room.name} className="table-thumb" onError={(event) => handleRoomImageError(event, room)} />
                            <div>
                              <div className="font-medium">{room.name}</div>
                              <div className="text-muted">{room.roomNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td>{room.type}</td>
                        <td>{formatCurrency(room.price)} / night</td>
                        <td>
                          <span className={`badge ${room.isAvailable ? 'badge-available' : 'badge-booked'}`}>
                            {room.isAvailable ? 'Available' : 'Booked'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-sm">
                            <Star size={14} className="star-icon-filled" /> {room.rating}
                          </div>
                        </td>
                        <td><button type="button" className="btn btn-secondary" onClick={() => handleToggleFeatured(room)}>{room.featured ? 'Featured' : 'Feature'}</button></td>
                        <td>
                          <button type="button" className="btn-icon" onClick={() => handleEditRoom(room)} aria-label={`Edit ${room.name}`} title="Edit room">
                            <Pencil size={16} />
                          </button>
                          <button className="btn-icon" onClick={() => setConfirmation({ title: 'Delete this room?', description: `“${room.name}” will be removed from your room list.`, confirmLabel: 'Delete room', onConfirm: () => handleDeleteRoom(room._id) })} aria-label={`Delete ${room.name}`}>
                            <Trash2 size={16} className="text-danger" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="bookings-management">
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <h3>All Bookings</h3>
                <span className="text-muted">{allBookings.length} bookings</span>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Guest</th>
                      <th>Room</th>
                      <th>Dates</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBookings.map(b => (
                      <tr key={b._id}>
                        <td>{b.bookingId}</td>
                        <td>{b.user?.name || '-'}</td>
                        <td>{b.room?.name || '-'}</td>
                        <td>
                          {b.checkIn && new Date(b.checkIn).toLocaleDateString()} - 
                          {b.checkOut && new Date(b.checkOut).toLocaleDateString()}
                        </td>
                        <td>{formatCurrency(b.totalPrice)}</td>
                        <td>
                          <select className="form-input" value={b.status} onChange={(event) => handleUpdateBookingStatus(b._id, event.target.value)}>
                            {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-management">
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <h3>All Users</h3>
                <span className="text-muted">{users.length} users</span>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.phone}</td>
                        <td>
                          <span className={`badge badge-${u.role === 'admin' ? 'available' : 'pending'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <button className="btn-icon" onClick={() => setConfirmation({ title: 'Delete this user?', description: `The account for ${u.name} will be permanently removed.`, confirmLabel: 'Delete user', onConfirm: () => handleDeleteUser(u._id) })} aria-label={`Delete ${u.name}`}>
                            <Trash2 size={16} className="text-danger" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="payments-management">
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <h3>Payments</h3>
                <span className="text-muted">{payments.length} payments</span>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>Booking</th><th>Guest</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment._id}>
                        <td>{payment.booking?.bookingId || '—'}</td>
                        <td>{payment.user?.name || payment.user?.email || '—'}</td>
                        <td>{formatCurrency(payment.amount)}</td>
                        <td>{payment.paymentMethod}</td>
                        <td>{payment.status}</td>
                        <td>{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payments.length === 0 && <p className="text-muted">No payments have been recorded yet.</p>}
              </div>
            </div>
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

export default AdminDashboard;
