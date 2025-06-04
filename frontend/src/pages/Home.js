import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import config from '../config';
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
  const [loadingTime, setLoadingTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5;
  const INITIAL_RETRY_DELAY = 5000; // 5 seconds

  const showNotification = (message, type) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  const checkServerHealth = async () => {
    try {
      await axios.get(`${config.API_URL}/api/health`, {
        timeout: 5000 // 5 second timeout for health check
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const loadData = async (isRetry = false) => {
    let timer;
    try {
      if (!isRetry) {
        setLoading(true);
        setLoadingTime(0);
        setError('');
      }

      // Start loading timer
      timer = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);

      // Check server health first
      const isHealthy = await checkServerHealth();
      if (!isHealthy) {
        throw new Error('SERVER_NOT_READY');
      }

      // Load featured rides with timeout
      const ridesResponse = await axios.get(`${config.API_URL}/api/rides/featured`, {
        timeout: 30000 // 30 second timeout
      });
      setFeaturedRides(ridesResponse.data || []);

      // Load stats with timeout if user is logged in
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const statsResponse = await axios.get(`${config.API_URL}/api/rides/stats`, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 30000 // 30 second timeout
          });
          setStats(statsResponse.data);
        } catch (statsError) {
          console.error('Error loading stats:', statsError);
          // Don't set error state for stats failure
        }
      }

      clearInterval(timer);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error loading data:', error);
      if (timer) {
        clearInterval(timer);
      }
      
      if ((error.code === 'ECONNABORTED' || error.message === 'SERVER_NOT_READY') && retryCount < MAX_RETRIES) {
        // Increment retry count
        setRetryCount(prev => prev + 1);
        // Calculate exponential backoff delay
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        // Wait before retrying
        setTimeout(() => {
          loadData(true);
        }, delay);
      } else if (error.code === 'ECONNABORTED' || error.message === 'SERVER_NOT_READY') {
        setError('Server is still starting up. Please try again in a few minutes.');
      } else {
        setError('Failed to load data. Please try again later.');
      }
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRetry = () => {
    setRetryCount(0);
    loadData();
  };

  const handleJoinRide = async (rideId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Please login to join a ride', 'error');
      navigate('/login');
      return;
    }

    try {
      await axios.post(`${config.API_URL}/api/rides/${rideId}/join`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 30000 // 30 second timeout
      });
      showNotification('Successfully joined the ride!', 'success');
      // Refresh the featured rides
      const ridesResponse = await axios.get(`${config.API_URL}/api/rides/featured`, {
        timeout: 30000 // 30 second timeout
      });
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
        {loadingTime > 10 && (
          <p className="loading-warning">
            This is taking longer than usual. The server might be starting up.
            Please wait a moment...
          </p>
        )}
        {loadingTime > 30 && (
          <p className="loading-error">
            Still loading... You might want to try refreshing the page.
          </p>
        )}
        {retryCount > 0 && (
          <p className="loading-warning">
            Attempt {retryCount} of {MAX_RETRIES} to connect to the server...
            <br />
            Next retry in {INITIAL_RETRY_DELAY * Math.pow(2, retryCount) / 1000} seconds
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={handleRetry}>Retry</button>
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
            <p>{stats?.totalRides || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Active Rides</h3>
            <p>{stats?.activeRides || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Completed Rides</h3>
            <p>{stats?.completedRides || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p>${(stats?.totalRevenue || 0).toFixed(2)}</p>
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