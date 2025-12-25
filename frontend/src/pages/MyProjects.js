import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProjectProgress from '../components/ProjectProgress';

function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [rejectReason, setRejectReason] = useState({});
  const token = localStorage.getItem('token');

  // ✅ extracted so we can reuse it
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

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const approveProject = async (projectId) => {
    try {
      await api.patch(
        `/api/projects/${projectId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ refresh state instead of reloading page
      await fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve project');
    }
  };

  const rejectProject = async (projectId) => {
    if (!rejectReason[projectId]) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await api.patch(
        `/api/projects/${projectId}/reject`,
        { reason: rejectReason[projectId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Project rejected');

      // clear rejection input for that project
      setRejectReason((prev) => {
        const updated = { ...prev };
        delete updated[projectId];
        return updated;
      });

      // ✅ refresh state instead of reloading page
      await fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject project');
    }
  };

  return (
    <div className="app-container">
      <h2>My Projects</h2>

      {/* EMPTY STATE */}
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
                            href={`${process.env.REACT_APP_API_URL}/uploads/${file.filename}`}
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
                {project.status === 'open' && (
                  <Link to={`/project/${project._id}/proposals`}>
                    <button className="btn btn-secondary">
                      View Proposals
                    </button>
                  </Link>
                )}

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
