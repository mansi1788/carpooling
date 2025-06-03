import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [featuredRides, setFeaturedRides] = useState([]);
  const [stats, setStats] = useState({
    totalRides: 0,
    activeRides: 0,
    completedRides: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');

  const showNotification = (message, type) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        // Load featured rides
        const ridesResponse = await axios.get('http://localhost:5000/api/rides/featured');
        setFeaturedRides(ridesResponse.data || []);

        // Load stats
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const statsResponse = await axios.get('http://localhost:5000/api/rides/stats', {
              headers: { 'x-auth-token': token }
            });
            setStats(statsResponse.data);
          } catch (statsError) {
            console.error('Error loading stats:', statsError);
            // Don't set error state for stats failure
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleJoinRide = async (rideId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Please login to join a ride', 'error');
      navigate('/login');
      return;
    }

    try {
      await axios.post(`http://localhost:5000/api/rides/${rideId}/join`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      showNotification('Successfully joined the ride!', 'success');
      // Refresh the featured rides
      const ridesResponse = await axios.get('http://localhost:5000/api/rides/featured');
      setFeaturedRides(ridesResponse.data || []);
    } catch (error) {
      console.error('Error joining ride:', error);
      showNotification(error.response?.data?.error || 'Failed to join ride', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="home">
      {showPopup && (
        <div className={`popup ${popupType}`}>
          {popupMessage}
        </div>
      )}
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to RideShare</h1>
          <p>Find your perfect ride or share your journey with others</p>
          <Link to="/rides" className="cta-button">Find a Ride</Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <h3>Total Rides</h3>
            <p>{stats.totalRides}</p>
          </div>
          <div className="stat-card">
            <h3>Active Rides</h3>
            <p>{stats.activeRides}</p>
          </div>
          <div className="stat-card">
            <h3>Completed Rides</h3>
            <p>{stats.completedRides}</p>
          </div>
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p>${stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      </section>

      {/* Featured Rides */}
      <section className="featured-rides">
        <h2>Featured Rides</h2>
        {featuredRides.length > 0 ? (
          <div className="rides-grid">
            {featuredRides.map(ride => (
              <div key={ride._id} className="ride-card">
                <div className="ride-header">
                  <h3>{ride.origin} → {ride.destination}</h3>
                  <span className="price">${ride.price}</span>
                </div>
                <div className="ride-details">
                  <p><strong>Date:</strong> {new Date(ride.date).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {ride.time}</p>
                  <p><strong>Seats:</strong> {ride.seats}</p>
                  <p><strong>Driver:</strong> {ride.driver?.name || 'Unknown'}</p>
                </div>
                <div className="ride-actions">
                  <Link to={`/rides/${ride._id}`} className="view-ride-button">View Details</Link>
                  <button 
                    className="join-ride-button"
                    onClick={() => handleJoinRide(ride._id)}
                    disabled={ride.seats === 0}
                  >
                    {ride.seats === 0 ? 'No Seats Available' : 'Join Ride'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-rides">
            <p>No featured rides available at the moment.</p>
            <Link to="/rides/offer" className="cta-button">Offer a Ride</Link>
          </div>
        )}
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Your Journey?</h2>
          <p>Join our community of riders and drivers today</p>
          <div className="cta-buttons">
            <Link to="/rides" className="cta-button">Find a Ride</Link>
            <Link to="/rides/offer" className="cta-button secondary">Offer a Ride</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 