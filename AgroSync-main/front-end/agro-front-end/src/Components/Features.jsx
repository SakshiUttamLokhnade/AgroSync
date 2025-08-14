import './styles.css';

export default function Features() {
  return (
    <div className="features-container">
      <h2>Platform Features</h2>
      <div className="features-grid">
        <div className="feature-card">
          <h3>Digital Agreement Management</h3>
          <p>Create, send, and manage farm contract agreements between farmers and contractors with ease.</p>
        </div>
        <div className="feature-card">
          <h3>E-Signatures</h3>
          <p>Both parties can digitally sign agreements using a secure signature pad, ensuring authenticity.</p>
        </div>
        <div className="feature-card">
          <h3>PDF Generation</h3>
          <p>Download professional, signed PDF copies of agreements for your records at any time.</p>
        </div>
        <div className="feature-card">
          <h3>Profile Management</h3>
          <p>Dedicated dashboards for both farmers and contractors to view, track, and manage their agreements and personal details.</p>
        </div>
        <div className="feature-card">
          <h3>Agreement Status Tracking</h3>
          <p>Monitor the status of each agreement (Pending, Accepted, Rejected) and receive real-time updates.</p>
        </div>
        <div className="feature-card">
          <h3>Secure Communication</h3>
          <p>Contact and message between farmers and contractors is protected and private.</p>
        </div>
      </div>
    </div>
  );
}