import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { getCurrentUser } from '../auth';
import '../styles/chatPages.css';

const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return 'Budget not set';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const extractParticipantName = (participant) => {
  if (!participant) return null;
  if (typeof participant === 'string') return null;
  return participant.name || null;
};

function Chats() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [archivingId, setArchivingId] = useState('');

  const user = getCurrentUser();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const loadChats = async () => {
      try {
        const res =
          user.role === 'client'
            ? await api.get('/api/projects/my', {
                headers: { Authorization: `Bearer ${token}` },
              })
            : await api.get('/api/projects/active', {
                headers: { Authorization: `Bearer ${token}` },
              });

        const visible = res.data.filter(
          p => !p.archivedBy?.includes(user._id)
        );

        setProjects(visible);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [user, token]);

  const archiveChat = async (projectId) => {
    try {
      setArchivingId(projectId);
      await api.patch(
        `/api/projects/${projectId}/archive`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProjects((prev) => prev.filter((project) => project._id !== projectId));
    } catch (err) {
      console.error(err);
    } finally {
      setArchivingId('');
    }
  };

  const visibleProjects = projects
    .filter((project) =>
      project.title.toLowerCase().includes(search.trim().toLowerCase())
    )
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const inProgressCount = projects.filter((project) => project.status === 'in-progress').length;
  const pendingCount = projects.filter((project) => project.status === 'pending-approval').length;

  if (loading) return <p>Loading chats...</p>;

  return (
    <div className="app-container chat-hub-page">
      <div className="chat-hub-header">
        <div>
          <h2 className="chat-hub-title">Conversations</h2>
          <p className="chat-hub-subtitle">
            Track project communication, jump into active chats, and manage your inbox.
          </p>
        </div>
        <Link to="/archived-chats" className="btn btn-secondary chat-hub-archived-link">
          View Archived
        </Link>
      </div>

      <section className="chat-hub-metrics">
        <article className="chat-metric-card">
          <span className="chat-metric-label">Active Chats</span>
          <strong className="chat-metric-value">{projects.length}</strong>
        </article>
        <article className="chat-metric-card">
          <span className="chat-metric-label">In Progress</span>
          <strong className="chat-metric-value">{inProgressCount}</strong>
        </article>
        <article className="chat-metric-card">
          <span className="chat-metric-label">Pending Approval</span>
          <strong className="chat-metric-value">{pendingCount}</strong>
        </article>
      </section>

      <div className="chat-search-bar-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="chat-search-input"
          placeholder="Search chats by project title"
        />
      </div>

      {visibleProjects.length === 0 && (
        <div className="empty-state">
          <h3>No active chats found</h3>
          <p>
            {projects.length === 0
              ? 'You do not have active project chats yet.'
              : 'Try a different search term to find your conversation.'}
          </p>
        </div>
      )}

      <section className="chat-project-grid">
        {visibleProjects.map((project) => {
          const counterpartName =
            user.role === 'client'
              ? extractParticipantName(project.assignedFreelancerId) || 'Freelancer not assigned'
              : extractParticipantName(project.clientId) || 'Client';

          return (
            <article key={project._id} className="chat-project-card">
              <div className="chat-project-card-head">
                <h3>{project.title}</h3>
                <span className={`project-status-chip status-${project.status || 'open'}`}>
                  {project.status || 'open'}
                </span>
              </div>

              <div className="chat-project-meta">
                <div>
                  <span className="meta-label">Participant</span>
                  <strong>{counterpartName}</strong>
                </div>
                <div>
                  <span className="meta-label">Budget</span>
                  <strong>{formatCurrency(project.budget)}</strong>
                </div>
                <div>
                  <span className="meta-label">Deadline</span>
                  <strong>{formatDate(project.deadline)}</strong>
                </div>
                <div>
                  <span className="meta-label">Updated</span>
                  <strong>{formatDate(project.updatedAt)}</strong>
                </div>
              </div>

              <div className="chat-project-actions">
                <Link to={`/chat/${project._id}`} className="btn btn-primary">
                  Open Chat
                </Link>
                <button
                  className="btn btn-secondary"
                  onClick={() => archiveChat(project._id)}
                  disabled={archivingId === project._id}
                >
                  {archivingId === project._id ? 'Archiving...' : 'Archive'}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

export default Chats;
