import React, { useEffect, useState } from 'react';
import api from '../api';
import ProjectProgress from './ProjectProgress';

function MyActiveProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ FIX: store selected file per projectId
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
    setSelectedFiles(prev => ({
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

      // optional: clear file after upload
      setSelectedFiles(prev => {
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

      {projects.length === 0 && <p>No active projects.</p>}

      {projects.map(project => (
        <div key={project._id} className="card">
          <h3>{project.title}</h3>
          <p>Status: {project.status}</p>

          <ProjectProgress status={project.status} />

          {project.status === 'in-progress' && (
            <>
              <input
                type="file"
                onChange={(e) =>
                  handleFileChange(project._id, e.target.files[0])
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

          {project.status === 'pending-approval' && (
            <p>⏳ Waiting for client approval</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default MyActiveProjects;
