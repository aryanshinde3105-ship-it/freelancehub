import React, { useState } from 'react';
import api from '../api';
import '../styles/MilestonePayment.css';

const MilestonePayment = ({ milestone, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Failed to load payment gateway. Please try again.');
        setLoading(false);
        return;
      }

      // Create order
      const orderResponse = await api.post(
        '/api/payments/create-order',
        { milestoneId: milestone._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { order, key, currency, name, description } = orderResponse.data;

      // Razorpay options
      const options = {
        key: key,
        amount: order.amount,
        currency: currency,
        name: name,
        description: description,
        order_id: order.id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await api.post(
              '/api/payments/verify',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                milestoneId: milestone._id,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyResponse.data.success) {
              alert('✅ Payment successful! Milestone funded.');
              if (onPaymentSuccess) onPaymentSuccess();
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('❌ Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (error) {
      console.error('Payment error:', error);
      alert(error.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const isPending = milestone.payment.status === 'pending';
  const isPaid = milestone.payment.status === 'paid';
  const isReleased = milestone.payment.status === 'released';

  return (
    <div className="milestone-payment-container">
      {/* Payment Card */}
      <div className={`payment-card ${!isPending ? 'payment-completed' : ''}`}>
        
        {/* Trust Badges Row */}
        <div className="trust-badges">
          <span className="trust-badge">
            <span className="badge-icon">🔒</span>
            Secure Payment
          </span>
          <span className="trust-badge">
            <span className="badge-icon">✓</span>
            Escrow Protected
          </span>
        </div>

        {/* Price Display */}
        <div className="price-section">
          <span className="price-label">Milestone Amount</span>
          <div className="price-display">
            <span className="currency-symbol">₹</span>
            <span className="price-value">{milestone.amount.toLocaleString('en-IN')}</span>
          </div>
          <p className="price-description">
            {isPending && 'Funds will be held in escrow until milestone completion'}
            {isPaid && 'Funds are securely held in escrow'}
            {isReleased && 'Payment has been released to freelancer'}
          </p>
        </div>

        {/* Payment Status or Button */}
        {isPending ? (
          <>
            {/* Payment Info */}
            <div className="payment-info-box">
              <div className="info-item">
                <span className="info-icon">💳</span>
                <div className="info-content">
                  <strong>Safe & Secure</strong>
                  <span>Powered by Razorpay</span>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">🛡️</span>
                <div className="info-content">
                  <strong>Buyer Protection</strong>
                  <span>Money-back guarantee</span>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <button
              className="payment-button-premium"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <span className="button-icon">💳</span>
                  <span>Pay ₹{milestone.amount.toLocaleString('en-IN')} Now</span>
                  <span className="button-arrow">→</span>
                </>
              )}
            </button>

            {/* Razorpay Branding */}
            <div className="powered-by">
              <span>Secured by</span>
              <img 
                src="https://razorpay.com/assets/razorpay-glyph.svg" 
                alt="Razorpay" 
                className="razorpay-logo"
              />
              <strong>Razorpay</strong>
            </div>
          </>
        ) : (
          /* Payment Status Display */
          <div className="payment-status-display">
            {isPaid && (
              <div className="status-card status-escrow">
                <div className="status-icon-large">💰</div>
                <h4>Payment Secured</h4>
                <p>₹{milestone.amount.toLocaleString('en-IN')} is held safely in escrow</p>
                <div className="status-timeline">
                  <div className="timeline-item completed">
                    <div className="timeline-dot"></div>
                    <span>Payment Received</span>
                  </div>
                  <div className="timeline-item active">
                    <div className="timeline-dot"></div>
                    <span>Waiting for Completion</span>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <span>Release Payment</span>
                  </div>
                </div>
              </div>
            )}

            {isReleased && (
              <div className="status-card status-released">
                <div className="status-icon-large">✅</div>
                <h4>Payment Released</h4>
                <p>₹{milestone.amount.toLocaleString('en-IN')} has been transferred to the freelancer</p>
                <div className="release-info">
                  <span className="release-date">
                    🗓️ {new Date(milestone.payment.releasedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security Notice */}
      {isPending && (
        <div className="security-notice">
          <span className="notice-icon">ℹ️</span>
          <span>Your payment information is encrypted and secure. We never store your card details.</span>
        </div>
      )}
    </div>
  );
};

export default MilestonePayment;
