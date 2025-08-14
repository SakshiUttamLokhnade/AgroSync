import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import "./styles.css";
import SignatureCanvas from 'react-signature-canvas';
import AvailableContractors from './AvailableContractors';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';

const buttonStyles = {
    accept: {
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginRight: '10px',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        '&:hover': {
            backgroundColor: '#45a049',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }
    },
    reject: {
        backgroundColor: '#f44336',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginRight: '10px',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        '&:hover': {
            backgroundColor: '#da190b',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }
    },
    cancel: {
        backgroundColor: '#2196F3',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        '&:hover': {
            backgroundColor: '#1976D2',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }
    }
};

const Modal = ({ children, onClose }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <button onClick={onClose} className="modal-close-btn">X</button>
        {children}
      </div>
    </div>
  );
};

const FarmerProfile = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { farmerId } = useParams();

  const [farms, setFarms] = useState([]);
  const [farmFormData, setFarmFormData] = useState({});
  const [isEditingFarm, setIsEditingFarm] = useState(false);
  const [editFarmId, setEditFarmId] = useState(null);

  const [agreements, setAgreements] = useState([]);
  const [loadingAgreements, setLoadingAgreements] = useState(false);
  const [signingAgreement, setSigningAgreement] = useState(null);
  const farmerSigPadRef = useRef({});

  useEffect(() => {
    if (!farmerId) {
      toast.error("Invalid farmer ID");
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        console.log("Fetching profile for farmer ID:", farmerId);
        const response = await axios.get(
          `http://localhost:8055/farmer/profile/${farmerId}`
        );

        if (!response.data || !response.data.status) {
          throw new Error("Invalid response from server");
        }

        setProfile(response.data.data);
        setEditForm(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error(
          error.response?.data?.message || "Error loading profile"
        );
        setLoading(false);
      }
    };

    fetchProfile();
  }, [farmerId, navigate]);

  useEffect(() => {
    if (activeTab === "registeredFarm" && farmerId) {
      fetchFarms();
    }
    if (activeTab === "agreements" && farmerId) {
      fetchAgreements();
    }
  }, [activeTab, farmerId]);

  useEffect(() => {
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

  const fetchFarms = async () => {
    if (!farmerId) return;
    try {
      const res = await axios.get(`http://localhost:8055/${farmerId}`);
      setFarms(res.data);
    } catch (error) {
        console.error("Failed to fetch farms:", error);
      toast.error('Failed to fetch farms');
    }
  };

  const handleFarmInputChange = (e) => {
    const { name, value } = e.target;
    setFarmFormData({ ...farmFormData, [name]: value });
  };

  const handleAddFarm = async () => {
    if (!farmerId) {
        toast.error("Cannot add farm without a valid farmer ID.");
        return;
    }
    try {
      await axios.post('http://localhost:8055/add', {
        ...farmFormData,
        userId: farmerId,
      });
      toast.success('Farm added');
      setFarmFormData({});
      fetchFarms();
    } catch (error) {
        console.error("Failed to add farm:", error);
      toast.error('Failed to add farm');
    }
  };

  const handleEditFarm = async () => {
      if (!editFarmId) return;
    try {
      await axios.put(`http://localhost:8055/${editFarmId}`, farmFormData);
      toast.success('Farm updated');
      setFarmFormData({});
      setIsEditingFarm(false);
      setEditFarmId(null);
      fetchFarms();
    } catch (error) {
        console.error("Failed to update farm:", error);
      toast.error('Failed to update farm');
    }
  };

  const handleDeleteFarm = async (id) => {
    if (window.confirm('Delete this farm?')) {
      try {
        await axios.delete(`http://localhost:8055/${id}`);
        toast.success('Farm deleted');
        fetchFarms();
        if (editFarmId === id) {
            setFarmFormData({});
            setIsEditingFarm(false);
            setEditFarmId(null);
        }
      } catch (error) {
          console.error("Failed to delete farm:", error);
        toast.error('Failed to delete farm');
      }
    }
  };

  const handleEditClick = (farm) => {
    const idToEdit = farm.id ?? farm.farm_id;
    if (!idToEdit) {
        toast.error("Farm ID is missing, cannot edit.");
        return;
    }
    setFarmFormData({
        soilType: farm.soilType || '',
        waterSource: farm.waterSource || '',
        landArea: farm.landArea || '',
        locationAddress: farm.locationAddress || '',
        pincode: farm.pincode || '',
        preferredCrops: farm.preferredCrops || '',
    });
    setEditFarmId(idToEdit);
    setIsEditingFarm(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axios.put(
        `http://localhost:8055/farmer/profile/${farmerId}`,
        editForm
      );
      setProfile(editForm);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8055/farmer/profile/${farmerId}`);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      toast.success("Account deleted successfully");
      navigate("/register");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error.response?.data?.message || "Failed to delete account");
    }
  };

  const fetchAgreements = async () => {
    if (!farmerId) return;
    setLoadingAgreements(true);
    try {
      const response = await axios.get(`http://localhost:8055/agreements/user/${farmerId}`);
      if (response.data.status) {
        setAgreements(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to fetch agreements.");
        setAgreements([]);
      }
    } catch (error) {
      console.error("Error fetching agreements:", error);
      toast.error(error.response?.data?.message || "Could not fetch agreements.");
      setAgreements([]);
    } finally {
      setLoadingAgreements(false);
    }
  };

  const handleOpenSignatureModal = (agreement) => {
    console.log('Opening signature modal for agreement:', agreement);
    if (!agreement || (!agreement.id && !agreement.agreementId)) {
        console.error('Invalid agreement data:', agreement);
        toast.error("Invalid agreement data");
        return;
    }
    setSigningAgreement(agreement);
  };

  const handleCloseSignatureModal = () => {
    setSigningAgreement(null);
    if (farmerSigPadRef.current?.clear) {
        farmerSigPadRef.current.clear();
    }
  };

  const handleUpdateAgreementStatus = async (agreementId, status) => {
    console.log('Updating agreement status:', { agreementId, status });
    console.log('Current agreement data:', signingAgreement);
    console.log('Current farmer ID:', farmerId);

    if (!agreementId) {
        toast.error("Missing agreement ID");
        return;
    }

    let signatureDataUrl = null;

    if (status === 'Accepted') {
        if (!farmerSigPadRef.current || farmerSigPadRef.current.isEmpty()) {
            toast.error('Please provide your signature to accept.');
            return;
        }
        try {
            // Get the canvas element
            const canvas = farmerSigPadRef.current.getCanvas();
            if (!canvas) {
                toast.error('Could not get signature canvas');
                return;
            }
            // Convert canvas to data URL
            signatureDataUrl = canvas.toDataURL('image/png');
        } catch (error) {
            console.error('Error getting signature:', error);
            toast.error('Error capturing signature');
            return;
        }
    }

    if (!farmerId) {
        toast.error("Missing farmer ID");
        return;
    }

    try {
        // Prepare the payload with only the required fields
        const payload = {
            status: status,
            userId: parseInt(farmerId),
            signature: signatureDataUrl || null  // Send null if no signature
        };

        console.log('Sending agreement update request:', {
            url: `http://localhost:8055/agreements/${agreementId}/status`,
            payload,
            farmerId: parseInt(farmerId),
            agreementId: parseInt(agreementId)
        });

        const response = await axios.put(`http://localhost:8055/agreements/${agreementId}/status`, payload);

        console.log('Server response:', response.data);

        if (response.data.status) {
            toast.success(`Agreement ${status.toLowerCase()} successfully!`);
            handleCloseSignatureModal();
            fetchAgreements();
        } else {
            const errorMessage = response.data.message || `Failed to ${status.toLowerCase()} agreement.`;
            console.error('Server returned error:', errorMessage);
            toast.error(errorMessage);
        }
    } catch (error) {
        console.error('Error updating agreement status:', {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status,
            agreementId,
            status,
            farmerId: parseInt(farmerId)
        });
        
        const errorMessage = error.response?.data?.message 
            || error.message 
            || `Could not ${status.toLowerCase()} agreement.`;
        toast.error(errorMessage);
    }
  };

  const handleRejectAgreement = async (agreementId) => {
    if (!agreementId) {
        toast.error("Missing agreement ID");
        return;
    }

    if (!farmerId) {
        toast.error("Missing farmer ID");
        return;
    }

    try {
        const payload = {
            status: 'Rejected',
            userId: parseInt(farmerId),
            agreementId: parseInt(agreementId)
        };

        console.log('Sending agreement rejection request:', {
            url: `http://localhost:8055/agreements/${agreementId}/status`,
            payload,
            farmerId: parseInt(farmerId),
            agreementId: parseInt(agreementId)
        });

        const response = await axios.put(`http://localhost:8055/agreements/${agreementId}/status`, payload);

        if (response.data.status) {
            toast.success("Agreement rejected successfully!");
            fetchAgreements();
        } else {
            const errorMessage = response.data.message || "Failed to reject agreement.";
            console.error('Server returned error:', errorMessage);
            toast.error(errorMessage);
        }
    } catch (error) {
        console.error('Error rejecting agreement:', {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status,
            agreementId,
            farmerId: parseInt(farmerId)
        });
        
        const errorMessage = error.response?.data?.message 
            || error.message 
            || "Could not reject agreement.";
        toast.error(errorMessage);
    }
  };

  const clearFarmerSignature = () => {
      if (farmerSigPadRef.current?.clear) {
         farmerSigPadRef.current.clear();
      }
  };

  // PDF generation function
  const handleDownloadAgreementPDF = async (agreement) => {
    try {
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
      // Agreements
      page.drawText('Agreement Type:', { x: 50, y, size: 13, font: helveticaBold });
      page.drawText(` ${agreement.agreement_type || ''}`, { x: 200, y, size: 13, font: helvetica });
      y -= 20;
      if (agreement.profit_share) { page.drawText('Profit Share (%):', { x: 50, y, size: 13, font: helveticaBold }); page.drawText(` ${agreement.profit_share}`, { x: 200, y, size: 13, font: helvetica }); y -= 20; }
      if (agreement.sale_price) { page.drawText('Sale Price (Rs.):', { x: 50, y, size: 13, font: helveticaBold }); page.drawText(` ${agreement.sale_price}`, { x: 200, y, size: 13, font: helvetica }); y -= 20; }
      if (agreement.payment_method) { page.drawText('Payment Method:', { x: 50, y, size: 13, font: helveticaBold }); page.drawText(` ${agreement.payment_method}`, { x: 200, y, size: 13, font: helvetica }); y -= 20; }
      if (agreement.crop_type) { page.drawText('Crop Type:', { x: 50, y, size: 13, font: helveticaBold }); page.drawText(` ${agreement.crop_type}`, { x: 200, y, size: 13, font: helvetica }); y -= 20; }
      if (agreement.penalty_clause) { page.drawText('Penalty Clause:', { x: 50, y, size: 13, font: helveticaBold }); page.drawText(` ${agreement.penalty_clause}`, { x: 200, y, size: 13, font: helvetica }); y -= 20; }
      if (agreement.renewal_option) { page.drawText('Renewal Option:', { x: 50, y, size: 13, font: helveticaBold }); page.drawText(` ${agreement.renewal_option}`, { x: 200, y, size: 13, font: helvetica }); y -= 20; }
      if (agreement.amount) { page.drawText('Advance Amount (Rs.):', { x: 50, y, size: 13, font: helveticaBold }); page.drawText(` ${agreement.amount}`, { x: 200, y, size: 13, font: helvetica }); y -= 20; }
      // Robust terms parsing
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
        y -= 10;
        page.drawText('Terms:', { x: 50, y, size: 13, font: helveticaBold });
        y -= 18;
        termsArr.forEach(term => {
          page.drawText(`• ${term}`, { x: 70, y, size: 12, font: helvetica });
          y -= 16;
        });
        y -= 10;
      }
      // Signatures
      page.drawText('Signatures:', { x: 50, y, size: 15, color: rgb(0.2, 0.2, 0.2), font: helveticaBold });
      y -= 20;
      // Contractor signature
      page.drawText('Contractor:', { x: 60, y, size: 13, font: helveticaBold });
      if (agreement.contractor_signature) {
        try {
          const contractorSigBase64 = agreement.contractor_signature.replace(/^data:image\/(png|jpeg);base64,/, '');
          const contractorSigBytes = Uint8Array.from(atob(contractorSigBase64), c => c.charCodeAt(0));
          const contractorSigImage = await pdfDoc.embedPng(contractorSigBytes);
          page.drawImage(contractorSigImage, { x: 140, y: y - 10, width: 120, height: 40 });
        } catch (e) {
          page.drawText('Not signed', { x: 140, y, size: 12, color: rgb(1,0,0), font: helvetica });
        }
      } else {
        page.drawText('Not signed', { x: 140, y, size: 12, color: rgb(1,0,0), font: helvetica });
      }
      y -= 50;
      page.drawText('Farmer:', { x: 60, y, size: 13, font: helveticaBold });
      if (agreement.farmer_signature) {
        try {
          const farmerSigBase64 = agreement.farmer_signature.replace(/^data:image\/(png|jpeg);base64,/, '');
          const farmerSigBytes = Uint8Array.from(atob(farmerSigBase64), c => c.charCodeAt(0));
          const farmerSigImage = await pdfDoc.embedPng(farmerSigBytes);
          page.drawImage(farmerSigImage, { x: 140, y: y - 10, width: 120, height: 40 });
        } catch (e) {
          page.drawText('Not signed', { x: 140, y, size: 12, color: rgb(1,0,0), font: helvetica });
        }
      } else {
        page.drawText('Not signed', { x: 140, y, size: 12, color: rgb(1,0,0), font: helvetica });
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `agreement_${agreement.agreementId}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) return <div className="loading">Loading Profile...</div>;
  if (!profile && !loading) return <div className="error">Failed to load profile data. Please try again later or contact support.</div>;

  const renderAgreementItem = (agreement, actions = null) => {
    // Get the agreement ID from agreementId field
    const agreementId = agreement.agreementId;
    if (!agreementId) {
        console.error('Invalid agreement data:', agreement);
        return null;
    }
    
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

    return (
        <div key={`agreement-${agreementId}`} className="agreement-item" style={{ border: '2px solid #000', padding: '15px', marginBottom: '18px', borderRadius: '5px', background: '#fff' }}>
            <p><strong>Agreement ID:</strong> {agreementId}</p>
            <p><strong>Contractor:</strong> {agreement.contractorName || 'N/A'}</p>
            <p><strong>Status:</strong> <span className={`status-${agreement.status?.toLowerCase()}`}>{agreement.status || 'N/A'}</span></p>
            <p><strong>Proposed On:</strong> {new Date(agreement.created_at).toLocaleString()}</p>
            <p><strong>Agreement Type:</strong> {agreement.agreement_type || 'N/A'}</p>
            {agreement.profit_share && <p><strong>Profit Share (%):</strong> {agreement.profit_share}</p>}
            {agreement.sale_price && <p><strong>Sale Price (Rs.):</strong> {agreement.sale_price}</p>}
            {agreement.payment_method && <p><strong>Payment Method:</strong> {agreement.payment_method}</p>}
            {agreement.crop_type && <p><strong>Crop Type:</strong> {agreement.crop_type}</p>}
            {agreement.penalty_clause && <p><strong>Penalty Clause:</strong> {agreement.penalty_clause}</p>}
            {agreement.renewal_option && <p><strong>Renewal Option:</strong> {agreement.renewal_option}</p>}
            {agreement.amount && <p><strong>Advance Amount (Rs.):</strong> {agreement.amount}</p>}
            <p><strong>Terms:</strong></p>
            <ul>
              {termsArr.length > 0 ? (
                termsArr.map((term, idx) => (
                  <li key={idx}>{term}</li>
                ))
              ) : (
                <li style={{color: '#888'}}>No terms specified</li>
              )}
            </ul>
            {agreement.contractor_signature && (
                <div key={`contractor-sig-${agreementId}`}>
                    <strong>Contractor Signature:</strong><br/>
                    <img src={agreement.contractor_signature} alt="Contractor Signature" style={{border: '1px solid #ccc', maxHeight: '100px', marginTop: '5px'}} />
                </div>
            )}
            {agreement.farmer_signature && (
                <div key={`farmer-sig-${agreementId}`} style={{marginTop: '10px'}}>
                    <strong>Your Signature:</strong><br/>
                    <img src={agreement.farmer_signature} alt="Farmer Signature" style={{border: '1px solid #ccc', maxHeight: '100px', marginTop: '5px'}} />
                </div>
            )}
            {/* Download PDF button for accepted agreements */}
            {agreement.status === 'Accepted' && (
              <button onClick={() => handleDownloadAgreementPDF(agreement)} style={{marginTop: '10px', background: '#222', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer'}}>Download PDF</button>
            )}
            {actions && <div key={`actions-${agreementId}`} className="agreement-actions" style={{ marginTop: '10px' }}>{actions}</div>}
        </div>
    );
  };

  return (
    <div className="farmer-dashboard">
      <Toaster position="top-right" />
      <div className="sidebar">
        <h2>AgroSync</h2>
        <p>{profile?.fullName || "Farmer"}</p>
        <div className="sidebar-menu">
          <button onClick={() => setActiveTab("dashboard")} disabled={loading}>
            Dashboard
          </button>
          <button onClick={() => setActiveTab("profile")} disabled={loading || !profile}>
            Profile
          </button>
          <button onClick={() => setActiveTab("registeredFarm")} disabled={loading || !profile}>
            Registered Farm
          </button>
          <button onClick={() => setActiveTab("agreements")} disabled={loading || !profile}>
            Agreements
          </button>
          <button onClick={handleLogout} disabled={loading}>
            Logout
          </button>
        </div>
      </div>
      <div className="main-content">
        {activeTab === "dashboard" && profile && (
          <div>
            <h3>Available Contractors</h3>
            <AvailableContractors />
          </div>
        )}
        {activeTab === "profile" && profile && (
          <div>
            <h3>My Profile</h3>
            <div className="detail-section">
              <p><strong>Full Name:</strong> {profile.fullName}</p>
              <p><strong>Contact:</strong> {profile.contact}</p>
              <p><strong>Soil Type:</strong> {profile.soilType || "Not specified"}</p>
              <p><strong>Water Source:</strong> {profile.waterSource || "Not specified"}</p>
              <p><strong>Land Area:</strong> {profile.landArea || "Not specified"} acres</p>
              <p><strong>Location:</strong> {profile.locationAddress || "Not specified"}</p>
              <p><strong>Pincode:</strong> {profile.pincode || "Not specified"}</p>
              <p><strong>Preferred Crops:</strong> {profile.preferredCrops || "Not specified"}</p>
            </div>
            <h3>Edit Profile</h3>
            <form onSubmit={handleSaveProfile}>
              <input
                name="fullName"
                value={editForm.fullName || ""}
                onChange={handleInputChange}
                placeholder="Full Name"
                disabled={isSaving}
              />
              <input
                name="contact"
                value={editForm.contact || ""}
                onChange={handleInputChange}
                placeholder="Contact"
                disabled={isSaving}
              />
              <input
                name="soilType"
                value={editForm.soilType || ""}
                onChange={handleInputChange}
                placeholder="Soil Type"
                disabled={isSaving}
              />
              <input
                name="waterSource"
                value={editForm.waterSource || ""}
                onChange={handleInputChange}
                placeholder="Water Source"
                disabled={isSaving}
              />
              <input
                name="landArea"
                value={editForm.landArea || ""}
                onChange={handleInputChange}
                placeholder="Land Area (acres)"
                disabled={isSaving}
              />
              <input
                name="preferredCrops"
                value={editForm.preferredCrops || ""}
                onChange={handleInputChange}
                placeholder="Preferred Crops"
                disabled={isSaving}
              />
              <input
                name="locationAddress"
                value={editForm.locationAddress || ""}
                onChange={handleInputChange}
                placeholder="Location Address"
                disabled={isSaving}
              />
              <input
                name="pincode"
                value={editForm.pincode || ""}
                onChange={handleInputChange}
                placeholder="Pincode"
                disabled={isSaving}
              />
              <button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
            <h3>Delete Account</h3>
            <p>This action is irreversible. All your data will be permanently deleted.</p>
            <button onClick={handleDeleteAccount} className="delete-button">
              Confirm Delete
            </button>
          </div>
        )}
        {activeTab === "registeredFarm" && profile && (
          <div>
            <h3>Registered Farms</h3>
            <div className="farm-form" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
              <h4>{isEditingFarm ? "Edit Farm" : "Add New Farm"}</h4>
              <input name="soilType" placeholder="Soil Type" value={farmFormData.soilType || ''} onChange={handleFarmInputChange} />
              <input name="waterSource" placeholder="Water Source" value={farmFormData.waterSource || ''} onChange={handleFarmInputChange} />
              <input name="landArea" placeholder="Land Area (acres)" value={farmFormData.landArea || ''} onChange={handleFarmInputChange} />
              <input name="locationAddress" placeholder="Location Address" value={farmFormData.locationAddress || ''} onChange={handleFarmInputChange} />
              <input name="pincode" placeholder="Pincode" value={farmFormData.pincode || ''} onChange={handleFarmInputChange} />
              <input name="preferredCrops" placeholder="Preferred Crops" value={farmFormData.preferredCrops || ''} onChange={handleFarmInputChange} />
              {isEditingFarm ? (
                <>
                  <button onClick={handleEditFarm}>Update Farm</button>
                  <button onClick={() => { setIsEditingFarm(false); setFarmFormData({}); setEditFarmId(null); }} style={{ marginLeft: '10px' }}>Cancel Edit</button>
                </>
              ) : (
                <button onClick={handleAddFarm}>Add Farm</button>
              )}
            </div>
            <div className="farm-list">
             <h4>Your Farms</h4>
              {farms.length === 0 ? (
                <p>No additional farms registered yet. Add one using the form above.</p>
              ) : (
                farms.map((farm) => (
                  <div key={farm.id ?? farm.farm_id} className="farm-item" style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
                    <p><strong>Soil Type:</strong> {farm.soilType || 'N/A'}</p>
                    <p><strong>Water Source:</strong> {farm.waterSource || 'N/A'}</p>
                    <p><strong>Land Area:</strong> {farm.landArea || 'N/A'} acres</p>
                    <p><strong>Location:</strong> {farm.locationAddress || 'N/A'}</p>
                    <p><strong>Pincode:</strong> {farm.pincode || 'N/A'}</p>
                    <p><strong>Preferred Crops:</strong> {farm.preferredCrops || 'N/A'}</p>
                    <button onClick={() => handleEditClick(farm)}>Edit</button>
                    <button onClick={() => handleDeleteFarm(farm.id ?? farm.farm_id)} style={{ marginLeft: '10px' }}>Delete</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {activeTab === "agreements" && profile && (
          <div>
            <h3 style={{marginBottom: '24px'}}>Agreements</h3>
            {loadingAgreements ? (
              <p>Loading agreements...</p>
            ) : agreements.length === 0 ? (
              <p>No agreements found.</p>
            ) : (
              (() => {
                const pending = agreements.filter(ag => ag.status === 'Pending' && ag.farmerId === profile.userId);
                const accepted = agreements.filter(ag => ag.status === 'Accepted');
                const rejected = agreements.filter(ag => ag.status === 'Rejected');
                if (pending.length > 0) {
                  return (
                    <>
                      <h4 style={{color: '#ff9800', marginBottom: '16px'}}>Pending Your Approval ({pending.length})</h4>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '18px'}}>
                        {pending.map(ag => {
                          const agreementId = ag.agreementId;
                          if (!agreementId) return null;
                          return renderAgreementItem(ag, 
                            <div key={`actions-${agreementId}`} className="agreement-actions">
                              <button 
                                onClick={() => handleOpenSignatureModal(ag)}
                                className="approve-btn"
                                style={buttonStyles.accept}
                              >
                                Accept
                              </button>
                              <button 
                                onClick={() => handleRejectAgreement(agreementId)}
                                className="reject-btn"
                                style={buttonStyles.reject}
                              >
                                Reject
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                } else {
                  return (
                    <>
                      <h4 style={{color: '#4CAF50', marginBottom: '16px'}}>Accepted Agreements ({accepted.length})</h4>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '18px'}}>
                        {accepted.length === 0 ? <p style={{color: '#888'}}>No accepted agreements.</p> :
                          accepted.map(ag => ag.agreementId && renderAgreementItem(ag))}
                      </div>
                      <h4 style={{color: '#f44336', margin: '32px 0 16px'}}>Rejected Agreements ({rejected.length})</h4>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '18px'}}>
                        {rejected.length === 0 ? <p style={{color: '#888'}}>No rejected agreements.</p> :
                          rejected.map(ag => ag.agreementId && renderAgreementItem(ag))}
                      </div>
                    </>
                  );
                }
              })()
            )}
            {signingAgreement && signingAgreement.agreementId && (
              <Modal onClose={handleCloseSignatureModal}>
                <div>
                  <h3>Sign Agreement</h3>
                  <p>Please sign below to accept the agreement:</p>
                  <div style={{ border: '1px solid #ccc', borderRadius: '4px' }}>
                    <SignatureCanvas
                      ref={farmerSigPadRef}
                      canvasProps={{
                        className: 'signature-canvas',
                        width: 500,
                        height: 200,
                        style: { border: '1px solid #ccc' }
                      }}
                    />
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <button 
                      onClick={clearFarmerSignature}
                      style={{...buttonStyles.cancel, marginRight: '10px'}}>
                      Clear
                    </button>
                    <button 
                      onClick={() => handleUpdateAgreementStatus(signingAgreement.agreementId, 'Accepted')}
                      style={{...buttonStyles.accept, marginRight: '10px'}}>
                      Submit
                    </button>
                    <button 
                      onClick={handleCloseSignatureModal}
                      style={buttonStyles.cancel}>
                      Cancel
                    </button>
                  </div>
                </div>
              </Modal>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerProfile;