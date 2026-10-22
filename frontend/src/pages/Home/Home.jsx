import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bed, Star, MapPin, Wifi, Tv, Coffee, Car, Shield, ChevronRight, Users, Calendar } from 'lucide-react';
import { roomAPI } from '../../services/api.js';
import { getRoomImageSource, handleRoomImageError } from '../../lib/roomImages.js';
import { formatCurrency } from '../../lib/currency.js';
import styles from './HomeStyles.module.css';

const Home = () => {
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomsError, setRoomsError] = useState('');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await roomAPI.getAll({ sort: 'rating' });
        const rooms = data.rooms || [];
        const availableRooms = rooms.filter((room) => room.isAvailable !== false);
        const preferredRooms = availableRooms.filter((room) => room.featured);
        const remainingRooms = availableRooms.filter((room) => !room.featured);
        setFeaturedRooms([...preferredRooms, ...remainingRooms].slice(0, 3));
      } catch (err) {
        console.error(err);
        setRoomsError('Featured rooms are temporarily unavailable. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const amenities = [
    { icon: Wifi, label: 'Free WiFi' },
    { icon: Tv, label: 'Smart TV' },
    { icon: Coffee, label: 'Breakfast' },
    { icon: Car, label: 'Parking' },
    { icon: Shield, label: '24/7 Security' },
    { icon: Users, label: 'Conference' }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      text: 'Absolutely stunning guest house. The Royal Suite exceeded all expectations. Will definitely return!',
      rating: 5
    },
    {
      name: 'Michael Chen',
      text: 'Perfect location, impeccable service, and beautiful rooms. The 3D room preview feature is amazing.',
      rating: 5
    },
    {
      name: 'Emily Davis',
      text: 'Our family had an incredible stay. The Family Suite was perfect for our kids. Highly recommended!',
      rating: 4
    }
  ];

  return (
    <div className={`home-page ${styles.root}`}>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <img src="/room-royal-1.jpg" alt="Luxury Room" className="hero-img" />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="hero-title">Welcome to New Regent</h1>
            <p className="hero-subtitle">
              Experience luxury redefined. Book your perfect stay with world-class amenities and breathtaking views.
            </p>
            <div className="hero-actions flex items-center gap-md" style={{ marginTop: '2rem' }}>
              <Link to="/rooms" className="btn btn-primary">
                <Bed size={20} /> Explore Rooms
              </Link>
              <Link to="/register" className="btn btn-secondary">
                <Users size={20} /> Join Now
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats section-padding">
        <div className="container">
          <div className="stats-grid flex items-center justify-around">
            {[
              { number: '50+', label: 'Luxury Rooms' },
              { number: '10K+', label: 'Happy Guests' },
              { number: '4.9', label: 'Average Rating' },
              { number: '24/7', label: 'Support' }
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="stat-item text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <h3 className="stat-number">{stat.number}</h3>
                <p className="stat-label">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="featured-rooms section-padding" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="text-center">
            <h2 className="section-title">Featured Rooms</h2>
            <p className="section-subtitle">Handpicked accommodations for an unforgettable experience</p>
          </div>
          
          <div className="rooms-list flex flex-wrap" style={{ marginTop: '2rem', gap: '1.5rem' }}>
            {roomsError ? (
              <p role="alert" style={{ width: '100%', textAlign: 'center', color: 'var(--text-secondary)' }}>{roomsError}</p>
            ) : loading ? (
              <div className="flex items-center justify-center w-full" style={{ padding: '3rem' }}>
                <div className="loading-spinner"></div>
              </div>
            ) : featuredRooms.length === 0 ? (
              <p style={{ width: '100%', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No rooms are available right now. Please check back soon.
              </p>
            ) : (
              featuredRooms.slice(0, 3).map((room, i) => (
                <motion.div
                  key={room._id}
                  className="room-card-wrapper"
                  style={{ flex: '1 1 300px', maxWidth: '380px' }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div className="card room-card">
                    <div className="room-image">
                      <img src={getRoomImageSource(room)} alt={room.name} onError={(event) => handleRoomImageError(event, room)} />
                      <span className={`badge ${room.isAvailable && !room.isCurrentlyBooked ? 'badge-available' : 'badge-booked'}`}>
                        {!room.isAvailable ? 'Unavailable' : room.isCurrentlyBooked ? 'Occupied today' : 'Available'}
                      </span>
                    </div>
                    <div className="room-info" style={{ padding: '1.25rem' }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
                        <h3 className="room-name">{room.name}</h3>
                        <div className="flex items-center gap-sm">
                          <Star size={16} className="star-icon" />
                          <span>{room.rating}</span>
                        </div>
                      </div>
                      <p className="room-desc">{(room.description || '').substring(0, 80)}{room.description?.length > 80 ? '...' : ''}</p>
                      <div className="flex items-center justify-between" style={{ marginTop: '1rem' }}>
                        <div className="room-price">
                          <span className="price">{formatCurrency(room.price)}</span>
                          <span className="per-night">/night</span>
                        </div>
                        <Link to={`/rooms?room=${room._id}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                          View Details <ChevronRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          {!loading && !roomsError && featuredRooms.length > 0 && (
            <div className="text-center" style={{ marginTop: '2rem' }}>
              <Link to="/rooms" className="btn btn-secondary">View All Rooms <ChevronRight size={16} /></Link>
            </div>
          )}
        </div>
      </section>

      {/* Amenities */}
      <section className="amenities section-padding">
        <div className="container">
          <div className="text-center">
            <h2 className="section-title">Our Amenities</h2>
            <p className="section-subtitle">Everything you need for a comfortable stay</p>
          </div>
          <div className="amenities-grid flex flex-wrap" style={{ marginTop: '2rem', gap: '1.5rem' }}>
            {amenities.map((amenity, i) => (
              <motion.div
                key={i}
                className="amenity-card card text-center"
                style={{ flex: '1 1 150px', padding: '2rem' }}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <amenity.icon size={32} className="amenity-icon" />
                <p className="amenity-label">{amenity.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials section-padding" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="text-center">
            <h2 className="section-title">Guest Reviews</h2>
            <p className="section-subtitle">What our guests say about their stay</p>
          </div>
          <div className="testimonials-grid flex flex-wrap" style={{ marginTop: '2rem', gap: '1.5rem' }}>
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                className="testimonial-card card"
                style={{ flex: '1 1 300px', padding: '1.5rem' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="flex items-center" style={{ marginBottom: '1rem', gap: '0.25rem' }}>
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={16} className="star-icon-filled" />
                  ))}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <p className="testimonial-author">— {t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta section-padding">
        <div className="container">
          <motion.div
            className="cta-box card text-center"
            style={{ padding: '3rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="cta-title" style={{ color: '#fff', marginBottom: '1rem' }}>Ready to Book Your Stay?</h2>
            <p className="cta-subtitle" style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '1.5rem' }}>
              Join thousands of satisfied guests. Register now and get exclusive deals.
            </p>
            <Link to="/register" className="btn" style={{ background: '#fff', color: 'var(--primary)' }}>
              <Calendar size={18} /> Book Now
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
