import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import './styles.css';

const ContactFarmer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { farmerId, farmerName } = location.state || {};
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('userData'));
  const contractorName = userData?.fullName || 'Unknown Contractor';

  // Only check for missing farmerId/farmerName
  if (!farmerId || !farmerName) {
    toast.error('Invalid farmer information');
    navigate('/farm-available');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8055/send-farmer-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farmerId,
          message: message,
          contractorName,
          contractorId: userData.id
        }),
      });

      const data = await response.json();
      if (data.status) {
        toast.success('Message sent successfully!');
        navigate('/farm-available');
      } else {
        toast.error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="contact-form-container">
      <h2>Contact {farmerName}</h2>
      <p className="user-info">You are logged in as: {contractorName} (Contractor)</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="message">Your Message:</label>
          <textarea
            id="message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <div className="button-group">
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate('/farm-available')}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="send-button"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactFarmer;