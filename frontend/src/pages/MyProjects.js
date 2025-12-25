import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProjectProgress from '../components/ProjectProgress';

function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [rejectReason, setRejectReason] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/api/projects/my', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(res.data);
      } catch (err) {
        console.error(err);
        alert('Unable to load projects.');
      }
    };

    fetchProjects();
  }, [token]);

  const approveProject = async (projectId) => {
    await api.patch(
      `/api/projects/${projectId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    window.location.reload();
  };

  const rejectProject = async (projectId) => {
    if (!rejectReason[projectId]) {
      alert('Please provide a rejection reason');
      return;
    }

    await api.patch(
      `/api/projects/${projectId}/reject`,
      { reason: rejectReason[projectId] },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert('Project rejected');
    window.location.reload();
  };

  return (
    <div className="app-container">
      <h2>My Projects</h2>

      {/* ✅ EMPTY STATE */}
      {projects.length === 0 ? (
        <div className="empty-state">
          <h3>No projects yet</h3>
          <p>You haven’t posted any projects yet.</p>
          <Link to="/post-project">
            <button className="btn btn-primary">
              Post your first project
            </button>
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {projects.map((project) => (
            <div className="card project-card" key={project._id}>
              {/* HEADER */}
              <div className="project-card-header">
                <h3 className="project-card-title">
                  {project.title}
                </h3>

                <div className={`badge badge-${project.status}`}>
                  {project.status.replace('-', ' ')}
                </div>
              </div>

              {/* BODY */}
              <div className="project-card-body">
                <ProjectProgress status={project.status} />

                {project.deliverables?.length > 0 && (
                  <>
                    <h4 className="mt-2">Uploaded Files</h4>
                    <ul>
                      {project.deliverables.map((file, i) => (
                        <li key={i}>
                          <a
                            href={`http://localhost:5000/uploads/${file.filename}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {file.originalName}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* ACTIONS */}
              <div className="project-card-actions">
                {project.status === 'pending-approval' && (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => approveProject(project._id)}
                    >
                      Approve
                    </button>

                    <textarea
                      placeholder="Reason for rejection"
                      value={rejectReason[project._id] || ''}
                      onChange={(e) =>
                        setRejectReason({
                          ...rejectReason,
                          [project._id]: e.target.value,
                        })
                      }
                    />

                    <button
                      className="btn btn-secondary"
                      onClick={() => rejectProject(project._id)}
                    >
                      Reject
                    </button>
                  </>
                )}

                {project.assignedFreelancerId && (
                  <Link to={`/chat/${project._id}`}>
                    <button className="btn btn-secondary">
                      Open Chat
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyProjects;
