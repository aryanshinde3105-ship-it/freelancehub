import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { getCurrentUser } from '../auth';

function Dashboard() {
  const user = getCurrentUser();
  const token = localStorage.getItem('token');

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Client dashboard
        if (user.role === 'client') {
          const res = await api.get('/api/projects/my', {
            headers: { Authorization: `Bearer ${token}` },
          });

          const projects = res.data;
          setStats({
            total: projects.length,
            active: projects.filter(p => p.status === 'in-progress').length,
            pending: projects.filter(p => p.status === 'pending-approval').length,
          });
        }

        // Freelancer dashboard
        if (user.role === 'freelancer') {
          const res = await api.get('/api/projects/active', {
            headers: { Authorization: `Bearer ${token}` },
          });

          const projects = res.data;
          setStats({
            total: projects.length,
            active: projects.filter(p => p.status === 'in-progress').length,
            pending: projects.filter(p => p.status === 'pending-approval').length,
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchStats();
  }, [user, token]);

  return (
    <div className="app-container">
      <h2>Dashboard</h2>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <h3 className="card-title">Total Projects</h3>
          <p className="text-muted">{stats.total}</p>
        </div>

        <div className="card">
          <h3 className="card-title">Active</h3>
          <p className="text-muted">{stats.active}</p>
        </div>

        <div className="card">
          <h3 className="card-title">Pending Approval</h3>
          <p className="text-muted">{stats.pending}</p>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ marginTop: '2rem' }}>
        <h3>Quick Actions</h3>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {user.role === 'client' && (
            <>
              <Link to="/post-project">
                <button className="btn btn-primary">Post Project</button>
              </Link>
              <Link to="/my-projects">
                <button className="btn btn-secondary">My Projects</button>
              </Link>
            </>
          )}

          {user.role === 'freelancer' && (
            <>
              <Link to="/my-active-projects">
                <button className="btn btn-primary">My Active Projects</button>
              </Link>
              <Link to="/my-proposals">
                <button className="btn btn-secondary">My Proposals</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
