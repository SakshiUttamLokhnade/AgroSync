import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import axios from 'axios';
import toast from 'react-hot-toast';
import FarmList from './FarmList';

export default function FarmAvailable({ requireLoginForContact = false }) {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getFarmers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching farmers data...');
      const res = await axios.get('http://localhost:8055/get-farmers');
      const resData = res.data;
      
      console.log('API Response:', resData);
      
      if (!resData.status) {
        throw new Error(resData.message || 'Failed to fetch farmers');
      }

      if (!Array.isArray(resData.data)) {
        throw new Error('Invalid data format received from server');
      }

      // Process and validate each farmer
      const validFarmers = resData.data
        .map(farmer => {
          if (!farmer || typeof farmer !== 'object') {
            console.error('Invalid farmer object:', farmer);
            return null;
          }

          // Skip farms that are not available
          if (farmer.status && farmer.status !== 'available') {
            console.log(`Skipping farm ${farmer.id} - status: ${farmer.status}`);
            return null;
          }

          // Ensure we have the required fields with proper fallbacks
          const processedFarmer = {
            ...farmer,
            userId: farmer.id || farmer.userId || null,
            fullName: farmer.fullName?.trim() || 'Unknown Farmer',
            locationAddress: farmer.locationAddress?.trim() || 'Location not specified',
            landArea: farmer.landArea?.trim() || 'Area not specified',
            preferredCrops: Array.isArray(farmer.preferredCrops) 
              ? farmer.preferredCrops.join(', ') 
              : (farmer.preferredCrops?.trim() || 'No crops specified'),
            land_image_path: farmer.land_image_path || null,
            soilType: farmer.soilType?.trim() || 'Soil type not specified',
            waterSource: farmer.waterSource?.trim() || 'Water source not specified',
            status: farmer.status || 'available' // Default to available if status is not set
          };

          // Validate the processed farmer
          if (!processedFarmer.userId) {
            console.error('Farmer missing ID:', processedFarmer);
            return null;
          }

          return processedFarmer;
        })
        .filter(farmer => farmer !== null); // Remove invalid entries

      if (validFarmers.length === 0) {
        toast.info('No farmers found in the database');
      }

      console.log('Processed farmers:', validFarmers);
      setFarmers(validFarmers);
    } catch (err) {
      console.error('Error fetching farmers:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch farmer data';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFarmers();
  }, []);

  const handleContact = (farmer) => {
    navigate(`/farmer/details/${farmer.userId}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading available farms...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button 
          className="retry-button"
          onClick={getFarmers}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="farmers-list-container">
      <h1>Available Farm Lands</h1>
      {farmers.length === 0 ? (
        <div className="no-farms-container">
          <p>No available farmland at the moment.</p>
          <button 
            className="refresh-button"
            onClick={getFarmers}
          >
            Refresh
          </button>
        </div>
      ) : (
        <FarmList farmers={farmers} onContact={handleContact} requireLoginForContact={requireLoginForContact} />
      )}
    </div>
  );
}
