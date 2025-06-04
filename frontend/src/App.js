import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import PoolMain from './pages/PoolMain';
import OfferRide from './pages/OfferRide';
import FindRides from './pages/FindRides';
import Messages from './pages/Messages';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RideDetails from './pages/RideDetails';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/pool" element={<PoolMain />} />
          <Route path="/rides/offer" element={<OfferRide />} />
          <Route path="/rides" element={<FindRides />} />
          <Route path="/rides/:id" element={<RideDetails />} />
          <Route path="/messages" element={<Messages />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
