import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PoolMain.css';

const PoolMain = () => {
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [newRide, setNewRide] = useState({
    origin: '',
    destination: '',
    date: '',
    time: '',
    seats: 1,
    price: '',
    description: ''
  });
  const [filters, setFilters] = useState({
    origin: '',
    destination: '',
    date: '',
    priceRange: { min: '', max: '' },
    seats: '',
    sortBy: 'date'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/rides');
      setRides(response.data);
      setFilteredRides(response.data);
    } catch (error) {
      console.error('Error loading rides:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRide(prev => ({
      ...prev,
      [name]: value
    }));
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

    // Apply text filters
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
        ride.date === filters.date
      );
    }

    // Apply price range filter
    if (filters.priceRange.min) {
      filtered = filtered.filter(ride => 
        ride.price >= Number(filters.priceRange.min)
      );
    }
    if (filters.priceRange.max) {
      filtered = filtered.filter(ride => 
        ride.price <= Number(filters.priceRange.max)
      );
    }

    // Apply seats filter
    if (filters.seats) {
      filtered = filtered.filter(ride => 
        ride.seats >= Number(filters.seats)
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'seats':
        filtered.sort((a, b) => b.seats - a.seats);
        break;
      case 'date':
      default:
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    setFilteredRides(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, rides]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/rides', newRide);
      setNewRide({
        origin: '',
        destination: '',
        date: '',
        time: '',
        seats: 1,
        price: '',
        description: ''
      });
      loadRides();
    } catch (error) {
      console.error('Error creating ride:', error);
    }
  };

  return (
    <div className="pool-main">
      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search rides..."
            value={filters.origin}
            onChange={handleFilterChange}
            name="origin"
          />
          <button 
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="advanced-filters">
            <div className="filter-group">
              <input
                type="text"
                placeholder="Destination"
                value={filters.destination}
                onChange={handleFilterChange}
                name="destination"
              />
              <input
                type="date"
                value={filters.date}
                onChange={handleFilterChange}
                name="date"
              />
            </div>
            <div className="filter-group">
              <input
                type="number"
                placeholder="Min Price"
                value={filters.priceRange.min}
                onChange={handlePriceRangeChange}
                name="min"
              />
              <input
                type="number"
                placeholder="Max Price"
                value={filters.priceRange.max}
                onChange={handlePriceRangeChange}
                name="max"
              />
            </div>
            <div className="filter-group">
              <input
                type="number"
                placeholder="Min Seats"
                value={filters.seats}
                onChange={handleFilterChange}
                name="seats"
              />
              <select
                value={filters.sortBy}
                onChange={handleFilterChange}
                name="sortBy"
              >
                <option value="date">Sort by Date</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="seats">Most Seats Available</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="rides-container">
        <div className="rides-list">
          {filteredRides.map(ride => (
            <div key={ride._id} className="ride-card">
              <div className="ride-header">
                <h3>{ride.origin} → {ride.destination}</h3>
                <span className="price">${ride.price}</span>
              </div>
              <div className="ride-details">
                <p><i className="fas fa-calendar"></i> {ride.date}</p>
                <p><i className="fas fa-clock"></i> {ride.time}</p>
                <p><i className="fas fa-chair"></i> {ride.seats} seats available</p>
              </div>
              <p className="description">{ride.description}</p>
              <button className="join-button">Join Ride</button>
            </div>
          ))}
        </div>

        <div className="offer-ride">
          <h2>Offer a Ride</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                name="origin"
                value={newRide.origin}
                onChange={handleInputChange}
                placeholder="Origin"
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                name="destination"
                value={newRide.destination}
                onChange={handleInputChange}
                placeholder="Destination"
                required
              />
            </div>
            <div className="form-group">
              <input
                type="date"
                name="date"
                value={newRide.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="time"
                name="time"
                value={newRide.time}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="number"
                name="seats"
                value={newRide.seats}
                onChange={handleInputChange}
                placeholder="Number of seats"
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <input
                type="number"
                name="price"
                value={newRide.price}
                onChange={handleInputChange}
                placeholder="Price per seat"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <textarea
                name="description"
                value={newRide.description}
                onChange={handleInputChange}
                placeholder="Additional details"
                rows="3"
              />
            </div>
            <button type="submit" className="submit-button">Offer Ride</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PoolMain; 