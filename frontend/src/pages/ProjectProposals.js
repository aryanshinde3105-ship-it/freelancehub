import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import api from '../api';
import { getCurrentUser } from '../auth';

function ProjectProposals() {
  const { projectId } = useParams();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');
  const user = getCurrentUser();

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        // 🚫 extra safety: block non-clients from API call
        if (!user || user.role !== 'client') {
          setMessage('Not authorized');
          setLoading(false);
          return;
        }

        const res = await api.get(`/api/proposals/project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProposals(res.data);

        if (res.data.length === 0) {
          setMessage('No proposals received yet.');
        }
      } catch (err) {
        console.error(err);
        setMessage(err.response?.data?.message || 'Failed to load proposals.');
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, [projectId, token, user]);

  // ✅ redirect AFTER hooks
  if (!user || user.role !== 'client') {
    return <Navigate to="/" />;
  }

  const acceptProposal = async (proposalId) => {
    try {
      await api.patch(
        `/api/proposals/${proposalId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // refresh list
      const res = await api.get(`/api/proposals/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProposals(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept proposal');
    }
  };

  const rejectProposal = async (proposalId) => {
    try {
      await api.patch(
        `/api/proposals/${proposalId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // refresh list
      const res = await api.get(`/api/proposals/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProposals(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject proposal');
    }
  };

  if (loading) return <p>Loading proposals...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2>Project Proposals</h2>

      {message && <p>{message}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        {proposals.map((p) => (
          <div
            key={p._id}
            style={{
              border: '1px solid #ddd',
              padding: '1rem',
              borderRadius: '8px',
            }}
          >
            <h3>{p.freelancerId?.name}</h3>
            <p><b>Email:</b> {p.freelancerId?.email}</p>
            <p><b>Bid:</b> ₹{p.bidAmount}</p>
            <p><b>Timeline:</b> {p.estimatedTimeline}</p>
            <p><b>Status:</b> {p.status}</p>
            <p>{p.coverLetter}</p>

            {p.status === 'pending' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button onClick={() => acceptProposal(p._id)}>
                  Accept
                </button>
                <button onClick={() => rejectProposal(p._id)}>
                  Reject
                </button>
              </div>
            )}

            {p.status === 'accepted' && <p>✅ Accepted</p>}
            {p.status === 'rejected' && <p>❌ Rejected</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectProposals;
