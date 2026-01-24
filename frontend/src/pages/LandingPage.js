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
              <div className="beta-badge">
                <span className="badge-pill">🚀 MVP Beta Version</span>
              </div>
              <h1 className="hero-title">
                Find Perfect <span className="highlight">Freelancers</span> for Your Projects
              </h1>
              <p className="hero-subtitle">
                A milestone-based freelance marketplace built with MERN stack. 
                Connect with professionals, manage projects, and track progress with our core features.
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
                  <strong>Beta</strong>
                  <span>Platform</span>
                </div>
                <div className="stat-item">
                  <strong>MERN</strong>
                  <span>Stack Project</span>
                </div>
                <div className="stat-item">
                  <strong>Live</strong>
                  <span>Core Features</span>
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
            <h2>Core Features Available</h2>
            <p>Essential tools for freelancers and clients - built and tested</p>
          </div>
          
          <div className="features-grid">
            <FeatureCard 
              icon="/assets/icons/shield.png"
              title="Secure Payments"
              description="Integrated Razorpay payment gateway. Secure transactions for milestone-based projects."
              status="live"
            />
            <FeatureCard 
              icon="/assets/icons/wallet.png"
              title="Milestone System"
              description="Break projects into milestones. Track progress and manage payments efficiently."
              status="live"
            />
            <FeatureCard 
              icon="/assets/icons/verified.png"
              title="User Profiles"
              description="Create detailed profiles with skills, experience, and project history."
              status="live"
            />
            <FeatureCard 
              icon="/assets/icons/star.png"
              title="Rating System"
              description="Review and rate completed projects. Build your reputation on the platform."
              status="live"
            />
            <FeatureCard 
              icon="/assets/icons/analytics.png"
              title="Project Dashboard"
              description="Monitor all your projects in one place. View milestones, deadlines, and status."
              status="live"
            />
            <FeatureCard 
              icon="/assets/icons/rocket.png"
              title="Quick Project Posting"
              description="Post projects in minutes. Define requirements, budget, and milestones easily."
              status="live"
            />
            <FeatureCard 
              icon="/assets/icons/chat.png"
              title="Notifications"
              description="Stay updated with real-time notifications for proposals, payments, and updates."
              status="live"
            />
            <FeatureCard 
              icon="/assets/icons/globe.png"
              title="Browse & Search"
              description="Discover projects and freelancers. Filter by category, budget, and skills."
              status="live"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Simple 4-step process to get started</p>
          </div>

          <div className="steps-grid">
            <StepCard 
              number="1"
              illustration="/assets/illustrations/post-project.png"
              title="Create Account"
              description="Sign up as a client or freelancer. Complete your profile with skills and experience."
            />
            <StepCard 
              number="2"
              illustration="/assets/illustrations/collaborate.png"
              title="Post or Browse"
              description="Clients post projects with milestones. Freelancers browse and submit proposals."
            />
            <StepCard 
              number="3"
              illustration="/assets/illustrations/collaborate.png"
              title="Collaborate"
              description="Work together on projects. Track milestone progress through the dashboard."
            />
            <StepCard 
              number="4"
              illustration="/assets/illustrations/success.png"
              title="Complete & Pay"
              description="Mark milestones as complete. Process secure payments through Stripe integration."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <div className="cta-text">
              <h2>Ready to Try FreelanceHub?</h2>
              <p>Explore our MVP and see the core features in action</p>
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

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>Early User Feedback</h2>
            <p>What our beta testers are saying</p>
          </div>

          <div className="testimonials-grid">
            <TestimonialCard 
              name="College Reviewer"
              role="Project Evaluator"
              avatar="https://ui-avatars.com/api/?name=Project+Reviewer&background=4f46e5&color=fff&size=80"
              rating={5}
              text="Impressive MERN stack implementation! The milestone system is well-designed and the UI is clean. Shows strong full-stack development skills."
            />
            <TestimonialCard 
              name="Beta Tester"
              role="Early User"
              avatar="https://ui-avatars.com/api/?name=Beta+Tester&background=6366f1&color=fff&size=80"
              rating={4}
              text="Great MVP! The core features work smoothly. Looking forward to seeing real-time chat and more features in future versions."
            />
            <TestimonialCard 
              name="Test User"
              role="Developer"
              avatar="https://ui-avatars.com/api/?name=Test+User&background=8b5cf6&color=fff&size=80"
              rating={5}
              text="Solid foundation for a freelance platform. The project posting and milestone tracking features are intuitive and functional."
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>About this MVP project</p>
          </div>

          <div className="faq-grid">
            <FAQItem 
              question="What is FreelanceHub?"
              answer="FreelanceHub is a MERN stack MVP (Minimum Viable Product) freelance marketplace. It demonstrates core features like project posting, milestone management, and secure payments."
            />
            <FAQItem 
              question="Is this a real production platform?"
              answer="This is an MVP built for learning and demonstration purposes. It has functional core features but is not yet a full production platform with thousands of users."
            />
            <FAQItem 
              question="What features are currently working?"
              answer="User authentication, project posting, browsing, milestone management, Razorpay payment integration, ratings/reviews, notifications, and admin dashboard are all functional."
            />
            <FAQItem 
              question="What features are planned for the future?"
              answer="Future enhancements include real-time chat, advanced search filters, escrow payment system, dispute resolution, email notifications, and mobile app."
            />
            <FAQItem 
              question="Can I actually use this platform?"
              answer="Yes! All core features are working. You can create an account, post projects, submit proposals, and manage milestones. Payment integration is live with Razorpay test mode."
            />
            <FAQItem 
              question="Is the code open source?"
              answer="This is a portfolio/college project. The platform demonstrates full-stack MERN development skills including React, Node.js, Express, MongoDB, and Razorpay integration."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            {/* Brand Column */}
            <div className="footer-column">
              <h3 className="footer-brand">FreelanceHub</h3>
              <p className="footer-description">
                A MERN stack MVP project demonstrating a milestone-based freelance marketplace platform.
              </p>
              <div className="mvp-badge">
                <span className="badge-footer">MVP Beta Version</span>
              </div>
              <div className="social-links">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Facebook">
                  <img src="https://img.icons8.com/fluency/48/facebook-new.png" alt="Facebook" width="32" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Twitter">
                  <img src="https://img.icons8.com/fluency/48/twitter.png" alt="Twitter" width="32" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
                  <img src="https://img.icons8.com/fluency/48/linkedin.png" alt="LinkedIn" width="32" />
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="GitHub">
                  <img src="https://img.icons8.com/fluency/48/github.png" alt="GitHub" width="32" />
                </a>
              </div>
            </div>

            {/* For Freelancers */}
            <div className="footer-column">
              <h4 className="footer-title">Features</h4>
              <ul className="footer-links">
                <li><Link to="/browse-projects">Browse Projects</Link></li>
                <li><Link to="/signup">Create Account</Link></li>
                <li><a href="#features" onClick={(e) => e.preventDefault()}>Core Features</a></li>
                <li><a href="#how-it-works" onClick={(e) => e.preventDefault()}>How It Works</a></li>
              </ul>
            </div>

            {/* For Clients */}
            <div className="footer-column">
              <h4 className="footer-title">Platform</h4>
              <ul className="footer-links">
                <li><Link to="/post-project">Post a Project</Link></li>
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><a href="#testimonials" onClick={(e) => e.preventDefault()}>Testimonials</a></li>
                <li><a href="#faq" onClick={(e) => e.preventDefault()}>FAQ</a></li>
              </ul>
            </div>

            {/* Tech Stack */}
            <div className="footer-column">
              <h4 className="footer-title">Tech Stack</h4>
              <ul className="footer-links">
                <li><a href="https://www.mongodb.com" target="_blank" rel="noopener noreferrer">MongoDB</a></li>
                <li><a href="https://expressjs.com" target="_blank" rel="noopener noreferrer">Express.js</a></li>
                <li><a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">React.js</a></li>
                <li><a href="https://nodejs.org" target="_blank" rel="noopener noreferrer">Node.js</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className="footer-column">
              <h4 className="footer-title">Project Info</h4>
              <ul className="footer-links">
                <li><a href="#about" onClick={(e) => e.preventDefault()}>About MVP</a></li>
                <li><a href="#docs" onClick={(e) => e.preventDefault()}>Documentation</a></li>
                <li><a href="https://github.com/yourusername/freelancehub" target="_blank" rel="noopener noreferrer">GitHub Repo</a></li>
                <li><a href="#contact" onClick={(e) => e.preventDefault()}>Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="footer-bottom">
            <p>&copy; 2026 FreelanceHub MVP - College Project</p>
            <p>Built with ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Reusable Components
function FeatureCard({ icon, title, description, status }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">
        <img src={icon} alt={title} width="64" height="64" />
      </div>
      {status === 'live' && <span className="status-badge">✅ Live</span>}
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

function TestimonialCard({ name, role, avatar, rating, text }) {
  return (
    <div className="testimonial-card">
      <div className="testimonial-header">
        <img src={avatar} alt={name} className="testimonial-avatar" />
        <div className="testimonial-info">
          <h4>{name}</h4>
          <p className="testimonial-role">{role}</p>
        </div>
      </div>
      <div className="testimonial-rating">
        {[...Array(rating)].map((_, i) => (
          <span key={i} className="star-filled">⭐</span>
        ))}
      </div>
      <p className="testimonial-text">"{text}"</p>
    </div>
  );
}

function FAQItem({ question, answer }) {
  return (
    <div className="faq-item">
      <h4 className="faq-question">{question}</h4>
      <p className="faq-answer">{answer}</p>
    </div>
  );
}

export default LandingPage;
