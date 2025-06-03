import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get('http://localhost:5000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
          console.error('Error fetching user data:', error);
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">RideShare</Link>
      </div>

      <div className="navbar-menu">
      <Link to="/" className="nav-link">Home</Link>
        <Link to="/rides" className="nav-link">Find Rides</Link>
        <Link to="/rides/offer" className="nav-link">Offer Ride</Link>
        <Link to="/messages" className="nav-link">Messages</Link>
      </div>

      <div className="navbar-end">
        {user ? (
          <div className="user-profile">
            <button 
              className="profile-button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <span className="greeting">Hi! {user.name}</span>
              <i className="fas fa-chevron-down"></i>
            </button>
            
            {isProfileOpen && (
              <div className="profile-dropdown">
                <Link to="/profile" className="dropdown-item">
                  <i className="fas fa-user"></i> Profile
                </Link>
                <Link to="/rides/history" className="dropdown-item">
                  <i className="fas fa-history"></i> Ride History
                </Link>
                <Link to="/messages" className="dropdown-item">
                  <i className="fas fa-envelope"></i> Messages
                </Link>
                <button onClick={handleLogout} className="dropdown-item">
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="login-button">Login</Link>
            <Link to="/signup" className="signup-button">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 