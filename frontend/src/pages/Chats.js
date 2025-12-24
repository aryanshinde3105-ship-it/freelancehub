import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { getCurrentUser } from '../auth';

function Chats() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

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
          p => !p.archivedBy?.includes(user.id)
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

  if (loading) return <p>Loading chats...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Chats</h2>
        <Link to="/archived-chats">
          <button>Archived Chats</button>
        </Link>
      </div>

      {projects.length === 0 && <p>No active chats.</p>}

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
        </div>
      ))}
    </div>
  );
}

export default Chats;
