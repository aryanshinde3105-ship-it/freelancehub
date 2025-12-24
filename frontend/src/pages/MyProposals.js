import React, { useEffect, useState } from 'react';
import api from '../api';

function MyProposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const res = await api.get('/api/proposals/my', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProposals(res.data);
        if (res.data.length === 0) {
          setMessage('You have not submitted any proposals yet.');
        }
      } catch (err) {
        console.error(err);
        setMessage('Failed to load proposals.');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProposals();
    else {
      setMessage('You must be logged in to view proposals.');
      setLoading(false);
    }
  }, [token]);

  if (loading) return <p>Loading your proposals...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2>My Proposals</h2>
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
            <h3>{p.projectId?.title}</h3>
            <p><b>Bid:</b> ₹{p.bidAmount}</p>
            <p><b>Timeline:</b> {p.estimatedTimeline}</p>
            <p><b>Status:</b> {p.status}</p>
            <p>{p.coverLetter}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyProposals;
