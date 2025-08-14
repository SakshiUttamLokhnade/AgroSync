import React, { useEffect, useState } from 'react';
import './styles.css';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

const AvailableContractors = () => {
  const [contractors, setContractors] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContractors = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8055/api/contractors');
        // Ensure we're getting an array of contractors
        const contractorsData = Array.isArray(response.data) ? response.data : [];
        setContractors(contractorsData);
        setError(null);
      } catch (error) {
        console.error('Error fetching contractors:', error);
        setError('Failed to load contractors. Please try again later.');
        setContractors([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchContractors();
  }, []);

  if (loading) {
    return <div className="contractor-container">Loading contractors...</div>;
  }

  if (error) {
    return <div className="contractor-container">{error}</div>;
  }

  return (
    <div className="contractor-container">
      <h2>Available Contractors</h2>
      <div className="contractor-list">
        {contractors && contractors.length > 0 ? (
          contractors.map((contractor) => (
            <div key={contractor.id} className="contractor-card">
              <div className="contractor-icon">
                <FontAwesomeIcon icon={faUser} style={{ color: 'black', fontSize: 48 }} />
              </div>
              <h4>{contractor.name}</h4>
              <p>{contractor.contact}</p>
            </div>
          ))
        ) : (
          <p>No contractors available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default AvailableContractors;