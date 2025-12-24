import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { getCurrentUser } from '../auth';

function BrowseProjects() {
  const [projects, setProjects] = useState([]);
  const [appliedProjectIds, setAppliedProjectIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const user = getCurrentUser();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsRes = await api.get('/api/projects');
        setProjects(projectsRes.data);

        if (user?.role === 'freelancer') {
          const proposalsRes = await api.get('/api/proposals/my', {
            headers: { Authorization: `Bearer ${token}` },
          });

          const appliedIds = proposalsRes.data.map(p => p.projectId._id);
          setAppliedProjectIds(appliedIds);
        }

        if (projectsRes.data.length === 0) {
          setMessage('No open projects available.');
        }
      } catch (err) {
        console.error(err);
        setMessage('Unable to load projects.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token]);

  if (loading) return <p>Loading projects...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2>Browse Projects</h2>
      {message && <p>{message}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {projects.map(project => {
          const alreadyApplied = appliedProjectIds.includes(project._id);

          return (
            <div
              key={project._id}
             className="app-container">
              <h3 className="card" key={project._id}>{project.title}</h3>
              <p className="card-title">{project.description}</p>
              <p className="text-muted"><b>Budget:</b> ₹{project.budget}</p>

              {user?.role === 'freelancer' && (
                alreadyApplied ? (
                  <p style={{ color: 'gray', fontStyle: 'italic' }}>
                    You already applied
                  </p>
                ) : (
                  <Link to={`/apply/${project._id}`}>
                    <button className="text-muted">Apply</button>
                  </Link>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BrowseProjects;
