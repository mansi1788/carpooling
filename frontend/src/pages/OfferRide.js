import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import './OfferRide.css';

const OfferRide = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    date: '',
    time: '',
    seats: 1,
    price: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showNotification = (message, type) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to offer a ride');
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData._id) {
        setError('User data not found. Please log in again.');
        return;
      }

      await axios.post(
        `${config.API_URL}/api/rides`,
        {
          ...formData,
          driver: userData._id
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      showNotification('Ride offered successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error offering ride:', error.response?.data);
      setError(error.response?.data?.error || 'Failed to offer ride');
    }
  };

  return (
    <div className="offer-ride-container">
      {showPopup && (
        <div className={`popup ${popupType}`}>
          {popupMessage}
        </div>
      )}
      <form className="offer-ride-form" onSubmit={handleSubmit}>
        <h2>Offer a Ride</h2>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="origin">Origin</label>
          <input
            type="text"
            id="origin"
            name="origin"
            value={formData.origin}
            onChange={handleChange}
            required
            placeholder="Starting location"
          />
        </div>

        <div className="form-group">
          <label htmlFor="destination">Destination</label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            required
            placeholder="Ending location"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="time">Time</label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="seats">Available Seats</label>
            <input
              type="number"
              id="seats"
              name="seats"
              value={formData.seats}
              onChange={handleChange}
              required
              min="1"
              max="10"
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price per Seat ($)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add any additional details about your ride"
            rows="4"
          />
        </div>

        <button type="submit" className="submit-button">Offer Ride</button>
      </form>
    </div>
  );
};

export default OfferRide; 