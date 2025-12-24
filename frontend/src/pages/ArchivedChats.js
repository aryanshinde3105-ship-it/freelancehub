import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { getCurrentUser } from '../auth';

function ArchivedChats() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

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
          p.archivedBy?.includes(user.id)
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
    await api.patch(
      `/api/projects/${projectId}/unarchive`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setProjects(prev => prev.filter(p => p._id !== projectId));
  };

  if (loading) return <p>Loading archived chats...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2>Archived Chats</h2>

      {projects.length === 0 && <p>No archived chats.</p>}

      {projects.map(project => (
        <div
          key={project._id}
          style={{
            border: '1px solid #ddd',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
          }}
        >
          <h3>{project.title}</h3>

          <Link to={`/chat/${project._id}`}>
            <button>Open Chat</button>
          </Link>

          <button
            onClick={() => unarchiveChat(project._id)}
            style={{ marginLeft: '0.5rem' }}
          >
            Unarchive
          </button>
        </div>
      ))}
    </div>
  );
}

export default ArchivedChats;
