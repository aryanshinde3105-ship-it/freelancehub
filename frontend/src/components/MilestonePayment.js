import React, { useState } from 'react';
import api from '../api';

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
        key: key, // Razorpay Key ID
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
              alert('Payment successful! Milestone funded.');
              if (onPaymentSuccess) onPaymentSuccess();
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#667eea',
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

  return (
    <button
      className="btn-pay-milestone"
      onClick={handlePayment}
      disabled={loading || milestone.payment.status !== 'pending'}
      style={{
        background: milestone.payment.status === 'pending' ? '#28a745' : '#6c757d',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '6px',
        cursor: milestone.payment.status === 'pending' ? 'pointer' : 'not-allowed',
        fontWeight: '600',
        fontSize: '0.95em',
        width: '100%',
        marginTop: '10px',
      }}
    >
      {loading
        ? '⏳ Processing...'
        : milestone.payment.status === 'pending'
        ? `💳 Pay ₹${milestone.amount.toLocaleString()}`
        : milestone.payment.status === 'paid'
        ? '✓ Paid (In Escrow)'
        : `Status: ${milestone.payment.status}`}
    </button>
  );
};

export default MilestonePayment;
