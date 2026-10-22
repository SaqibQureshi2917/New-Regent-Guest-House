import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, Search, Star, Bed, ChevronDown } from 'lucide-react';
import { roomAPI } from '../../services/api.js';
import RoomModal from '../../components/RoomModal/RoomModal.jsx';
import { getRoomImageSource, handleRoomImageError } from '../../lib/roomImages.js';
import { formatCurrency } from '../../lib/currency.js';
import styles from './RoomsStyles.module.css';

const Rooms = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    minPrice: '',
    maxPrice: '',
    sort: 'price-asc'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const roomId = searchParams.get('room');
    if (roomId) {
      const fetchRoom = async () => {
        try {
          const data = await roomAPI.getById(roomId);
          if (data.room) setSelectedRoom(data.room);
        } catch (err) {
          console.error(err);
          setLoadError('Room details could not be loaded. Check your connection and try again.');
        }
      };
      fetchRoom();
    }
  }, [searchParams]);

  useEffect(() => {
    fetchRooms();
  }, [filters]);

  const fetchRooms = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await roomAPI.getAll(filters);
      setRooms(data.rooms || []);
    } catch (err) {
      console.error(err);
      setLoadError('Rooms could not be loaded. Check that the API and database are available, then try again.');
    } finally {
      setLoading(false);
    }
  };

  const roomTypes = [
    { value: '', label: 'All Types' },
    { value: 'standard', label: 'Standard' },
    { value: 'deluxe', label: 'Deluxe' },
    { value: 'suite', label: 'Suite' },
    { value: 'presidential', label: 'Presidential' }
  ];

  const sortOptions = [
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' }
  ];

  return (
    <div className={`rooms-page ${styles.root}`}>
      <section className="page-header section-padding" style={{ background: 'var(--bg-secondary)', padding: '3rem 0' }}>
        <div className="container text-center">
          <motion.h1 className="section-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Our Rooms</motion.h1>
          <motion.p className="section-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            Find the perfect accommodation for your stay
          </motion.p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container">
          {/* Filters */}
          <div className="filters-bar">
            <button className="filter-toggle btn btn-secondary" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={18} /> Filters <ChevronDown size={16} />
            </button>
            
            <div className="sort-select">
              <select 
                className="form-input"
                value={filters.sort} 
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              >
                {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          {showFilters && (
            <motion.div className="filters-panel card" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <div className="filters-content flex flex-wrap" style={{ gap: '1rem', padding: '1rem' }}>
                <div className="form-group" style={{ flex: '1 1 200px' }}>
                  <label className="form-label">Room Type</label>
                  <select 
                    className="form-input"
                    value={filters.type} 
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  >
                    {roomTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: '1 1 200px' }}>
                  <label className="form-label">Minimum price (PKR)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    placeholder="0" 
                    value={filters.minPrice} 
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: '1 1 200px' }}>
                  <label className="form-label">Maximum price (PKR)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    placeholder="1000" 
                    value={filters.maxPrice} 
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Room Count */}
          <div className="results-count" style={{ margin: '1rem 0' }}>
            <p>{rooms.length} room{rooms.length !== 1 ? 's' : ''} found</p>
          </div>

          {/* Room Cards */}
          {loading ? (
            <div className="flex items-center justify-center" style={{ padding: '4rem' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : loadError ? (
            <div role="alert" className="empty-state card text-center" style={{ padding: '2rem' }}>
              <p>{loadError}</p>
              <button type="button" className="btn btn-secondary" onClick={fetchRooms}>Try again</button>
            </div>
          ) : rooms.length === 0 ? (
            <div className="empty-state card text-center" style={{ padding: '2rem' }}>
              <h3>No rooms are listed yet</h3>
              <p>Please check back soon.</p>
            </div>
          ) : (
            <div className="rooms-grid flex flex-wrap" style={{ gap: '1.5rem' }}>
              {rooms.map((room, i) => (
                <motion.div
                  key={room._id}
                  className="room-card-wrapper"
                  style={{ flex: '1 1 300px', maxWidth: '380px' }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="card room-card" onClick={() => setSelectedRoom(room)}>
                    <div className="room-image">
                      <img src={getRoomImageSource(room)} alt={room.name} onError={(event) => handleRoomImageError(event, room)} />
                      <span className={`badge ${room.isAvailable && !room.isCurrentlyBooked ? 'badge-available' : 'badge-booked'}`}>
                        {!room.isAvailable ? 'Unavailable' : room.isCurrentlyBooked ? 'Occupied today' : 'Available'}
                      </span>
                      {room.featured && <span className="badge badge-featured">Featured</span>}
                    </div>
                    <div className="room-info" style={{ padding: '1.25rem' }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                        <h3 className="room-name">{room.name}</h3>
                        <div className="flex items-center gap-sm">
                          <Star size={16} className="star-icon" />
                          <span>{room.rating}</span>
                        </div>
                      </div>
                      <p className="room-meta flex items-center gap-sm" style={{ marginBottom: '0.5rem' }}>
                        <Bed size={14} /> {room.bedType} · <span>{room.size}</span>
                      </p>
                      <p className="room-desc">{room.description.substring(0, 100)}...</p>
                      <div className="room-amenities-preview flex flex-wrap" style={{ gap: '0.5rem', marginTop: '0.75rem' }}>
                        {room.amenities.slice(0, 3).map((a, j) => (
                          <span key={j} className="amenity-pill">{a}</span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span className="amenity-pill">+{room.amenities.length - 3}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        <div className="room-price">
                          <span className="price">{formatCurrency(room.price)}</span>
                          <span className="per-night">/night</span>
                        </div>
                        <span className="view-details">Click to view details</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Room Modal */}
      {selectedRoom && (
        <RoomModal room={selectedRoom} onClose={() => setSelectedRoom(null)} />
      )}
    </div>
  );
};

export default Rooms;
