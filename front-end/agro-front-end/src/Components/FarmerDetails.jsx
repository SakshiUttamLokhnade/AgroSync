import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles.css';
import { toast } from 'react-hot-toast';

// Removed Modal component import and definition as it's no longer used here
// const Modal = ...

const FarmerDetails = () => {
  const { farmerId } = useParams();
  const navigate = useNavigate();
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Removed Modal-related state
  // const [isProposingAgreement, setIsProposingAgreement] = useState(false);
  // const [agreementTerms, setAgreementTerms] = useState('');
  // const [isSubmittingAgreement, setIsSubmittingAgreement] = useState(false);


  useEffect(() => {
    const fetchFarmerDetails = async () => {
      if (!farmerId) {
        setError('Invalid farmer ID');
        setLoading(false);
        toast.error('Invalid farmer ID');
        navigate('/dashboard');
        return;
      }

      try {
        console.log('Fetching details for farmer ID:', farmerId);
        const res = await axios.get(`https://agrosync-1.onrender.com/farmer/profile/${farmerId}`);
        
        if (!res.data || !res.data.status) {
          throw new Error(res.data?.message || 'Invalid response from server');
        }

        const farmerData = res.data.data;
        
        // Validate required fields
        const requiredFields = ['userId', 'fullName', 'contact'];
        const missingFields = requiredFields.filter(field => !farmerData[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        setFarmer(farmerData);
      } catch (err) {
        console.error('Failed to fetch farmer details:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch farmer details';
        setError(errorMessage);
        toast.error(errorMessage);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerDetails();
  }, [farmerId, navigate]);

  const handleImageError = () => {
    console.log('Image failed to load, showing default');
    setImageError(true);
  };

  const handleBack = () => navigate(-1);

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure to delete your account?')) {
      try {
        await axios.delete(`https://agrosync-1.onrender.com/farmer/profile/${farmerId}`);
        toast.success('Account deleted');
        navigate('/register');
      } catch (error) {
        toast.error('Failed to delete account');
      }
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || userData.userType !== 'Contractor') {
      toast.error('Only contractors can send messages');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('https://agrosync-1.onrender.com/send-farmer-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farmerId: farmer.userId,
          message,
          contractorName: userData.fullName,
          contractorId: userData.id
        }),
      });

      const data = await response.json();
      if (data.status) {
        toast.success('Message sent successfully!');
        setMessage(''); // Clear the message input
      } else {
        toast.error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // --- Agreement Navigation Handler ---
  const handleRequestAgreementClick = () => {
    const userDataString = localStorage.getItem('user');
    if (!userDataString) {
        toast.error("Please log in to propose an agreement.");
        navigate('/login');
        return;
    }
    let userData;
    try {
        userData = JSON.parse(userDataString);
    } catch (error) {
        console.error("Failed to parse user data from localStorage for agreement proposal", error);
        toast.error("Error reading user data. Please log in again.");
        localStorage.removeItem('user');
        navigate('/login');
        return;
    }

    if (userData.userType !== 'Contractor') {
        toast.error("Only Contractors can propose agreements from this view.");
        return;
    }

    if (!farmer?.userId || !userData?.id) {
        toast.error("Missing farmer or contractor information.");
        return;
    }

    // Get the farm ID from the farmer's data
    const farmId = farmer.farmId; // Use the farmId from the farmer data
    if (!farmId) {
        toast.error("Missing farm information.");
        return;
    }

    console.log('Navigating to agreement with data:', {
        farmerId: farmer.userId,
        farmerName: farmer.fullName,
        contractorId: userData.id,
        contractorName: userData.fullName,
        farmId: farmId
    });

    // Navigate to the Agreement page, passing IDs in state
    navigate('/agreement', {
        state: {
            farmerId: farmer.userId,
            farmerName: farmer.fullName,
            contractorId: userData.id,
            contractorName: userData.fullName,
            farmId: farmId
        }
    });
  };

  // Removed handleAgreementModalClose and handleProposeAgreementSubmit functions

  if (loading) return <div className="loading">Loading Farmer Details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!farmer) return <div className="error">No farmer data found.</div>;

  return (
    <div className="farmer-details-container">
      <button className="back-btn" onClick={handleBack}>← Back to Dashboard</button>
      <h2>Farmer Details: {farmer.fullName}</h2>

      <div className="detail-section">
        <h3>Farm Information</h3>
        <div className="detail-row"><strong>Soil Type:</strong> {farmer.soilType || 'Not specified'}</div>
        <div className="detail-row"><strong>Water Source:</strong> {farmer.waterSource || 'Not specified'}</div>
        <div className="detail-row"><strong>Land Area:</strong> {farmer.landArea || 'Not specified'} acres</div>
        <div className="detail-row"><strong>Location:</strong> {farmer.locationAddress || 'Not specified'}, {farmer.pincode || 'Not specified'}</div>
        <div className="detail-row"><strong>Preferred Crops:</strong> {farmer.preferredCrops || 'Not specified'}</div>
        <div className="detail-row"><strong>Farm Created At:</strong> {new Date(farmer.farmCreatedAt).toLocaleString()}</div>
      </div>

      <div className="detail-section">
        <h3>Contact Information</h3>
        <div className="detail-row"><strong>Phone:</strong> {farmer.contact}</div>
      </div>

      <div className="detail-section">
        <h3>Land Documents</h3>
        {farmer.utara_file_path ? (
          <div className="file-link">
            <a
              href={`https://agrosync-1.onrender.com/uploads/${farmer.utara_file_path}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              📄 View 7/12 Utara
            </a>
          </div>
        ) : (
          <div>No Utara document available.</div>
        )}

        <div className="image-preview" style={{ marginTop: '20px' }}>
          <h4>Land Photo</h4>
          {farmer.land_image_path ? (
            <div style={{ maxWidth: '100%', maxHeight: '400px', overflow: 'hidden', border: '1px solid #ddd', borderRadius: '8px' }}>
              <img
                src={`https://agrosync-1.onrender.com/uploads/${farmer.land_image_path}`}
                alt="Land"
                onError={handleImageError}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: imageError ? 'none' : 'block'
                }}
              />
              {imageError && (
                <div style={{ 
                  padding: '20px', 
                  textAlign: 'center',
                  backgroundColor: '#f8f9fa',
                  color: '#6c757d'
                }}>
                  <p>Image not available</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              color: '#6c757d',
              border: '1px dashed #dee2e6',
              borderRadius: '8px'
            }}>
              No land image available
            </div>
          )}
        </div>

        <div className="request-agreement">
          <button onClick={handleRequestAgreementClick}> Propose Agreement </button>
        </div>
      </div>

      {/* Removed Modal JSX */}
      {/* {isProposingAgreement && ( ... )} */}
    </div>
  );
};

export default FarmerDetails;
