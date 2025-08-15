import { useState, useEffect } from 'react';
import './styles.css';
import axios from 'axios';
import FarmList from './FarmList';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import React from 'react';
export default function Home() {
  const navigate = useNavigate();
  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.userType === 'Farmer') {
          navigate(`/farmer/profile/${user.id}`, { replace: true });
        } else if (user.userType === 'Contractor') {
          navigate(`/contractor/profile/${user.id}`, { replace: true });
        }
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);
  const [farmers, setFarmers] = useState([]);

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const res = await axios.get('http://localhost:8055/get-farmers');
        if (res.data.status && res.data.data.length > 0) {
          setFarmers(res.data.data);
        } else {
          setFarmers([]);
        }
      } catch (err) {
        console.error('Failed to fetch farms for home:', err);
      }
    };

    fetchFarmers();
  }, []);

  const handleContact = (farmer) => {
    // On the public Home page, always prompt for login before contacting
    console.log("Contact clicked on Home page for:", farmer.fullName);
    toast.error('Please log in to contact farmers.');
    navigate('/login'); // Redirect to login page
  };
  

  return (
    <>
      <div className="home-container">
        <div className="statement">
          <p>Secure Contract for Farmers</p>
          <p>and Guaranteed Produce for</p>
          <p>Contractors.</p>
        </div>
        <div className="paragraph">
          <p>Connect farmers and contractors</p>
          <p>with transparent, secure</p>
          <p>contract farming agreements.</p>
        </div>
      </div>

      <div className="public-farm-section">
        <h2>Explore Available Farm Lands</h2>
        {farmers.length === 0 ? (
          <p>No available farmlands yet.</p>
        ) : (
          <FarmList farmers={farmers} onContact={handleContact} requireLoginForContact={true} />

        )}
      </div>
    </>
  );
}
