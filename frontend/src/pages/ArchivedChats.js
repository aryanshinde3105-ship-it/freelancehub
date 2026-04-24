import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { getCurrentUser } from '../auth';
import '../styles/chatPages.css';

const formatDate = (value) => {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const extractParticipantName = (participant) => {
  if (!participant || typeof participant === 'string') return null;
  return participant.name || null;
};

function ArchivedChats() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unarchivingId, setUnarchivingId] = useState('');

  const user = getCurrentUser();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const loadArchived = async () => {
      try {
        const res =
          user.role === 'client'
            ? await api.get('/api/projects/my', {
                headers: { Authorization: `Bearer ${token}` },
              })
            : await api.get('/api/projects/active', {
                headers: { Authorization: `Bearer ${token}` },
              });

        const archived = res.data.filter(p =>
          p.archivedBy?.includes(user._id)
        );

        setProjects(archived);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadArchived();
  }, [user, token]);

  const unarchiveChat = async (projectId) => {
    try {
      setUnarchivingId(projectId);
      await api.patch(
        `/api/projects/${projectId}/unarchive`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProjects((prev) => prev.filter((project) => project._id !== projectId));
    } catch (err) {
      console.error(err);
    } finally {
      setUnarchivingId('');
    }
  };

  const visibleProjects = projects
    .filter((project) =>
      project.title.toLowerCase().includes(search.trim().toLowerCase())
    )
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  if (loading) return <p>Loading archived chats...</p>;

  return (
    <div className="app-container chat-hub-page">
      <div className="chat-hub-header">
        <div>
          <h2 className="chat-hub-title">Archived Chats</h2>
          <p className="chat-hub-subtitle">
            Keep your inbox tidy without losing project history.
          </p>
        </div>
        <Link to="/chats" className="btn btn-secondary chat-hub-archived-link">
          Back to Active
        </Link>
      </div>

      <div className="chat-search-bar-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="chat-search-input"
          placeholder="Search archived chats"
        />
      </div>

      {visibleProjects.length === 0 && (
        <div className="empty-state">
          <h3>No archived chats found</h3>
          <p>
            {projects.length === 0
              ? 'You have not archived any chats yet.'
              : 'Try a different search term to find an archived project.'}
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
            <article key={project._id} className="chat-project-card archived">
              <div className="chat-project-card-head">
                <h3>{project.title}</h3>
                <span className="project-status-chip archived-chip">Archived</span>
              </div>

              <div className="chat-project-meta">
                <div>
                  <span className="meta-label">Participant</span>
                  <strong>{counterpartName}</strong>
                </div>
                <div>
                  <span className="meta-label">Updated</span>
                  <strong>{formatDate(project.updatedAt)}</strong>
                </div>
                <div>
                  <span className="meta-label">Project Status</span>
                  <strong>{project.status || 'open'}</strong>
                </div>
                <div>
                  <span className="meta-label">Archived At</span>
                  <strong>{formatDate(project.updatedAt)}</strong>
                </div>
              </div>

              <div className="chat-project-actions">
                <Link to={`/chat/${project._id}`} className="btn btn-primary">
                  Open Chat
                </Link>

                <button
                  onClick={() => unarchiveChat(project._id)}
                  className="btn btn-secondary"
                  disabled={unarchivingId === project._id}
                >
                  {unarchivingId === project._id ? 'Restoring...' : 'Unarchive'}
                </button>
              </div>
            </article>
          );
        })}
      </section>

    </div>
  );
}

export default ArchivedChats;
