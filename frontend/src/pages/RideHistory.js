import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RideHistory.css';

const RideHistory = () => {
  const [completedRides, setCompletedRides] = useState([]);
  const [rating, setRating] = useState({});
  const [comment, setComment] = useState({});
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    loadRideHistory();
  }, []);

  const loadRideHistory = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/rides/history/${userId}`);
      setCompletedRides(response.data);
    } catch (error) {
      console.error('Failed to load ride history:', error);
    }
  };

  const handleRating = async (rideId, value) => {
    try {
      await axios.post(`http://localhost:5000/api/rides/${rideId}/rate`, {
        rating: value,
        userId: userId
      });
      setRating(prev => ({ ...prev, [rideId]: value }));
    } catch (error) {
      console.error('Failed to submit rating:', error);
    }
  };

  const handleComment = async (rideId) => {
    if (!comment[rideId]) return;
    try {
      await axios.post(`http://localhost:5000/api/rides/${rideId}/comment`, {
        comment: comment[rideId],
        userId: userId
      });
      setComment(prev => ({ ...prev, [rideId]: '' }));
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  return (
    <div className="ride-history-container">
      <h2 className="page-title">Ride History</h2>
      <div className="rides-grid">
        {completedRides.map(ride => (
          <div key={ride._id} className="ride-history-card">
            <div className="ride-info">
              <h3>Ride Details</h3>
              <p><strong>From:</strong> {ride.origin}</p>
              <p><strong>To:</strong> {ride.destination}</p>
              <p><strong>Date:</strong> {new Date(ride.date).toLocaleString()}</p>
              <p><strong>Driver:</strong> {ride.driver?.name}</p>
              <p><strong>Status:</strong> <span className={`status-${ride.status}`}>{ride.status}</span></p>
            </div>
            
            <div className="rating-section">
              <h4>Rate this ride</h4>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    className={`star ${rating[ride._id] >= star ? 'active' : ''}`}
                    onClick={() => handleRating(ride._id, star)}
                  >
                    ★
                  </button>
                ))}
              </div>
              
              <div className="comment-section">
                <textarea
                  value={comment[ride._id] || ''}
                  onChange={(e) => setComment(prev => ({ ...prev, [ride._id]: e.target.value }))}
                  placeholder="Leave a comment about your ride..."
                  rows={3}
                />
                <button 
                  className="btn btn-primary"
                  onClick={() => handleComment(ride._id)}
                  disabled={!comment[ride._id]}
                >
                  Submit Comment
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RideHistory; 