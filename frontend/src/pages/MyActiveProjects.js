import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProjectProgress from '../components/ProjectProgress';

function MyActiveProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // store selected file per projectId
  const [selectedFiles, setSelectedFiles] = useState({});

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/api/projects/active', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [token]);

  const handleFileChange = (projectId, file) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [projectId]: file,
    }));
  };

  const uploadFile = async (projectId) => {
    const file = selectedFiles[projectId];
    if (!file) {
      alert('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/api/projects/${projectId}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('File uploaded successfully');

      // clear file after upload
      setSelectedFiles((prev) => {
        const updated = { ...prev };
        delete updated[projectId];
        return updated;
      });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Upload failed');
    }
  };

  if (loading) return <p>Loading projects...</p>;

  return (
    <div className="app-container">
      <h2>My Active Projects</h2>

      {/* ✅ EMPTY STATE */}
      {projects.length === 0 ? (
        <div className="empty-state">
          <h3>No active projects</h3>
          <p>You don’t have any ongoing work right now.</p>
          <Link to="/browse-projects">
            <button className="btn btn-primary">
              Browse projects
            </button>
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {projects.map((project) => (
            <div key={project._id} className="card project-card">
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

                {project.status === 'pending-approval' && (
                  <p className="mt-1">
                    ⏳ Waiting for client approval
                  </p>
                )}
              </div>

              {/* ACTIONS */}
              <div className="project-card-actions">
                {project.status === 'in-progress' && (
                  <>
                    <input
                      type="file"
                      onChange={(e) =>
                        handleFileChange(
                          project._id,
                          e.target.files[0]
                        )
                      }
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => uploadFile(project._id)}
                    >
                      Upload Work
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyActiveProjects;
