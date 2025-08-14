import { NavLink } from 'react-router-dom';
import './styles.css';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function FarmList({ farmers, onContact, requireLoginForContact = false }) {
  const navigate = useNavigate();
  const [imageErrors, setImageErrors] = useState({});
  const [farmsWithAgreements, setFarmsWithAgreements] = useState(new Set());

  useEffect(() => {
    // Fetch farms with active agreements
    const fetchFarmsWithAgreements = async () => {
      try {
        const response = await axios.get('http://localhost:8055/agreements/active-farms');
        if (response.data.status && Array.isArray(response.data.data)) {
          const farmIds = response.data.data.map(agreement => agreement.farmId);
          setFarmsWithAgreements(new Set(farmIds));
        }
      } catch (error) {
        console.error('Error fetching farms with agreements:', error);
      }
    };

    fetchFarmsWithAgreements();
  }, []);
  
  const handleContactFarmer = (farmer) => {
    if (!farmer) {
      console.error('Farmer object is null or undefined');
      return;
    }
    if (!farmer.userId) {
      console.error('Invalid farmer data - missing userId:', farmer);
      return;
    }
    if (requireLoginForContact) {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        // Not logged in, force login
        navigate('/login');
        return;
      }
    }
    // If not requiring login, or user is logged in, proceed as normal
    if (onContact) {
      onContact(farmer);
    } else {
      navigate(`/farmer/details/${farmer.userId}`);
    }
  };

  const handleImageError = (index) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  // Validate farmers array
  if (!Array.isArray(farmers)) {
    console.error('Farmers prop is not an array:', farmers);
    return <div>Error: Invalid farmers data</div>;
  }

  return (
    <div className="farmers-grid">
      {farmers.map((farmer, index) => {
        // Detailed validation and logging
        if (!farmer) {
          console.error(`Farmer at index ${index} is null or undefined`);
          return null;
        }

        console.log(`Processing farmer at index ${index}:`, {
          id: farmer.id,
          userId: farmer.userId,
          fullName: farmer.fullName
        });

        if (!farmer.userId) {
          console.error(`Farmer at index ${index} has no userId:`, farmer);
          return null;
        }

        return (
          <div 
            key={index} 
            className="farmer-card"
            style={{
              opacity: farmsWithAgreements.has(farmer.farmId) ? 0.8 : 1,
              transition: 'opacity 0.3s ease',
              position: 'relative'
            }}
          >
            <div className="farmer-image" style={{ position: 'relative' }}>
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                borderRadius: '8px 8px 0 0'
              }}>
                <img
                  src={
                    !imageErrors[index] && farmer.land_image_path
                      ? `http://localhost:8055/uploads/${farmer.land_image_path}`
                      : '/default-farm-image.jpg'
                  }
                  alt="Land"
                  onError={() => handleImageError(index)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: farmsWithAgreements.has(farmer.farmId) ? 'blur(3px)' : 'none',
                    transition: 'filter 0.3s ease',
                    opacity: farmsWithAgreements.has(farmer.farmId) ? 0.7 : 1
                  }}
                />
                {farmsWithAgreements.has(farmer.farmId) && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    textAlign: 'center',
                    padding: '20px',
                    zIndex: 2
                  }}>
                    <div style={{
                      backgroundColor: 'rgba(255, 0, 0, 0.8)',
                      color: 'white',
                      padding: '8px 20px',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      fontSize: '16px',
                      marginBottom: '10px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}>
                      Sold Out
                    </div>
                    <div style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      padding: '6px 15px',
                      borderRadius: '15px',
                      fontSize: '12px',
                      marginTop: '5px'
                    }}>
                      This land is currently in use
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="farmer-info">
              <h2>{farmer.fullName || 'Unknown Farmer'}</h2>
              <p><strong>Location:</strong> {farmer.locationAddress || 'Not specified'}</p>
              <p><strong>Land Area:</strong> {farmer.landArea || 'Not specified'} acres</p>
              <p><strong>Preferred Crop:</strong> {farmer.preferredCrops || 'No crops specified'}</p>

              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => handleContactFarmer(farmer)}
                  disabled={!farmer.userId || farmsWithAgreements.has(farmer.farmId)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: 'none',
                    borderRadius: '5px',
                    backgroundColor: farmsWithAgreements.has(farmer.farmId) ? '#cccccc' : '#4CAF50',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: farmsWithAgreements.has(farmer.farmId) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {farmsWithAgreements.has(farmer.farmId) ? 'Currently Unavailable' : 'Contact Farmer'}
                </button>
                {farmsWithAgreements.has(farmer.farmId) && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    zIndex: 1,
                    pointerEvents: 'none'
                  }}></div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
