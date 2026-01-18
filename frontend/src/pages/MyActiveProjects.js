import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProjectProgress from '../components/ProjectProgress';
import RatingForm from '../components/RatingForm'; // ✅ NEW IMPORT

function MyActiveProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // store selected file per projectId
  const [selectedFiles, setSelectedFiles] = useState({});

  // ✅ NEW: Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentRatingProject, setCurrentRatingProject] = useState(null);
  const [canReviewStatus, setCanReviewStatus] = useState({});

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/api/projects/active', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(res.data);

        // ✅ NEW: Check review status for completed projects
        const completedProjects = res.data.filter(p => p.status === 'completed');
        for (const project of completedProjects) {
          checkCanReview(project._id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ✅ NEW: Check if user can review a project
  const checkCanReview = async (projectId) => {
    try {
      const res = await api.get(`/api/ratings/can-review/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCanReviewStatus(prev => ({
        ...prev,
        [projectId]: res.data
      }));
    } catch (err) {
      console.error('Error checking review status:', err);
    }
  };

  // ✅ NEW: Open rating modal
  const openRatingModal = (project) => {
    const reviewedUserId = project.clientId?._id || project.assignedFreelancerId?._id;
    const reviewedUserName = project.clientId?.name || project.assignedFreelancerId?.name || 'User';
    
    setCurrentRatingProject({
      ...project,
      reviewedUserId,
      reviewedUserName
    });
    setShowRatingModal(true);
  };

  // ✅ NEW: Close rating modal
  const closeRatingModal = () => {
    setShowRatingModal(false);
    setCurrentRatingProject(null);
  };

  // ✅ NEW: Handle successful rating submission
  const handleRatingSuccess = () => {
    closeRatingModal();
    // Refresh review status
    if (currentRatingProject) {
      checkCanReview(currentRatingProject._id);
    }
  };

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

      {/* ✅ NEW: Rating Modal */}
      {showRatingModal && currentRatingProject && (
        <div className="modal-overlay" onClick={closeRatingModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <RatingForm
              projectId={currentRatingProject._id}
              reviewedUserId={currentRatingProject.reviewedUserId}
              reviewedUserName={currentRatingProject.reviewedUserName}
              onSuccess={handleRatingSuccess}
              onCancel={closeRatingModal}
            />
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {projects.length === 0 ? (
        <div className="empty-state">
          <h3>No active projects</h3>
          <p>You don't have any ongoing work right now.</p>
          <Link to="/browse-projects">
            <button className="btn btn-primary">
              Browse projects
            </button>
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {projects.map((project) => {
            const reviewStatus = canReviewStatus[project._id];
            
            return (
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

                  {/* Rejection reason visible to freelancer */}
                  {project.rejectionReason && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        color: '#9a3412',
                        fontSize: '0.9rem',
                      }}
                    >
                      <strong>Client feedback:</strong>
                      <div>{project.rejectionReason}</div>
                    </div>
                  )}

                  {/* ✅ NEW: Completed project message */}
                  {project.status === 'completed' && !reviewStatus?.hasReviewed && (
                    <p className="mt-1" style={{ color: '#16a34a', fontWeight: '500' }}>
                      ✅ Project completed successfully!
                    </p>
                  )}

                  {/* ✅ NEW: Already reviewed message */}
                  {reviewStatus?.hasReviewed && (
                    <p className="mt-1" style={{ color: '#666', fontSize: '0.9rem' }}>
                      ⭐ You've already reviewed this project
                    </p>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="project-card-actions">
                  {(project.status === 'in-progress' ||
                    project.status === 'pending-approval' ||
                    project.status === 'completed') && (
                    <Link to={`/chat/${project._id}`}>
                      <button className="btn btn-secondary">
                        Open Chat
                      </button>
                    </Link>
                  )}

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

                  {/* ✅ NEW: Leave Review Button */}
                  {reviewStatus?.canReview && (
                    <button
                      className="btn btn-primary"
                      onClick={() => openRatingModal(project)}
                      style={{ background: '#f59e0b' }}
                    >
                      ⭐ Leave Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyActiveProjects;
