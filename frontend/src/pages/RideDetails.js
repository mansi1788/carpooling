import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
        const response = await axios.get(`http://localhost:5000/api/rides/${id}`);
        setRide(response.data);
      } catch (error) {
        console.error('Error fetching ride details:', error);
        setError('Failed to load ride details. Please try again later.');
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
      await axios.post(`http://localhost:5000/api/rides/${id}/join`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      showNotification('Successfully joined the ride!', 'success');
      // Refresh ride details
      const response = await axios.get(`http://localhost:5000/api/rides/${id}`);
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
    <div className="ride-details-page">
      {showPopup && (
        <div className={`popup ${popupType}`}>
          {popupMessage}
        </div>
      )}

      <div className="ride-details-container">
        <div className="ride-header">
          <h1>Ride Details</h1>
          <div className="price-tag">${ride.price}</div>
        </div>

        <div className="ride-info-grid">
          <div className="info-card">
            <h3>Route</h3>
            <div className="route-info">
              <div className="location">
                <span className="label">From:</span>
                <span className="value">{ride.origin}</span>
              </div>
              <div className="location">
                <span className="label">To:</span>
                <span className="value">{ride.destination}</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3>Schedule</h3>
            <div className="schedule-info">
              <div className="schedule-item">
                <span className="label">Date:</span>
                <span className="value">{new Date(ride.date).toLocaleDateString()}</span>
              </div>
              <div className="schedule-item">
                <span className="label">Time:</span>
                <span className="value">{ride.time}</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3>Driver Information</h3>
            <div className="driver-info">
              <div className="driver-item">
                <span className="label">Name:</span>
                <span className="value">{ride.driver?.name || 'Unknown'}</span>
              </div>
              <div className="driver-item">
                <span className="label">Rating:</span>
                <span className="value">{ride.driver?.rating || 'Not rated'}</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3>Ride Information</h3>
            <div className="ride-info">
              <div className="ride-item">
                <span className="label">Available Seats:</span>
                <span className="value">{ride.seats}</span>
              </div>
              <div className="ride-item">
                <span className="label">Status:</span>
                <span className="value">{ride.status}</span>
              </div>
            </div>
          </div>
        </div>

        {ride.description && (
          <div className="description-card">
            <h3>Description</h3>
            <p>{ride.description}</p>
          </div>
        )}

        <div className="action-buttons">
          <button 
            className="join-button"
            onClick={handleJoinRide}
            disabled={ride.seats === 0}
          >
            {ride.seats === 0 ? 'No Seats Available' : 'Join Ride'}
          </button>
          <button 
            className="back-button"
            onClick={() => navigate('/rides')}
          >
            Back to Rides
          </button>
        </div>
      </div>
    </div>
  );
};

export default RideDetails; 