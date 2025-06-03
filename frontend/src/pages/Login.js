import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      const token = response.data.token;
      localStorage.setItem('token', token);
      showNotification('Login successful! Redirecting...', 'success');
      
      // Get user data and store it
      const userResponse = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      
      // Force navigation after a short delay
      setTimeout(() => {
        navigate('/', { replace: true });
        window.location.reload(); // Force a page reload to update the navbar
      }, 1500);
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.error || 'Login failed';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    }
  };

  return (
    <div className="login-container">
      {showPopup && (
        <div className={`popup ${popupType}`}>
          {popupMessage}
        </div>
      )}
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login; 