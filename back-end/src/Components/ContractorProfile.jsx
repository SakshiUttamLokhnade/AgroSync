import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import './styles.css';
import FarmAvailable from './FarmAvailable';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';

const ContractorProfile = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [agreements, setAgreements] = useState([]);
  const [loadingAgreements, setLoadingAgreements] = useState(false);
  const navigate = useNavigate();
  const { contractorId } = useParams();
  console.log(contractorId); // Should print contractorId value


  useEffect(() => {
    if (!contractorId) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:8055/contractor/profile/${contractorId}`);
        setProfile(response.data);
        setEditForm(response.data);
        setLoading(false);
      } catch (error) {
        toast.error('Error loading contractor profile');
        navigate('/login');
      }
    };

    fetchProfile();
  }, [contractorId, navigate]);

  useEffect(() => {
    if (activeTab === 'agreements' && contractorId) {
      fetchAgreements();
    }
  }, [activeTab, contractorId]);

  // Block history back navigation
  React.useEffect(() => {
    const handlePopState = (event) => {
      event.preventDefault();
      event.stopPropagation();
      // Prevent going back
      if (localStorage.getItem('user')) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user.userType === 'Farmer') {
          navigate(`/farmer/profile/${user.id}`, { replace: true });
        } else if (user.userType === 'Contractor') {
          navigate(`/contractor/profile/${user.id}`, { replace: true });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  const fetchAgreements = async () => {
    setLoadingAgreements(true);
    try {
      const response = await axios.get(`http://localhost:8055/agreements/user/${contractorId}`);
      if (response.data.status) {
        const filteredAgreements = response.data.data.filter(ag => ag.contractorId === Number(contractorId));
        console.log('Fetched agreements:', filteredAgreements);
        setAgreements(filteredAgreements);
      } else {
        setAgreements([]);
      }
    } catch (error) {
      console.error('Error fetching agreements:', error);
      setAgreements([]);
    } finally {
      setLoadingAgreements(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/', { replace: true });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await axios.put(`http://localhost:8055/contractor/profile/${contractorId}`, editForm);
      setProfile(response.data);
      toast.success('Profile updated successfully');
      setActiveTab('profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await axios.delete(`http://localhost:8055/contractor/profile/${contractorId}`);
      // Clear session data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      toast.success('Account deleted successfully');
      navigate('/register');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  // PDF generation function
  const handleDownloadAgreementPDF = async (agreement) => {
    try {
      console.log('Starting PDF generation for agreement:', agreement);
      console.log('Contractor signature type:', typeof agreement.contractor_signature);
      console.log('Farmer signature type:', typeof agreement.farmer_signature);
      
      if (agreement.contractor_signature) {
        console.log('Contractor signature starts with:', agreement.contractor_signature.substring(0, 50));
      }
      if (agreement.farmer_signature) {
        console.log('Farmer signature starts with:', agreement.farmer_signature.substring(0, 50));
      }
      
      const pdfDoc = await PDFDocument.create();
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const page = pdfDoc.addPage([600, 800]);
      let y = 770;
      
      // Draw border
      page.drawRectangle({ x: 30, y: 40, width: 540, height: 720, borderColor: rgb(0.2,0.2,0.5), borderWidth: 2 });
      
      // Title
      page.drawText('Farm Contract Agreement', { x: 120, y: y, size: 22, color: rgb(0.1, 0.2, 0.5), font: helveticaBold });
      y -= 50;
      
      // Agreement Info
      page.drawText('Agreement ID:', { x: 50, y, size: 13, font: helveticaBold });
      page.drawText(` ${agreement.agreementId}` || '', { x: 150, y, size: 13, font: helvetica });
      y -= 22;
      
      page.drawText('Status:', { x: 50, y, size: 13, font: helveticaBold });
      page.drawText(` ${agreement.status || ''}`, { x: 150, y, size: 13, font: helvetica });
      y -= 22;
      
      page.drawText('Proposed On:', { x: 50, y, size: 13, font: helveticaBold });
      page.drawText(` ${new Date(agreement.created_at).toLocaleString()}`, { x: 150, y, size: 13, font: helvetica });
      y -= 30;
      
      // Parties
      page.drawText('Parties:', { x: 50, y, size: 15, color: rgb(0.2, 0.2, 0.2), font: helveticaBold });
      y -= 20;
      
      page.drawText('Farmer:', { x: 60, y, size: 13, font: helveticaBold });
      page.drawText(` ${agreement.farmerName || 'N/A'}`, { x: 140, y, size: 13, font: helvetica });
      y -= 18;
      
      page.drawText('Contractor:', { x: 60, y, size: 13, font: helveticaBold });
      page.drawText(` ${agreement.contractorName || 'N/A'}`, { x: 140, y, size: 13, font: helvetica });
      y -= 30;
      
      // Contract Details
      page.drawText('Contract Details:', { x: 50, y, size: 15, color: rgb(0.2, 0.2, 0.2), font: helveticaBold });
      y -= 20;
      
      const wrapText = (text, maxLen = 80) => {
        if (!text) return [];
        const lines = [];
        let current = '';
        for (const word of text.split(' ')) {
          if ((current + word).length > maxLen) {
            lines.push(current);
            current = '';
          }
          current += word + ' ';
        }
        if (current) lines.push(current);
        return lines;
      };
      
      wrapText(agreement.contract_details, 80).forEach(line => {
        page.drawText(line.trim(), { x: 60, y, size: 12, font: helvetica });
        y -= 15;
      });
      y -= 10;
      
      // Agreement Type
      page.drawText('Agreement Type:', { x: 50, y, size: 13, font: helveticaBold });
      page.drawText(` ${agreement.agreement_type || ''}`, { x: 180, y, size: 13, font: helvetica });
      y -= 18;
      if (agreement.profit_share) { page.drawText('Profit Share (%):', { x: 50, y, size: 13, font: helveticaBold }); page.drawText(` ${agreement.profit_share}`, { x: 180, y, size: 13, font: helvetica }); y -= 18; }
      if (agreement.sale_price) { page.drawText('Sale Price (₹):', { x: 50, y, size: 13, font: helveticaBold }); page.drawText(` ${agreement.sale_price}`, { x: 180, y, size: 13, font: helvetica }); y -= 18; }
      if (agreement.payment_method) { page.drawText('Payment Method:', { x: 50, y, size: 13, font: helveticaBold }); page.drawText(` ${agreement.payment_method}`, { x: 180, y, size: 13, font: helvetica }); y -= 18; }
      if (agreement.crop_type) { page.drawText('Crop Type:', { x: 50, y, size: 13, font: helveticaBold }); page.drawText(` ${agreement.crop_type}`, { x: 180, y, size: 13, font: helvetica }); y -= 18; }
      if (agreement.penalty_clause) { page.drawText('Penalty Clause:', { x: 50, y, size: 13, font: helveticaBold }); page.drawText(` ${agreement.penalty_clause}`, { x: 180, y, size: 13, font: helvetica }); y -= 18; }
      if (agreement.renewal_option) { page.drawText('Renewal Option:', { x: 50, y, size: 13, font: helveticaBold }); page.drawText(` ${agreement.renewal_option}`, { x: 180, y, size: 13, font: helvetica }); y -= 18; }
      
      // Terms
      page.drawText('Terms:', { x: 50, y, size: 13, font: helveticaBold });
      y -= 20;
      
      let termsArr = [];
      if (Array.isArray(agreement.terms)) {
        termsArr = agreement.terms;
      } else if (typeof agreement.terms === 'string') {
        try {
          const parsed = JSON.parse(agreement.terms);
          termsArr = Array.isArray(parsed) ? parsed : [agreement.terms];
        } catch {
          termsArr = [agreement.terms];
        }
      } else {
        termsArr = [];
      }
      
      if (termsArr.length) {
        termsArr.forEach(term => { page.drawText(`- ${term}`, { x: 60, y, size: 12, font: helvetica }); y -= 15; });
        y -= 10;
      }
      
      // Signatures
      page.drawText('Signatures:', { x: 50, y, size: 15, color: rgb(0.2, 0.2, 0.2), font: helveticaBold });
      y -= 20;
      
      // Contractor signature
      page.drawText('Contractor:', { x: 60, y, size: 13, font: helveticaBold });
      if (agreement.contractor_signature) {
        try {
          let contractorSigBase64 = agreement.contractor_signature;
          // Handle different signature data formats
          if (typeof contractorSigBase64 === 'string') {
            if (contractorSigBase64.startsWith('data:image')) {
              contractorSigBase64 = contractorSigBase64.split(',')[1];
            }
            console.log('Processing contractor signature...');
            const contractorSigBytes = Uint8Array.from(atob(contractorSigBase64), c => c.charCodeAt(0));
            const contractorSigImage = await pdfDoc.embedPng(contractorSigBytes);
            page.drawImage(contractorSigImage, { x: 140, y: y - 10, width: 120, height: 40 });
            console.log('Contractor signature embedded successfully');
          } else {
            console.error('Contractor signature is not a string:', contractorSigBase64);
            page.drawText('Invalid signature format', { x: 140, y, size: 12, color: rgb(1,0,0), font: helvetica });
          }
        } catch (e) {
          console.error('Error embedding contractor signature:', e);
          page.drawText('Not signed', { x: 140, y, size: 12, color: rgb(1,0,0), font: helvetica });
        }
      } else {
        page.drawText('Not signed', { x: 140, y, size: 12, color: rgb(1,0,0), font: helvetica });
      }
      y -= 50;
      
      // Farmer signature
      page.drawText('Farmer:', { x: 60, y, size: 13, font: helveticaBold });
      if (agreement.farmer_signature) {
        try {
          let farmerSigBase64 = agreement.farmer_signature;
          // Handle different signature data formats
          if (typeof farmerSigBase64 === 'string') {
            if (farmerSigBase64.startsWith('data:image')) {
              farmerSigBase64 = farmerSigBase64.split(',')[1];
            }
            console.log('Processing farmer signature...');
            const farmerSigBytes = Uint8Array.from(atob(farmerSigBase64), c => c.charCodeAt(0));
            const farmerSigImage = await pdfDoc.embedPng(farmerSigBytes);
            page.drawImage(farmerSigImage, { x: 140, y: y - 10, width: 120, height: 40 });
            console.log('Farmer signature embedded successfully');
          } else {
            console.error('Farmer signature is not a string:', farmerSigBase64);
            page.drawText('Invalid signature format', { x: 140, y, size: 12, color: rgb(1,0,0), font: helvetica });
          }
        } catch (e) {
          console.error('Error embedding farmer signature:', e);
          page.drawText('Not signed', { x: 140, y, size: 12, color: rgb(1,0,0), font: helvetica });
        }
      } else {
        page.drawText('Not signed', { x: 140, y, size: 12, color: rgb(1,0,0), font: helvetica });
      }
      
      console.log('Generating PDF bytes...');
      const pdfBytes = await pdfDoc.save();
      console.log('Creating blob...');
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      console.log('Saving file...');
      saveAs(blob, `agreement_${agreement.agreementId}.pdf`);
      console.log('PDF generation completed successfully');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="contractor-dashboard">
      <Toaster position="top-right" />
      <div className="sidebar">
        <h2>AgroSync</h2>
        <p>{profile?.fullName}</p>
        <div className="sidebar-menu">
          <button onClick={() => setActiveTab('dashboard')} disabled={loading}>Dashboard</button>
          <button onClick={() => setActiveTab('profile')} disabled={loading}>Profile</button>
          <button onClick={() => setActiveTab('edit')} disabled={loading}>Edit Profile</button>
          <button onClick={() => setActiveTab('agreements')} disabled={loading}>My Agreements</button>
          <button onClick={() => setActiveTab('delete')} disabled={loading}>Delete Account</button>
          <button onClick={handleLogout} disabled={loading}>Logout</button>
        </div>
      </div>

      <div className="main-content">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <div>
                <h3>Dashboard</h3>
                <p>Welcome to your dashboard, {profile?.fullName}!</p>
                <h4>Available Farmlands</h4>
                <FarmAvailable contractorId={contractorId} requireLoginForContact={false} />
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h3>My Profile</h3>
                <p>Full Name: {profile?.fullName}</p>
                <p>Contact: {profile?.contact}</p>
              </div>
            )}

            {activeTab === 'edit' && (
              <form onSubmit={handleSaveProfile}>
                <h3>Edit Profile</h3>
                <input
                  name="fullName"
                  value={editForm.fullName || ''}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                  disabled={isSaving}
                />
                <input
                  name="contact"
                  value={editForm.contact || ''}
                  onChange={handleInputChange}
                  placeholder="Contact"
                  disabled={isSaving}
                />
                <button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            )}

            {activeTab === 'agreements' && (
              <div>
                <h3>My Agreements</h3>
                {loadingAgreements ? (
                  <p>Loading agreements...</p>
                ) : agreements.length === 0 ? (
                  <p>No agreements found.</p>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '18px'}}>
                    {agreements.map(ag => {
                      const termsArr = ag.terms ? ag.terms.split(',').map(term => term.trim()) : [];
                      return (
                        <div key={ag.agreementId} style={{border: '1px solid #eee', borderRadius: '6px', padding: '15px', background: '#fafbfc'}}>
                          <p><strong>Agreement ID:</strong> {ag.agreementId}</p>
                          <p><strong>Farmer Name:</strong> {ag.farmerName || 'N/A'}</p>
                          <p><strong>Status:</strong> <span style={{color: ag.status === 'Accepted' ? '#4CAF50' : ag.status === 'Rejected' ? '#f44336' : '#ff9800'}}>{ag.status}</span></p>
                          <p><strong>Proposed On:</strong> {new Date(ag.created_at).toLocaleString()}</p>
                          <p><strong>Agreement Type:</strong> {ag.agreement_type || 'N/A'}</p>
                          {ag.profit_share && <p><strong>Profit Share (%):</strong> {ag.profit_share}</p>}
                          {ag.sale_price && <p><strong>Sale Price (₹):</strong> {ag.sale_price}</p>}
                          {ag.payment_method && <p><strong>Payment Method:</strong> {ag.payment_method}</p>}
                          {ag.crop_type && <p><strong>Crop Type:</strong> {ag.crop_type}</p>}
                          {ag.penalty_clause && <p><strong>Penalty Clause:</strong> {ag.penalty_clause}</p>}
                          {ag.renewal_option && <p><strong>Renewal Option:</strong> {ag.renewal_option}</p>}
                          <p><strong>Terms:</strong></p>
                          <ul>
                            {termsArr.map((term, idx) => (
                              <li key={idx}>{term}</li>
                            ))}
                          </ul>
                          {/* Download PDF button for accepted agreements */}
                          {ag.status === 'Accepted' && (
                            <button onClick={() => handleDownloadAgreementPDF(ag)} style={{marginTop: '10px', background: '#222', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer'}}>Download PDF</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'delete' && (
              <div>
                <h3>Delete Account</h3>
                <p>This action is irreversible. All your data will be permanently deleted.</p>
                <button onClick={handleDeleteAccount} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ContractorProfile;
