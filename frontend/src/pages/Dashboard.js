import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    totalRides: 0,
    activeRides: 0,
    completedRides: 0,
    totalPassengers: 0
  });
  const [userRides, setUserRides] = useState({
    driving: [],
    riding: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }

    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token || !storedUser) {
        setError('Please log in to view your dashboard');
        return;
      }

      const userData = JSON.parse(storedUser);
      
      // Fetch user's rides (both driving and riding)
      const ridesResponse = await axios.get(`${config.API_URL}/api/rides/user`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch ride statistics
      const statsResponse = await axios.get(`${config.API_URL}/api/rides/stats`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      // Separate rides into driving and riding
      const driving = ridesResponse.data.filter(ride => ride.driver?._id === userData._id);
      const riding = ridesResponse.data.filter(ride => 
        ride.passengers?.some(passenger => passenger._id === userData._id)
      );

      setUserRides({ driving, riding });
      setStats(statsResponse.data);
      setUserData(userData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        setError(error.response?.data?.error || 'Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
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
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      
      <div className="stats-section">
        <h2>Your Statistics</h2>
        <div className="stats-grid">
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
            <h3>Total Passengers</h3>
            <p>{stats.totalPassengers}</p>
          </div>
        </div>
      </div>

      <div className="rides-section">
        <h2>Your Rides</h2>
        
        <div className="rides-grid">
          <div className="rides-column">
            <h3>Rides You're Driving</h3>
            {userRides.driving.length === 0 ? (
              <p>No rides scheduled</p>
            ) : (
              userRides.driving.map(ride => (
                <div key={ride._id} className="ride-card">
                  <h4>{ride.origin} → {ride.destination}</h4>
                  <p>Date: {formatDate(ride.date)}</p>
                  <p>Seats: {ride.seats}</p>
                  <p>Passengers: {ride.passengers?.length || 0}</p>
                </div>
              ))
            )}
          </div>

          <div className="rides-column">
            <h3>Rides You're Riding</h3>
            {userRides.riding.length === 0 ? (
              <p>No rides scheduled</p>
            ) : (
              userRides.riding.map(ride => (
                <div key={ride._id} className="ride-card">
                  <h4>{ride.origin} → {ride.destination}</h4>
                  <p>Date: {formatDate(ride.date)}</p>
                  <p>Driver: {ride.driver?.name}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 