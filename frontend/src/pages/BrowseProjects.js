import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { getCurrentUser } from '../auth';

function BrowseProjects() {
  const [projects, setProjects] = useState([]);
  const [appliedProjectIds, setAppliedProjectIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

          const appliedIds = proposalsRes.data.map(
            (p) => p.projectId._id
          );
          setAppliedProjectIds(appliedIds);
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load projects.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token]);

  if (loading) return <p>Loading projects...</p>;

  return (
    <div className="app-container">
      <h2>Browse Projects</h2>

      {/* ❌ real error */}
      {error && <p>{error}</p>}

      {/* ✅ EMPTY STATE */}
      {projects.length === 0 && !error && (
        <div className="empty-state">
          <h3>No projects available</h3>
          <p>Check back later to find new opportunities.</p>
        </div>
      )}

      {/* ✅ PROJECT GRID */}
      {projects.length > 0 && (
        <div className="card-grid">
          {projects.map((project) => {
            const alreadyApplied =
              appliedProjectIds.includes(project._id);

            return (
              <div
                key={project._id}
                className="card project-card"
              >
                {/* HEADER */}
                <div className="project-card-header">
                  <h3 className="project-card-title">
                    {project.title}
                  </h3>

                  <div className="badge badge-open">
                    Open
                  </div>
                </div>

                {/* BODY */}
                <div className="project-card-body">
                  <p>{project.description}</p>

                  <p className="mt-1">
                    <b>Budget:</b> ₹{project.budget}
                  </p>
                </div>

                {/* ACTIONS */}
                {user?.role === 'freelancer' && (
                  <div className="project-card-actions">
                    {alreadyApplied ? (
                      <span
                        style={{
                          fontSize: '0.85rem',
                          color: '#6b7280',
                        }}
                      >
                        Already applied
                      </span>
                    ) : (
                      <Link to={`/apply/${project._id}`}>
                        <button className="btn btn-primary">
                          Apply
                        </button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BrowseProjects;
