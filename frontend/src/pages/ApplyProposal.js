import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

function ApplyProposal() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    bidAmount: '',
    estimatedTimeline: '',
    coverLetter: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ✅ redirect moved to effect
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.post(
        `/api/proposals/${projectId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage('Proposal submitted successfully!');
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || 'Failed to submit proposal.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h2>Apply for Project</h2>

      <div className="card">
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <input
            name="bidAmount"
            type="number"
            placeholder="Bid Amount (₹)"
            value={formData.bidAmount}
            onChange={handleChange}
            required
          />

          <input
            name="estimatedTimeline"
            placeholder="Estimated timeline"
            value={formData.estimatedTimeline}
            onChange={handleChange}
            required
          />

          <textarea
            name="coverLetter"
            placeholder="Cover letter"
            value={formData.coverLetter}
            onChange={handleChange}
            rows={4}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Proposal'}
          </button>
        </form>

        {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
      </div>
    </div>
  );
}

export default ApplyProposal;
