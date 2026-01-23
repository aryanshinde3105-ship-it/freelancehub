import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProjectProgress from '../components/ProjectProgress';
import RatingForm from '../components/RatingForm';
import ProjectMilestones from '../components/ProjectMilestones';
import '../styles/milestonesModal.css';

function MyActiveProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState(null); // ✅ CHANGED: Now for modal instead of dropdown

  // store selected file per projectId
  const [selectedFiles, setSelectedFiles] = useState({});

  // Rating modal state
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

        // Check review status for completed projects
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

  // Check if user can review a project
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

  // ✅ FIXED: Open rating modal with proper user ID detection
  const openRatingModal = async (project) => {
    try {
      // Fetch full project details with populated user data
      const res = await api.get(`/api/projects/${project._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fullProject = res.data;

      // Get current user info from localStorage
      const userStr = localStorage.getItem('user');
      let currentUserId;

      if (userStr) {
        const currentUser = JSON.parse(userStr);
        currentUserId = currentUser.id || currentUser._id;
      }

      // If user not in localStorage, decode from token
      if (!currentUserId) {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        currentUserId = tokenPayload.userId || tokenPayload.id;
      }

      // Determine who to review
      let reviewedUserId, reviewedUserName;

      // Check if clientId is populated object or just ID string
      const clientId = typeof fullProject.clientId === 'object'
        ? fullProject.clientId._id
        : fullProject.clientId;

      const freelancerId = typeof fullProject.assignedFreelancerId === 'object'
        ? fullProject.assignedFreelancerId._id
        : fullProject.assignedFreelancerId;

      if (clientId === currentUserId) {
        // Current user is client → review freelancer
        reviewedUserId = freelancerId;
        reviewedUserName = typeof fullProject.assignedFreelancerId === 'object'
          ? fullProject.assignedFreelancerId.name
          : 'Freelancer';
      } else {
        // Current user is freelancer → review client
        reviewedUserId = clientId;
        reviewedUserName = typeof fullProject.clientId === 'object'
          ? fullProject.clientId.name
          : 'Client';
      }

      // If name is not available, fetch user details
      if (reviewedUserName === 'Freelancer' || reviewedUserName === 'Client') {
        try {
          const userRes = await api.get(`/api/users/${reviewedUserId}`);
          reviewedUserName = userRes.data.name;
        } catch (err) {
          console.error('Error fetching user name:', err);
        }
      }

      if (!reviewedUserId) {
        alert('Unable to determine user to review');
        return;
      }

      setCurrentRatingProject({
        ...project,
        reviewedUserId,
        reviewedUserName
      });
      setShowRatingModal(true);
    } catch (err) {
      console.error('Error opening rating modal:', err);
      alert('Failed to load project details');
    }
  };

  // Close rating modal
  const closeRatingModal = () => {
    setShowRatingModal(false);
    setCurrentRatingProject(null);
  };

  // Handle successful rating submission
  const handleRatingSuccess = () => {
    closeRatingModal();
    // Refresh review status
    if (currentRatingProject) {
      checkCanReview(currentRatingProject._id);
    }
  };

  // ✅ CHANGED: Now opens modal instead of toggling dropdown
  const openMilestoneModal = (projectId) => {
    setExpandedProject(projectId);
  };

  // ✅ NEW: Close milestone modal
  const closeMilestoneModal = () => {
    setExpandedProject(null);
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

      {/* Rating Modal */}
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

                  {/* Completed project message */}
                  {project.status === 'completed' && !reviewStatus?.hasReviewed && (
                    <p className="mt-1" style={{ color: '#16a34a', fontWeight: '500' }}>
                      ✅ Project completed successfully!
                    </p>
                  )}

                  {/* Already reviewed message */}
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

                  {/* Leave Review Button */}
                  {reviewStatus?.canReview && (
                    <button
                      className="btn btn-primary"
                      onClick={() => openRatingModal(project)}
                      style={{ background: '#f59e0b' }}
                    >
                      ⭐ Leave Review
                    </button>
                  )}

                  {/* ✅ CHANGED: View Milestones Button - Opens Modal */}
                  {project.paymentType === 'milestone-based' && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => openMilestoneModal(project._id)}
                      style={{
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        marginTop: '0.5rem',
                        width: '100%',
                      }}
                    >
                      📊 View Milestones
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ NEW: MILESTONES MODAL */}
      {expandedProject && (
        <div className="mh-modal-overlay" onClick={closeMilestoneModal}>
          <div className="mh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mh-modal-header">
              <div>
                <h2 className="mh-modal-title">Project milestones</h2>
                <p className="mh-modal-subtitle">
                  {projects.find((p) => p._id === expandedProject)?.title}
                </p>
              </div>

              <button className="mh-modal-close" onClick={closeMilestoneModal}>
                ×
              </button>
            </div>

            <div className="mh-modal-body">
              <ProjectMilestones projectId={expandedProject} userRole="freelancer" />
            </div>
          </div>
        </div>
      )}

      {/* ✅ END MILESTONES MODAL */}
    </div>
  );
}

export default MyActiveProjects;
