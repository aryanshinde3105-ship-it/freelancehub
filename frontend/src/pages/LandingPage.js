import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Find Perfect <span className="highlight">Freelancers</span> for Your Projects
              </h1>
              <p className="hero-subtitle">
                Connect with talented professionals worldwide. Post projects, 
                receive proposals, and collaborate seamlessly with milestone-based payments.
              </p>
              <div className="hero-buttons">
                <Link to="/signup" className="btn-primary btn-large">
                  <img src="/assets/icons/rocket.png" alt="" width="24" />
                  Get Started Free
                </Link>
                <Link to="/browse-projects" className="btn-secondary btn-large">
                  <img src="/assets/icons/globe.png" alt="" width="24" />
                  Browse Projects
                </Link>
              </div>
              <div className="hero-stats">
                <div className="stat-item">
                  <strong></strong>
                  <span></span>
                </div>
                <div className="stat-item">
                  <strong></strong>
                  <span></span>
                </div>
                <div className="stat-item">
                  <strong></strong>
                  <span></span>
                </div>
              </div>
            </div>
            <div className="hero-image">
              <img 
                src="/assets/illustrations/hero-freelance.png" 
                alt="Freelance work illustration" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose FreelanceHub?</h2>
            <p>Everything you need to succeed as a freelancer or client</p>
          </div>
          
          <div className="features-grid">
            <FeatureCard 
              icon="/assets/icons/shield.png"
              title="Secure Payments"
              description="Escrow system protects both clients and freelancers. Money held safely until work is approved."
            />
            <FeatureCard 
              icon="/assets/icons/money.png"
              title="Milestone-Based"
              description="Break projects into milestones. Pay as you go and track progress in real-time."
            />
            <FeatureCard 
              icon="/assets/icons/checkmark.png"
              title="Verified Freelancers"
              description="Work with trusted professionals. Review ratings, portfolios, and past work."
            />
            <FeatureCard 
              icon="/assets/icons/chat.png"
              title="Real-Time Chat"
              description="Communicate instantly with clients and freelancers. File sharing included."
            />
            <FeatureCard 
              icon="/assets/icons/analytics.png"
              title="Project Tracking"
              description="Monitor progress with detailed analytics and milestone completion tracking."
            />
            <FeatureCard 
              icon="/assets/icons/star.png"
              title="Quality Assurance"
              description="Rating system ensures high-quality work. Request revisions if needed."
            />
            <FeatureCard 
              icon="/assets/icons/globe.png"
              title="Global Reach"
              description="Connect with talent worldwide. Work across time zones seamlessly."
            />
            <FeatureCard 
              icon="/assets/icons/rocket.png"
              title="Fast & Easy"
              description="Post a project in minutes. Start receiving proposals within hours."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Get started in 4 simple steps</p>
          </div>

          <div className="steps-grid">
            <StepCard 
              number="1"
              illustration="/assets/illustrations/post-project.png"
              title="Post Your Project"
              description="Describe your project requirements, set your budget, and create milestones for better management."
            />
            <StepCard 
              number="2"
              illustration="/assets/illustrations/collaborate.png"
              title="Review Proposals"
              description="Receive proposals from qualified freelancers. Compare rates, reviews, and portfolios."
            />
            <StepCard 
              number="3"
              illustration="/assets/illustrations/collaborate.png"
              title="Work Together"
              description="Collaborate using our platform tools. Track progress and communicate in real-time."
            />
            <StepCard 
              number="4"
              illustration="/assets/illustrations/success.png"
              title="Get Results"
              description="Receive quality work on time. Release milestone payments when satisfied."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <div className="cta-text">
              <h2>Ready to Get Started?</h2>
              <p>Join thousands of successful freelancers and clients today</p>
              <div className="cta-buttons">
                <Link to="/signup" className="btn-primary btn-large">
                  Create Free Account
                </Link>
                <Link to="/login" className="btn-secondary-outline btn-large">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="cta-image">
              <img 
                src="/assets/illustrations/success.png" 
                alt="Join FreelanceHub" 
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Reusable Components
function FeatureCard({ icon, title, description }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">
        <img src={icon} alt={title} width="64" height="64" />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function StepCard({ number, illustration, title, description }) {
  return (
    <div className="step-card">
      <div className="step-number">{number}</div>
      <div className="step-illustration">
        <img src={illustration} alt={title} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export default LandingPage;
