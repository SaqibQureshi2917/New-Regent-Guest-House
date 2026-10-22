import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Star, Users, Bed, Wifi, Tv, Coffee, Bath, Check } from 'lucide-react';
import { roomAPI, bookingAPI, paymentAPI } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getRoomImageSource, handleRoomImageError } from '../../lib/roomImages.js';
import { formatCurrency } from '../../lib/currency.js';
import styles from './RoomModalStyles.module.css';
import { toast } from 'sonner';

const RoomModal = ({ room, onClose, onBook }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: { adults: 1, children: 0 },
    specialRequests: ''
  });
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [bookedNow, setBookedNow] = useState(Boolean(room.isCurrentlyBooked));
  const [availabilityError, setAvailabilityError] = useState(false);
  const { user } = useAuth();

  // Build the 3-image carousel: [roomImage1, roomImage2, bathroomImage]
  const carouselImages = [
    getRoomImageSource(room, 0),
    getRoomImageSource(room, 1),
    getRoomImageSource(room, 2)
  ];

  const imageLabels = ['Room View 1', 'Room View 2', 'Bathroom'];

  useEffect(() => {
    let active = true;
    setAvailabilityLoading(true);
    roomAPI.getUpcomingBookings(room._id)
      .then((data) => {
        if (!active) return;
        setUpcomingBookings(data.bookings || []);
        setBookedNow(Boolean(data.bookedNow));
      })
      .catch((error) => {
        console.error('Could not load room booking dates:', error);
        if (active) setAvailabilityError(true);
      })
      .finally(() => { if (active) setAvailabilityLoading(false); });
    return () => { active = false; };
  }, [room._id]);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % carouselImages.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.warning('Sign in to book a room.');
      return;
    }
    setLoading(true);
    try {
      const res = await bookingAPI.create({
        roomId: room._id,
        ...bookingData
      });
      setBooking(res.booking);
      setShowPaymentForm(true);
      setShowBookingForm(false);
      toast.success('Booking request created.', { description: 'Review the details and continue to payment.' });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Booking failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      await paymentAPI.create({ bookingId: booking._id });
      toast.success('Payment successful!', { description: 'Your booking is confirmed.' });
      onClose();
      if (onBook) onBook();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment failed.');
    } finally {
      setLoading(false);
    }
  };

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className={`modal-overlay ${styles.root}`} onClick={onClose}>
      <motion.div
        className="modal-content room-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        {/* 3-Image Carousel */}
        <div className="carousel-container">
          <div className="carousel-main">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImage}
                src={carouselImages[currentImage]}
                alt={imageLabels[currentImage]}
                onError={(event) => handleRoomImageError(event, room, currentImage)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
            
            <button className="carousel-btn prev" onClick={prevImage}>
              <ChevronLeft size={24} />
            </button>
            <button className="carousel-btn next" onClick={nextImage}>
              <ChevronRight size={24} />
            </button>
            
            <div className="carousel-indicators">
              {carouselImages.map((_, i) => (
                <button
                  key={i}
                  className={`indicator ${i === currentImage ? 'active' : ''}`}
                  onClick={() => setCurrentImage(i)}
                />
              ))}
            </div>
            
            <div className="carousel-label">{imageLabels[currentImage]}</div>
          </div>

          {/* Thumbnail strip */}
          <div className="carousel-thumbnails flex">
            {carouselImages.map((img, i) => (
              <button
                key={i}
                className={`thumbnail ${i === currentImage ? 'active' : ''}`}
                onClick={() => setCurrentImage(i)}
              >
                <img src={img} alt={imageLabels[i]} onError={(event) => handleRoomImageError(event, room, i)} />
                <span className="thumb-label">{imageLabels[i]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Room Details */}
        <div className="room-modal-details" style={{ padding: '1.5rem' }}>
          {!showBookingForm && !showPaymentForm ? (
            <>
              <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                <div>
                  <h2 className="room-modal-title">{room.name}</h2>
                  <p className="room-modal-number">Room {room.roomNumber} · {room.size}</p>
                </div>
                <div className="flex items-center gap-sm">
                  <Star size={20} className="star-icon-filled" />
                  <span className="room-rating">{room.rating}</span>
                  <span className="room-reviews">({room.reviewCount} reviews)</span>
                </div>
              </div>

              <p className="room-modal-desc">{room.description}</p>

              <section className={styles.availabilityPanel} aria-live="polite">
                <div className={styles.availabilityHeading}>
                  <h4>Availability</h4>
                  <span className={`${styles.availabilityBadge} ${bookedNow || room.isAvailable === false ? styles.unavailable : styles.available}`}>
                    {availabilityLoading ? 'Checking dates…' : room.isAvailable === false ? 'Unavailable' : availabilityError ? 'Check dates when booking' : bookedNow ? 'Occupied today' : 'Available today'}
                  </span>
                </div>
                <p className={styles.availabilityHint}>Upcoming reservations</p>
                {availabilityLoading ? (
                  <p className={styles.availabilityEmpty}>Loading reservation dates…</p>
                ) : availabilityError ? (
                  <p className={styles.availabilityEmpty}>Could not load reservation dates. Your selected dates will be checked when you book.</p>
                ) : upcomingBookings.length ? (
                  <ul className={styles.reservationList}>
                    {upcomingBookings.map((reservation) => (
                      <li key={reservation._id}>
                        <span>{new Date(reservation.checkIn).toLocaleDateString()} – {new Date(reservation.checkOut).toLocaleDateString()}</span>
                        <span className={styles.reservationStatus}>{reservation.status}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.availabilityEmpty}>No upcoming reservations.</p>
                )}
              </section>

              <div className="room-info-grid flex flex-wrap" style={{ gap: '1rem', marginTop: '1rem' }}>
                <div className="info-item flex items-center gap-sm">
                  <Bed size={18} /> <span>{room.bedType}</span>
                </div>
                <div className="info-item flex items-center gap-sm">
                  <Users size={18} /> <span>Up to {room.capacity} guests</span>
                </div>
                <div className="info-item flex items-center gap-sm">
                  <Bath size={18} /> <span>Private Bathroom</span>
                </div>
                <div className="info-item flex items-center gap-sm">
                  <Wifi size={18} /> <span>Free WiFi</span>
                </div>
                <div className="info-item flex items-center gap-sm">
                  <Tv size={18} /> <span>Smart TV</span>
                </div>
                <div className="info-item flex items-center gap-sm">
                  <Coffee size={18} /> <span>Mini Bar</span>
                </div>
              </div>

              <div className="amenities-list" style={{ marginTop: '1rem' }}>
                <h4>Room Amenities</h4>
                <div className="flex flex-wrap" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
                  {room.amenities.map((amenity, i) => (
                    <span key={i} className="amenity-tag flex items-center gap-sm">
                      <Check size={14} /> {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="room-modal-footer flex items-center justify-between" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <div className="room-price-large">
                  <span className="price">{formatCurrency(room.price)}</span>
                  <span className="per-night">/night</span>
                </div>
                <button className="btn btn-primary" onClick={() => setShowBookingForm(true)} disabled={room.isAvailable === false}>
                  {room.isAvailable === false ? 'Unavailable' : 'Book Now'}
                </button>
              </div>
            </>
          ) : showPaymentForm ? (
            <div className="payment-section">
              <h3>Complete Payment</h3>
              <div className="booking-summary card" style={{ padding: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
                <p><strong>Booking ID:</strong> {booking?.bookingId}</p>
                <p><strong>Room:</strong> {room.name}</p>
                <p><strong>Check-in:</strong> {booking?.checkIn && new Date(booking.checkIn).toLocaleDateString()}</p>
                <p><strong>Check-out:</strong> {booking?.checkOut && new Date(booking.checkOut).toLocaleDateString()}</p>
                <p><strong>Nights:</strong> {booking?.nights}</p>
                <p><strong>Guests:</strong> {booking?.guests?.adults} adults, {booking?.guests?.children} children</p>
                <div className="flex items-center justify-between" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  <strong>Total:</strong>
                  <strong className="price">{formatCurrency(booking?.totalPrice)}</strong>
                </div>
              </div>
              <div className="payment-methods" style={{ marginBottom: '1rem' }}>
                <p style={{ marginBottom: '0.5rem' }}>Payment Method:</p>
                <div className="flex items-center gap-sm">
                  <span className="payment-badge active">Credit Card (Mock)</span>
                </div>
              </div>
              <button className="btn btn-success w-full" onClick={handlePayment} disabled={loading}>
                {loading ? 'Processing...' : `Pay ${formatCurrency(booking?.totalPrice)}`}
              </button>
            </div>
          ) : (
            <form onSubmit={handleBooking}>
              <h3>Book Your Stay</h3>
              <div className="form-row flex flex-wrap" style={{ gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group" style={{ flex: '1 1 200px' }}>
                  <label className="form-label">Check-in Date</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingData.checkIn}
                    onChange={(e) => setBookingData({ ...bookingData, checkIn: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: '1 1 200px' }}>
                  <label className="form-label">Check-out Date</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                    value={bookingData.checkOut}
                    onChange={(e) => setBookingData({ ...bookingData, checkOut: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row flex flex-wrap" style={{ gap: '1rem', marginTop: '1rem' }}>
                <div className="form-group" style={{ flex: '1 1 200px' }}>
                  <label className="form-label">Adults</label>
                  <select
                    className="form-input"
                    value={bookingData.guests.adults}
                    onChange={(e) => setBookingData({ ...bookingData, guests: { ...bookingData.guests, adults: Number(e.target.value) } })}
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: '1 1 200px' }}>
                  <label className="form-label">Children</label>
                  <select
                    className="form-input"
                    value={bookingData.guests.children}
                    onChange={(e) => setBookingData({ ...bookingData, guests: { ...bookingData.guests, children: Number(e.target.value) } })}
                  >
                    {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Child{n > 1 ? 'ren' : ''}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Special Requests</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Any special requests..."
                  value={bookingData.specialRequests}
                  onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-md" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookingForm(false)}>Back</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RoomModal;
