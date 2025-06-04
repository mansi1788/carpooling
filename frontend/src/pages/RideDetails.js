import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import './RideDetails.css';

const RideDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');
  const [loadingTime, setLoadingTime] = useState(0);

  const showNotification = (message, type) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        setLoading(true);
        setLoadingTime(0);
        console.log('Fetching ride details for ID:', id);
        console.log('API URL:', `${config.API_URL}/api/rides/${id}`);

        // Start loading timer
        const timer = setInterval(() => {
          setLoadingTime(prev => prev + 1);
        }, 1000);

        const response = await axios.get(`${config.API_URL}/api/rides/${id}`, {
          timeout: 30000 // 30 second timeout
        });
        console.log('Ride details response:', response.data);
        setRide(response.data);
        clearInterval(timer);
      } catch (error) {
        console.error('Error fetching ride details:', error);
        console.error('Error response:', error.response);
        if (error.code === 'ECONNABORTED') {
          setError('Request timed out. The server might be starting up. Please try again in a few seconds.');
        } else {
          setError('Failed to load ride details. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRideDetails();
  }, [id]);

  const handleJoinRide = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Please login to join a ride', 'error');
      navigate('/login');
      return;
    }

    try {
      await axios.post(`${config.API_URL}/api/rides/${id}/join`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      showNotification('Successfully joined the ride!', 'success');
      // Refresh ride details
      const response = await axios.get(`${config.API_URL}/api/rides/${id}`);
      setRide(response.data);
    } catch (error) {
      console.error('Error joining ride:', error);
      showNotification(error.response?.data?.error || 'Failed to join ride', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading ride details...</p>
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

  if (!ride) {
    return (
      <div className="error-container">
        <p className="error-message">Ride not found</p>
        <button onClick={() => navigate('/rides')}>Back to Rides</button>
      </div>
    );
  }

  return (
    <div className="ride-details-container">
      {showPopup && (
        <div className={`popup ${popupType}`}>
          {popupMessage}
        </div>
      )}

      <div className="ride-details-card">
        <div className="ride-header">
          <h2>{ride.origin} → {ride.destination}</h2>
          <span className="price">${ride.price}</span>
        </div>

        <div className="ride-info">
          <div className="info-group">
            <h3>Date & Time</h3>
            <p>{new Date(ride.date).toLocaleDateString()}</p>
            <p>{new Date(ride.date).toLocaleTimeString()}</p>
          </div>

          <div className="info-group">
            <h3>Driver</h3>
            <p>{ride.driver?.name || 'Unknown'}</p>
            {ride.driver?.rating && (
              <p className="rating">Rating: {ride.driver.rating.toFixed(1)} ⭐</p>
            )}
          </div>

          <div className="info-group">
            <h3>Seats</h3>
            <p>Available: {ride.seats - (ride.passengers?.length || 0)}</p>
            <p>Total: {ride.seats}</p>
          </div>

          {ride.description && (
            <div className="info-group">
              <h3>Description</h3>
              <p>{ride.description}</p>
            </div>
          )}
        </div>

        <div className="ride-actions">
          <button
            className="join-button"
            onClick={handleJoinRide}
            disabled={!ride.seats || ride.passengers?.length >= ride.seats}
          >
            {!ride.seats || ride.passengers?.length >= ride.seats ? 'No Seats Available' : 'Join Ride'}
          </button>
          <button className="back-button" onClick={() => navigate('/rides')}>
            Back to Rides
          </button>
        </div>
      </div>
    </div>
  );
};

export default RideDetails; 