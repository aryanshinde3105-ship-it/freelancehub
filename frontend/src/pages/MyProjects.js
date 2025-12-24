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

      {projects.map((project) => (
        <div className="card" key={project._id}>
          <h3 className="card-title">{project.title}</h3>
          <p className="text-muted">Status: {project.status}</p>

          <ProjectProgress status={project.status} />

          {project.deliverables?.length > 0 && (
            <>
              <h4>Uploaded Files</h4>
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

          {project.status === 'pending-approval' && (
            <>
              <button onClick={() => approveProject(project._id)}>Approve</button>

              <div style={{ marginTop: '0.5rem' }}>
                <textarea
                  placeholder="Reason for rejection"
                  value={rejectReason[project._id] || ''}
                  onChange={(e) =>
                    setRejectReason({ ...rejectReason, [project._id]: e.target.value })
                  }
                />
                <br />
                <button onClick={() => rejectProject(project._id)}>Reject</button>
              </div>
            </>
          )}

          {project.assignedFreelancerId && (
            <Link to={`/chat/${project._id}`}>
              <button>Open Chat</button>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

export default MyProjects;
