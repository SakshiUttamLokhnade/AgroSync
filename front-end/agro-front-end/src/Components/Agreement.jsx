import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import SignatureCanvas from 'react-signature-canvas';
import './styles.css';

const Agreement = () => {
  const location = useLocation();
  const navigate = useNavigate();

  console.log('Agreement component mounted with location state:', location.state);

  const passedState = location.state || {};
  const initialFarmerId = passedState.farmerId;
  const initialContractorId = passedState.contractorId;
  const initialFarmerName = passedState.farmerName || '';
  const initialContractorName = passedState.contractorName || '';
  const initialFarmId = passedState.farmId;

  console.log('Initialized with data:', {
    farmerId: initialFarmerId,
    contractorId: initialContractorId,
    farmId: initialFarmId,
    farmerName: initialFarmerName,
    contractorName: initialContractorName
  });

  const [farmerName, setFarmerName] = useState(initialFarmerName);
  const [contractorName, setContractorName] = useState(initialContractorName);
  const [contractDetails, setContractDetails] = useState('');
  const [amount, setAmount] = useState('');
  const [terms, setTerms] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cropType, setCropType] = useState('');
  const [penaltyClause, setPenaltyClause] = useState('');
  const [renewalOption, setRenewalOption] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreementType, setAgreementType] = useState('');
  const [profitShare, setProfitShare] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [checkedTerms, setCheckedTerms] = useState([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Ref for the signature pad
  const sigPadRef = useRef({});

  // Define the terms for each agreement type at the top of the component
  const landGivingTerms = [
    "Land to be used only for crop production",
    "Profit sharing as per agreed percentage",
    "Land to be returned in original condition",
    "No permanent structures without consent",
    "Advance is non-refundable",
    "Agreement subject to local laws"
  ];
  const landSellingTerms = [
    "Land sold as-is, no warranty",
    "Buyer responsible for registration charges",
    "No encumbrances on land at time of sale",
    "Possession after full payment",
    "Agreement subject to local laws"
  ];

  useEffect(() => {
    console.log('Checking required data:', {
      farmerId: initialFarmerId,
      contractorId: initialContractorId,
      farmId: initialFarmId
    });

    if (!initialFarmerId || !initialContractorId || !initialFarmId) {
      console.log('Missing required data:', {
        farmerId: !initialFarmerId,
        contractorId: !initialContractorId,
        farmId: !initialFarmId
      });
      toast.error("Missing required data to create agreement.");
      navigate(-1);
    }
  }, [initialFarmerId, initialContractorId, initialFarmId, navigate]);

  useEffect(() => {
    console.log('Profit Share changed:', profitShare);
  }, [profitShare]);

  // Function to clear the signature pad
  const clearSignature = () => {
    sigPadRef.current.clear();
  };

  const handleSendProposal = async () => {
    // Validate all required fields
    const missingFields = [];
    if (agreementType !== 'Land Selling' && !contractDetails) missingFields.push('Contract Details');
    if (!amount) missingFields.push('Amount');
    if (!initialFarmerId) missingFields.push('Farmer ID');
    if (!initialContractorId) missingFields.push('Contractor ID');
    if (!initialFarmId) missingFields.push('Farm ID');
    if (!startDate) missingFields.push('Start Date');
    if (!endDate) missingFields.push('End Date');
    if (!agreedToTerms) missingFields.push('Agreement to Terms');
    if (sigPadRef.current.isEmpty()) missingFields.push('Signature');

    if (missingFields.length > 0) {
      toast.error(`Please fill the following fields: ${missingFields.join(', ')}`);
      // Scroll to the first missing field
      const firstMissingField = document.querySelector(`[name="${missingFields[0].toLowerCase().replace(/\s+/g, '')}"]`);
      if (firstMissingField) firstMissingField.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      toast.error('End date must be after start date.');
      return;
    }

    const signatureDataUrl = sigPadRef.current.toDataURL('image/png'); // Get the signature as base64

    const termsToSend = agreementType === 'Land Giving for Crop Production & Profit Sharing' ? landGivingTerms : agreementType === 'Land Selling' ? landSellingTerms : [];

    // Prepare the data to send
    const contractDetailsToSend = agreementType === 'Land Selling' ? 'Land sale agreement' : contractDetails;
    const agreementData = {
      farmId: initialFarmId,
      farmerId: initialFarmerId,
      contractorId: initialContractorId,
      contract_details: contractDetailsToSend,
      amount: parseFloat(amount),
      terms: termsToSend,
      start_date: startDate,
      end_date: endDate,
      status: 'Pending',
      contractor_signature: signatureDataUrl,
      signature: signatureDataUrl,
      payment_method: paymentMethod,
      crop_type: cropType,
      penalty_clause: penaltyClause,
      renewal_option: renewalOption,
      agreement_type: agreementType,
      profit_share: agreementType === 'Land Giving for Crop Production & Profit Sharing' ? profitShare : undefined,
      sale_price: undefined // not used anymore
    };

    console.log('Sending agreement data:', agreementData);
    console.log('API URL:', 'http://localhost:8055/agreements');

    setIsSubmitting(true);
    try {
      console.log('Making API request...');
      const response = await axios.post('http://localhost:8055/agreements', agreementData);
      console.log('API Response:', response.data);
      
      if (response.data.status) {
        // Show success toast with custom styling
        toast.success(
          'Agreement sent successfully! The farmer will be notified.',
          {
            duration: 5000, // Show for 5 seconds
            style: {
              background: '#4CAF50',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold'
            },
            icon: '✅'
          }
        );
        clearSignature(); // Clear signature after successful submission
        // Add a small delay before navigation
        setTimeout(() => {
          navigate(`/contractor/profile/${initialContractorId}`);
        }, 2000);
      } else {
        console.error('API returned error:', response.data);
        toast.error(response.data.message || 'Failed to propose agreement.');
      }
    } catch (error) {
      console.error('Error proposing agreement:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      toast.error(
        error.response?.data?.message || error.message || 'An error occurred while proposing the agreement.',
        {
          duration: 5000,
          style: {
            background: '#f44336',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold'
          }
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePDF = async (type) => {
    if (!farmerName || !contractorName || !contractDetails || !amount || !terms.length) {
      toast.error('Please fill all the fields before generating the agreement.');
      return;
    }

    try {
      const pdfDoc = await PDFDocument.create();
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const page = pdfDoc.addPage([600, 750]);

      let y = 700;
      page.drawText(`Agreement Between:`, { x: 50, y, size: 18 });
      y -= 30;
      page.drawText(`Farmer: ${farmerName}`, { x: 50, y, size: 14 });
      y -= 30;
      page.drawText(`Contractor: ${contractorName}`, { x: 50, y, size: 14 });
      y -= 30;

      page.drawText('Contract Details:', { x: 50, y, size: 14 });
      y -= 20;
      page.drawText(contractDetails, { x: 50, y, size: 12 });
      y -= 40;

      page.drawText('Amount:', { x: 50, y, size: 14 });
      y -= 20;
      page.drawText(`INR ${amount}`, { x: 50, y, size: 12 });
      y -= 40;

      page.drawText('Terms:', { x: 50, y, size: 14 });
      y -= 20;
      terms.forEach(term => {
        page.drawText(term, { x: 50, y, size: 12 });
        y -= 18;
      });
      y -= 20;

      y -= 30;
      if (type === 'farmer') {
        page.drawText('This copy is for the Farmer.', { x: 50, y, size: 12, color: rgb(0, 0.6, 0) });
        y -= 20;
        page.drawText('Farmer Signature: ______________________', { x: 50, y, size: 12 });
      } else if (type === 'contractor') {
        page.drawText('This copy is for the Contractor.', { x: 50, y, size: 12, color: rgb(0.2, 0.2, 0.8) });
        y -= 20;
        page.drawText('Contractor Signature: ______________________', { x: 50, y, size: 12 });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `${type}_agreement_${farmerName.replace(/\s+/g, '_')}_${contractorName.replace(/\s+/g, '_')}.pdf`);

      toast.success(`Agreement PDF for ${type} generated successfully!`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error('Failed to generate the agreement PDF.');
    }
  };

  return (
    <div className="agreement-container">
      <Toaster position="top-right" />
      <div className="form-wrapper">
        <h2>Create Agreement Between Farmer and Contractor</h2>

        <div className="form-container">
          <div className="form-group">
            <label>Farmer Name</label>
            <input
              type="text"
              value={farmerName}
              readOnly
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Contractor Name</label>
            <input
              type="text"
              value={contractorName}
              readOnly
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>Agreement Type</label>
            <select
              value={agreementType}
              onChange={e => {
                setAgreementType(e.target.value);
                setProfitShare('');
                setSalePrice('');
              }}
              className="form-control"
            >
              <option value="">Select agreement type...</option>
              <option value="Land Giving for Crop Production & Profit Sharing">Land Giving for Crop Production & Profit Sharing</option>
              <option value="Land Selling">Land Selling</option>
            </select>
          </div>

          {agreementType === 'Land Giving for Crop Production & Profit Sharing' && (
            <div className="form-group">
              <label>Profit Share (%)</label>
              <input
                type="number"
                value={profitShare}
                onChange={e => setProfitShare(e.target.value)}
                className="form-control"
                placeholder="Enter profit share percentage..."
                min="0"
                max="100"
              />
            </div>
          )}

          {/* Contract Details */}
          {agreementType !== 'Land Selling' && (
            <div className="form-group">
              <label htmlFor="contractDetails">Contract Details:</label>
              <textarea
                id="contractDetails"
                name="contractDetails"
                value={contractDetails}
                onChange={(e) => setContractDetails(e.target.value)}
                required
                placeholder="Enter contract details"
              />
            </div>
          )}

          {agreementType === 'Land Giving for Crop Production & Profit Sharing' && (
            <div className="form-group">
              <label>Advance Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-control"
                placeholder="Enter advance amount..."
              />
            </div>
          )}

          <div className="form-group">
            <label>{agreementType === 'Land Giving for Crop Production & Profit Sharing' ? 'Advance Amount (₹)' : agreementType === 'Land Selling' ? 'Amount per acre (₹)' : 'Amount (₹)'}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-control"
              placeholder={agreementType === 'Land Giving for Crop Production & Profit Sharing' ? 'Enter advance amount...' : agreementType === 'Land Selling' ? 'Enter amount per acre...' : 'Enter amount...'}
            />
          </div>

          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-control"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-control"
              min={startDate || new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label>Terms:</label>
            <ul style={{ margin: '8px 0 8px 18px' }}>
              {(agreementType === 'Land Giving for Crop Production & Profit Sharing' ? landGivingTerms : agreementType === 'Land Selling' ? landSellingTerms : []).map((term, idx) => (
                <li key={idx}>{term}</li>
              ))}
            </ul>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
              />
              I agree to all the terms listed above
            </label>
          </div>

          <div className="form-group">
            <label>Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="form-control"
            >
              <option value="">Select payment method...</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Installments">Installments</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {agreementType !== 'Land Selling' && (
            <>
              <div className="form-group">
                <label>Crop Type</label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="form-control"
                >
                  <option value="">Select crop type...</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Rice">Rice</option>
                  <option value="Maize">Maize</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Penalty Clause</label>
                <select
                  value={penaltyClause}
                  onChange={(e) => setPenaltyClause(e.target.value)}
                  className="form-control"
                >
                  <option value="">Select penalty clause...</option>
                  <option value="1% per day delay">1% per day delay</option>
                  <option value="Fixed penalty for breach">Fixed penalty for breach</option>
                  <option value="No penalty">No penalty</option>
                  <option value="Negotiable">Negotiable</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Renewal Option</label>
                <select
                  value={renewalOption}
                  onChange={(e) => setRenewalOption(e.target.value)}
                  className="form-control"
                >
                  <option value="">Select renewal option...</option>
                  <option value="Automatic renewal">Automatic renewal</option>
                  <option value="Renewal on mutual consent">Renewal on mutual consent</option>
                  <option value="No renewal">No renewal</option>
                  <option value="Annual renewal">Annual renewal</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Your Signature</label>
            <div className="signature-pad">
              <SignatureCanvas
                ref={sigPadRef}
                canvasProps={{
                  className: 'signature-canvas',
                  width: 500,
                  height: 200
                }}
              />
              <button onClick={clearSignature} className="clear-signature">
                Clear Signature
              </button>
            </div>
          </div>

          <div className="button-group">
            <button
              onClick={handleSendProposal}
              disabled={isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? 'Sending...' : 'Send Proposal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agreement;