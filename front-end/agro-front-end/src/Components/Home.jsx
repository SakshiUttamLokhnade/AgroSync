import { useState, useEffect } from 'react';
import './styles.css';
import axios from 'axios';
import FarmList from './FarmList';

export default function Home() {
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
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
    if (!isLoggedIn) {
      alert('You must be logged in to contact a farmer.');
      window.location.href = '/login'; // redirect to login page
      return;
    }
  
    alert(`Contacting ${farmer.fullName}`);
    // Or open a contact modal, redirect to contact page etc.
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
          <FarmList farmers={farmers} onContact={handleContact} />

        )}
      </div>
    </>
  );
}
