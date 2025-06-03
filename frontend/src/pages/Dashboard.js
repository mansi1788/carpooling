import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [offeredRides, setOfferedRides] = useState([]);
  const [joinedRides, setJoinedRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const userId = localStorage.getItem('userId'); // This should be set on login/signup

  useEffect(() => {
    if (userId) {
      loadMyRides();
    }
  }, [userId]);

  const loadMyRides = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rides');
      setOfferedRides(response.data.filter(ride => ride.driver?._id === userId));
      setJoinedRides(response.data.filter(ride => ride.passengers?.includes(userId)));
    } catch (error) {
      console.error('Failed to load my rides:', error);
    }
  };

  const openModal = (ride) => {
    setSelectedRide(ride);
    setShowModal(true);
    setMessage('');
    setMessageSent(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRide(null);
    setMessage('');
    setMessageSent(false);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedRide) return;
    try {
      await axios.post('http://localhost:5000/api/messages', {
        sender: userId,
        receiver: selectedRide.driver._id,
        content: message
      });
      setMessageSent(true);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Your Dashboard</h2>
      <div className="my-rides-section">
        <h3>Rides You've Offered</h3>
        {offeredRides.length === 0 ? (
          <p className="no-rides">You haven't offered any rides yet.</p>
        ) : (
          <div className="rides-grid">
            {offeredRides.map(ride => (
              <div key={ride._id} className="ride-card" onClick={() => openModal(ride)} style={{ cursor: 'pointer' }}>
                <div className="ride-info">
                  <p><strong>From:</strong> {ride.origin}</p>
                  <p><strong>To:</strong> {ride.destination}</p>
                  <p><strong>Date:</strong> {new Date(ride.date).toLocaleString()}</p>
                  <p><strong>Seats:</strong> {ride.seats}</p>
                  <p><strong>Price:</strong> ${ride.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="my-rides-section">
        <h3>Rides You've Joined</h3>
        {joinedRides.length === 0 ? (
          <p className="no-rides">You haven't joined any rides yet.</p>
        ) : (
          <div className="rides-grid">
            {joinedRides.map(ride => (
              <div key={ride._id} className="ride-card" onClick={() => openModal(ride)} style={{ cursor: 'pointer' }}>
                <div className="ride-info">
                  <p><strong>From:</strong> {ride.origin}</p>
                  <p><strong>To:</strong> {ride.destination}</p>
                  <p><strong>Date:</strong> {new Date(ride.date).toLocaleString()}</p>
                  <p><strong>Seats:</strong> {ride.seats}</p>
                  <p><strong>Price:</strong> ${ride.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showModal && selectedRide && (
        <div className="ride-modal-overlay" onClick={closeModal}>
          <div className="ride-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={closeModal}>&times;</button>
            <h3>Ride Details</h3>
            <div className="ride-info-modal">
              <p><strong>From:</strong> {selectedRide.origin}</p>
              <p><strong>To:</strong> {selectedRide.destination}</p>
              <p><strong>Date:</strong> {new Date(selectedRide.date).toLocaleString()}</p>
              <p><strong>Seats:</strong> {selectedRide.seats}</p>
              <p><strong>Price:</strong> ${selectedRide.price}</p>
              <p><strong>Driver:</strong> {selectedRide.driver?.name} ({selectedRide.driver?.email})</p>
            </div>
            <div className="contact-driver">
              <h4>Contact Driver</h4>
              {messageSent ? (
                <p className="message-sent">Message sent!</p>
              ) : (
                <>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                  />
                  <button className="send-message-btn" onClick={handleSendMessage}>Send Message</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 