


import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';  // Import useParams
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import './styles.css';

const FarmerProfile = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { farmerId } = useParams();  // Get farmerId from URL params

  useEffect(() => {
    if (!farmerId) {
      navigate('/login');  // If no farmerId is in the URL, redirect to login
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:8055/farmer/profile/${farmerId}`);
        setProfile(response.data);
        setEditForm(response.data);
        setLoading(false);
      } catch (error) {
        toast.error('Error loading profile');
        navigate('/login');
      }
    };

    fetchProfile();
  }, [farmerId, navigate]);

  const handleLogout = () => {
    navigate('/login');  // Redirect to login page
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`http://localhost:8055/farmer/profile/${farmerId}`, editForm);
      setProfile(response.data);
      toast.success('Profile updated');
      setActiveTab('profile');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure to delete your account?')) {
      try {
        await axios.delete(`http://localhost:8055/farmer/profile/${farmerId}`);
        toast.success('Account deleted');
        navigate('/register');
      } catch (error) {
        toast.error('Failed to delete account');
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="farmer-dashboard">
      <Toaster position="top-right" />
      <div className="sidebar">
        <h2>AgroSync</h2>
        <p>{profile.fullName}</p>
        <div className="sidebar-menu">
          <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button onClick={() => setActiveTab('profile')}>Profile</button>
          <button onClick={() => setActiveTab('edit')}>Edit Profile</button>
          <button onClick={() => setActiveTab('delete')}>Delete Account</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="main-content">
        {activeTab === 'dashboard' && (
          <div>
            <h3>Farm Overview</h3>
            <p>Land Area: {profile.landArea}</p>
            <p>Preferred Crops: {profile.preferredCrops}</p>
            <p>Water Source: {profile.waterSource}</p>
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            <h3>My Profile</h3>
            <p>Full Name: {profile.fullName}</p>
            <p>Username: {profile.userName}</p>
            <p>Contact: {profile.contact}</p>
            <p>Aadhar: {profile.aadhar}</p>
            <p>Farm Name: {profile.farmName}</p>
            <p>Soil Type: {profile.soilType}</p>
            <p>Location: {profile.locationAddress}</p>
            <p>Pincode: {profile.pincode}</p>
          </div>
        )}

        {activeTab === 'edit' && (
          <form onSubmit={handleSaveProfile}>
            <h3>Edit Profile</h3>
            <input
              name="fullName"
              value={editForm.fullName}
              onChange={handleInputChange}
              placeholder="Full Name"
            />
            <input
              name="contact"
              value={editForm.contact}
              onChange={handleInputChange}
              placeholder="Contact"
            />
            <input
              name="farmName"
              value={editForm.farmName}
              onChange={handleInputChange}
              placeholder="Farm Name"
            />
            <input
              name="soilType"
              value={editForm.soilType}
              onChange={handleInputChange}
              placeholder="Soil Type"
            />
            <input
              name="preferredCrops"
              value={editForm.preferredCrops}
              onChange={handleInputChange}
              placeholder="Preferred Crops"
            />
            <input
              name="locationAddress"
              value={editForm.locationAddress}
              onChange={handleInputChange}
              placeholder="Location Address"
            />
            <input
              name="pincode"
              value={editForm.pincode}
              onChange={handleInputChange}
              placeholder="Pincode"
            />
            <button type="submit">Save Changes</button>
          </form>
        )}

        {activeTab === 'delete' && (
          <div>
            <h3>Delete Account</h3>
            <p>This action is irreversible.</p>
            <button onClick={handleDeleteAccount}>Confirm Delete</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerProfile;
