import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './FindRides.css';

const FindRides = () => {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');
  const [userData, setUserData] = useState(null);
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    date: '',
    priceRange: { min: '', max: '' },
    seats: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const showNotification = (message, type) => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/rides', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Only filter out rides if we have user data
      const filteredRides = userData 
        ? response.data.filter(ride => ride.driver?._id !== userData._id)
        : response.data;
        
      setRides(filteredRides);
      setFilteredRides(filteredRides);
    } catch (error) {
      console.error('Error loading rides:', error);
      setError('Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePriceRangeChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [name]: value
      }
    }));
  };

  const applyFilters = () => {
    let filtered = [...rides];

    if (filters.origin) {
      filtered = filtered.filter(ride => 
        ride.origin.toLowerCase().includes(filters.origin.toLowerCase())
      );
    }

    if (filters.destination) {
      filtered = filtered.filter(ride => 
        ride.destination.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }

    if (filters.date) {
      filtered = filtered.filter(ride => 
        ride.date.startsWith(filters.date)
      );
    }

    if (filters.priceRange.min) {
      filtered = filtered.filter(ride => 
        ride.price >= parseFloat(filters.priceRange.min)
      );
    }

    if (filters.priceRange.max) {
      filtered = filtered.filter(ride => 
        ride.price <= parseFloat(filters.priceRange.max)
      );
    }

    if (filters.seats) {
      filtered = filtered.filter(ride => 
        ride.seats >= parseInt(filters.seats)
      );
    }

    setFilteredRides(filtered);
  };

  const handleJoinRide = async (rideId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Please login to join a ride', 'error');
        return;
      }

      if (!userData || !userData._id) {
        showNotification('User data not loaded. Please try again.', 'error');
        return;
      }

      // Find the ride object
      const rideToJoin = rides.find(r => r._id === rideId);
      if (!rideToJoin) {
        showNotification('Ride not found', 'error');
        return;
      }

      if (!rideToJoin.driver || !rideToJoin.driver._id) {
        showNotification('Driver information not available', 'error');
        return;
      }

      // First create a chat with the driver
      const chatResponse = await axios.post('http://localhost:5000/api/chats/start', {
        participants: [userData._id, rideToJoin.driver._id]
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Then send a message
      await axios.post('http://localhost:5000/api/messages', {
        chat: chatResponse.data._id,
        sender: userData._id,
        content: `Hi! I'm interested in joining your ride from ${rideToJoin.origin} to ${rideToJoin.destination} on ${new Date(rideToJoin.date).toLocaleDateString()}.`
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Finally join the ride
      await axios.post(`http://localhost:5000/api/rides/${rideId}/join`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      showNotification('You have joined the ride! A message has been sent to the driver.', 'success');
      loadRides(); // Refresh the rides list
    } catch (error) {
      console.error('Error joining ride:', error);
      showNotification(error.response?.data?.error || 'Failed to join ride', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading rides...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={loadRides}>Retry</button>
      </div>
    );
  }

  return (
    <div className="find-rides-container">
      {showPopup && (
        <div className={`popup ${popupType}`}>
          {popupMessage}
        </div>
      )}
      <div className="search-filters">
        <button 
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <input
                type="text"
                name="origin"
                placeholder="From"
                value={filters.origin}
                onChange={handleFilterChange}
              />
              <input
                type="text"
                name="destination"
                placeholder="To"
                value={filters.destination}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <input
                type="date"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                min={new Date().toISOString().split('T')[0]}
              />
              <input
                type="number"
                name="seats"
                placeholder="Min Seats"
                value={filters.seats}
                onChange={handleFilterChange}
                min="1"
              />
            </div>

            <div className="filter-group">
              <input
                type="number"
                name="min"
                placeholder="Min Price"
                value={filters.priceRange.min}
                onChange={handlePriceRangeChange}
                min="0"
              />
              <input
                type="number"
                name="max"
                placeholder="Max Price"
                value={filters.priceRange.max}
                onChange={handlePriceRangeChange}
                min="0"
              />
            </div>

            <button className="apply-filters" onClick={applyFilters}>
              Apply Filters
            </button>
          </div>
        )}
      </div>

      <div className="rides-grid">
        {filteredRides.length > 0 ? (
          filteredRides.map(ride => (
            <div key={ride._id} className="ride-card">
              <div className="ride-header">
                <h3>{ride.origin} → {ride.destination}</h3>
                <span className="price">${ride.price}</span>
              </div>
              <div className="ride-details">
                <p><strong>Date:</strong> {new Date(ride.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {ride.time}</p>
                <p><strong>Available Seats:</strong> {ride.seats}</p>
                <p><strong>Driver:</strong> {ride.driver?.name || 'Unknown'}</p>
                {ride.description && (
                  <p><strong>Description:</strong> {ride.description}</p>
                )}
              </div>
              <button 
                className="join-ride-button"
                onClick={() => handleJoinRide(ride._id)}
                disabled={ride.seats === 0}
              >
                {ride.seats === 0 ? 'No Seats Available' : 'Join Ride'}
              </button>
            </div>
          ))
        ) : (
          <div className="no-rides">
            <p>No rides found matching your criteria.</p>
            <button onClick={() => {
              setFilters({
                origin: '',
                destination: '',
                date: '',
                priceRange: { min: '', max: '' },
                seats: ''
              });
              setFilteredRides(rides);
            }}>
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindRides; 