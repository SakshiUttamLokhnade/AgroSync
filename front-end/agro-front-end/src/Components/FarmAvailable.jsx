


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import axios from 'axios';
import toast from 'react-hot-toast';
import FarmList from './FarmList';

export default function FarmAvailable() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getFarmers = async () => {
    try {
      const res = await axios.get('https://agrosync-1.onrender.com/get-farmers');
      const resData = res.data;
      if (resData.status && resData.data.length > 0) {
        setFarmers(resData.data);
      } else {
        setFarmers([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching data');
      setError('Failed to fetch farmer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFarmers();
  }, []);

  const handleContact = (farmer) => {
    alert(`Contacting ${farmer.fullName}`);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <button onClick={getFarmers}>Retry</button>
      </div>
    );
  }

  return (
    <div className="farmers-list-container">
      <h1>Available Farm Lands</h1>
      {farmers.length === 0 ? (
        <p>No available farmland at the moment.</p>
      ) : (
        <FarmList farmers={farmers} onContact={handleContact} />
      )}
    </div>
  );
}
