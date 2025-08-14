import './styles.css';

export default function About() {
  return (
    <div className="about-container">
      <h2>About AgroSync</h2>
      <div className="about-content">
        <div className="about-card">
          <h3>Our Mission</h3>
          <p>AgroSync is a platform connecting farmers and contractors through secure, transparent agreements. Our mission is to modernize agricultural contracts and ensure fair deals for all parties.</p>
        </div>
        <div className="about-card">
          <h3>How It Works</h3>
          <p>Farmers can list their available land and crops, while contractors can browse and make offers. Our system ensures all agreements are legally binding and transparent.</p>
        </div>
        <div className="about-card">
          <h3>Our Team</h3>
          <p>We are a group of agricultural experts and technologists committed to improving the farming ecosystem through digital innovation.</p>
        </div>
      </div>
    </div>
  );
}