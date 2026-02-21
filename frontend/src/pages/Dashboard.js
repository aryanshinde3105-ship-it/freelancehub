import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../auth';
import api from '../api';

function Dashboard() {
  const user = getCurrentUser();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/api/dashboard/stats');
      setStats(res.data.stats);
      setRecentActivity(res.data.recentActivity || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="app-container text-center">
        <h2>Please log in</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="app-container text-center">
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div className="card">
        <h2>Welcome back, {user.name} 👋</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          You are logged in as <b style={{ color: 'var(--primary)' }}>{user.role}</b>
        </p>
      </div>

      {/* Analytics Stats Cards */}
      {stats && (
        <div className="card-grid">
          {user.role === 'client' && (
            <>
              <StatCard
                icon="📊"
                title="Total Projects"
                value={stats.totalProjects}
                color="#667eea"
              />
              <StatCard
                icon="🔄"
                title="Active Projects"
                value={stats.activeProjects}
                color="#4facfe"
              />
              <StatCard
                icon="✅"
                title="Completed"
                value={stats.completedProjects}
                color="#14a800"
              />
              <StatCard
                icon="💬"
                title="Proposals Received"
                value={stats.totalProposals}
                color="#f093fb"
              />
              <StatCard
                icon="💰"
                title="Total Budget"
                value={`$${stats.totalBudget.toLocaleString()}`}
                color="#ffa726"
              />
            </>
          )}

          {user.role === 'freelancer' && (
            <>
              <StatCard
                icon="📝"
                title="Total Proposals"
                value={stats.totalProposals}
                color="#667eea"
              />
              <StatCard
                icon="✅"
                title="Accepted"
                value={stats.acceptedProposals}
                color="#14a800"
              />
              <StatCard
                icon="⏳"
                title="Pending"
                value={stats.pendingProposals}
                color="#ffa726"
              />
              <StatCard
                icon="🔄"
                title="Active Projects"
                value={stats.activeProjects}
                color="#4facfe"
              />
              <StatCard
                icon="🎯"
                title="Completed"
                value={stats.completedProjects}
                color="#1dbf73"
              />
            </>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {user.role === 'client' && (
            <>
              <Link to="/post-project">
                <button className="btn btn-primary">+ Post New Project</button>
              </Link>
              <Link to="/my-projects">
                <button className="btn btn-secondary">📁 My Projects</button>
              </Link>
              <Link to="/chats">
                <button className="btn btn-secondary">💬 Chats</button>
              </Link>
            </>
          )}

          {user.role === 'freelancer' && (
            <>
              <Link to="/browse-projects">
                <button className="btn btn-primary">🔍 Browse Projects</button>
              </Link>
              <Link to="/my-proposals">
                <button className="btn btn-secondary">📄 My Proposals</button>
              </Link>
              {/* ✅ FIXED: was /active-projects */}
              <Link to="/my-active-projects">
                <button className="btn btn-secondary">🛠 Active Work</button>
              </Link>
              <Link to="/chats">
                <button className="btn btn-secondary">💬 Chats</button>
              </Link>
            </>
          )}

          <Link to="/profile">
            <button className="btn btn-secondary">👤 Profile</button>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="card">
          <h3>Recent Activity</h3>
          <div style={{ marginTop: '1rem' }}>
            {user.role === 'client' && (
              <div>
                {recentActivity.map((project) => (
                  <ActivityItem
                    key={project._id}
                    title={project.title}
                    status={project.status}
                    date={project.updatedAt}
                    link={`/my-projects`}
                  />
                ))}
              </div>
            )}

            {user.role === 'freelancer' && (
              <div>
                {recentActivity.map((proposal) => (
                  <ActivityItem
                    key={proposal._id}
                    title={proposal.projectId?.title || 'Project'}
                    status={proposal.status}
                    date={proposal.createdAt}
                    link={`/my-proposals`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, title, value, color }) {
  return (
    <div
      className="card"
      style={{
        textAlign: 'center',
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
        {title}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ title, status, date, link }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return '#14a800';
      case 'in-progress':
        return '#4facfe';
      case 'pending-approval':
        return '#ffa726';
      case 'completed':
        return '#1dbf73';
      case 'accepted':
        return '#14a800';
      case 'rejected':
        return '#ef4444';
      case 'pending':
        return '#ffa726';
      default:
        return '#6b7280';
    }
  };

  return (
    <Link to={link} style={{ textDecoration: 'none' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem',
          marginBottom: '0.5rem',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }}
        className="activity-item-hover"
      >
        <div>
          <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {title}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {new Date(date).toLocaleDateString()}
          </div>
        </div>
        <span
          className="badge"
          style={{
            backgroundColor: `${getStatusColor(status)}15`,
            color: getStatusColor(status),
          }}
        >
          {status}
        </span>
      </div>
    </Link>
  );
}

export default Dashboard;
