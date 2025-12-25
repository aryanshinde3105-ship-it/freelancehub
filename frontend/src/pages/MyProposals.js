import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function MyProposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      } catch (err) {
        console.error(err);
        setError('Failed to load proposals.');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProposals();
    else {
      setError('You must be logged in to view proposals.');
      setLoading(false);
    }
  }, [token]);

  if (loading) return <p>Loading your proposals...</p>;

  return (
    <div className="app-container">
      <h2>My Proposals</h2>

      {/* ❌ real error (not empty state) */}
      {error && <p>{error}</p>}

      {/* ✅ EMPTY STATE */}
      {proposals.length === 0 && !error && (
        <div className="empty-state">
          <h3>No proposals yet</h3>
          <p>You haven’t applied to any projects yet.</p>
          <Link to="/browse-projects">
            <button className="btn btn-primary">
              Find projects
            </button>
          </Link>
        </div>
      )}

      {/* ✅ PROPOSALS LIST */}
      {proposals.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          {proposals.map((p) => (
            <div key={p._id} className="card">
              <h3>{p.projectId?.title}</h3>

              <p>
                <b>Bid:</b> ₹{p.bidAmount}
              </p>
              <p>
                <b>Timeline:</b> {p.estimatedTimeline}
              </p>

              <div
                className={`badge badge-${p.status}`}
                style={{ marginBottom: '0.5rem' }}
              >
                {p.status.replace('-', ' ')}
              </div>

              <p>{p.coverLetter}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyProposals;
