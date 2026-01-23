import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProjectProgress from '../components/ProjectProgress';
import RatingForm from '../components/RatingForm';
import ProjectMilestones from '../components/ProjectMilestones'; // ✅ NEW IMPORT
import { getFileUrl } from '../utils/apiUrl';
import '../styles/milestonesModal.css'; // ✅ NEW IMPORT

function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [rejectReason, setRejectReason] = useState({});
  const [expandedProject, setExpandedProject] = useState(null); // ✅ NEW STATE - For milestone modal

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentRatingProject, setCurrentRatingProject] = useState(null);
  const [canReviewStatus, setCanReviewStatus] = useState({});

  const token = localStorage.getItem('token');

  // extracted so we can reuse it
  const fetchProjects = async () => {
    try {
      const res = await api.get('/api/projects/my', {
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
      alert('Unable to load projects.');
    }
  };

  useEffect(() => {
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

  // Open rating modal
  const openRatingModal = async (project) => {
    try {
      // Fetch full project details with populated user data
      const res = await api.get(`/api/projects/${project._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fullProject = res.data;

      // Client is rating the freelancer
      const reviewedUserId = typeof fullProject.assignedFreelancerId === 'object'
        ? fullProject.assignedFreelancerId._id
        : fullProject.assignedFreelancerId;

      const reviewedUserName = typeof fullProject.assignedFreelancerId === 'object'
        ? fullProject.assignedFreelancerId.name
        : 'Freelancer';

      // If name is not available, fetch user details
      if (reviewedUserName === 'Freelancer' && reviewedUserId) {
        try {
          const userRes = await api.get(`/api/users/${reviewedUserId}`);
          setCurrentRatingProject({
            ...project,
            reviewedUserId,
            reviewedUserName: userRes.data.name
          });
        } catch (err) {
          console.error('Error fetching user name:', err);
          setCurrentRatingProject({
            ...project,
            reviewedUserId,
            reviewedUserName: 'Freelancer'
          });
        }
      } else {
        setCurrentRatingProject({
          ...project,
          reviewedUserId,
          reviewedUserName
        });
      }

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

  // ✅ NEW: Open milestone modal
  const openMilestoneModal = (projectId) => {
    setExpandedProject(projectId);
  };

  // ✅ NEW: Close milestone modal
  const closeMilestoneModal = () => {
    setExpandedProject(null);
  };

  const approveProject = async (projectId) => {
    try {
      await api.patch(
        `/api/projects/${projectId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
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

      setRejectReason((prev) => {
        const updated = { ...prev };
        delete updated[projectId];
        return updated;
      });

      await fetchProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject project');
    }
  };

  return (
    <div className="app-container">
      <h2>My Posted Projects</h2>

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

      {projects.length === 0 ? (
        <div className="empty-state">
          <h3>No projects yet</h3>
          <p>You haven't posted any projects yet.</p>
          <Link to="/post-project">
            <button className="btn btn-primary">Post a Project</button>
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
                  <h3 className="project-card-title">{project.title}</h3>
                  <div className={`badge badge-${project.status}`}>
                    {project.status.replace('-', ' ')}
                  </div>
                </div>

                {/* BODY */}
                <div className="project-card-body">
                  <ProjectProgress status={project.status} />

                  {/* Freelancer Name */}
                  {project.assignedFreelancerId && (
                    <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
                      <strong>Freelancer:</strong>{' '}
                      {typeof project.assignedFreelancerId === 'object'
                        ? project.assignedFreelancerId.name
                        : 'Assigned'}
                    </p>
                  )}

                  {/* Budget & Payment Type */}
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                    <strong>Budget:</strong> ₹{project.budget?.toLocaleString() || 'N/A'}
                    {project.paymentType && (
                      <span style={{ marginLeft: '1rem' }}>
                        <strong>Type:</strong> {project.paymentType}
                      </span>
                    )}
                  </p>

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

                  {/* Deliverables (if pending approval) */}
                  {project.status === 'pending-approval' &&
                    project.deliverables?.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
                          Submitted Files:
                        </strong>
                        {project.deliverables.map((file, idx) => (
                          <div key={idx} style={{ marginBottom: '0.25rem' }}>
                            <a
                              href={getFileUrl(file)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#667eea',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                              }}
                            >
                              📄 {file.split('/').pop()}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                {/* ACTIONS */}
                <div className="project-card-actions">
                  {/* Chat Button */}
                  {(project.status === 'in-progress' ||
                    project.status === 'pending-approval' ||
                    project.status === 'completed') && (
                    <Link to={`/chat/${project._id}`}>
                      <button className="btn btn-secondary">Open Chat</button>
                    </Link>
                  )}

                  {/* Approve / Reject (for pending approval) */}
                  {project.status === 'pending-approval' && (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => approveProject(project._id)}
                      >
                        ✓ Approve
                      </button>

                      <textarea
                        placeholder="Reason for rejection..."
                        value={rejectReason[project._id] || ''}
                        onChange={(e) =>
                          setRejectReason((prev) => ({
                            ...prev,
                            [project._id]: e.target.value,
                          }))
                        }
                        rows={2}
                        style={{
                          width: '100%',
                          marginTop: '0.5rem',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          fontSize: '0.9rem',
                        }}
                      />

                      <button
                        className="btn btn-secondary"
                        onClick={() => rejectProject(project._id)}
                        style={{ background: '#dc3545', color: 'white' }}
                      >
                        ✗ Reject
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

                  {/* ✅ NEW: View Milestones Button */}
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
        <div 
          className="mh-modal-overlay" 
          onClick={closeMilestoneModal}
        >
          <div 
            className="mh-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              className="mh-modal-close"
              onClick={closeMilestoneModal}
            >
              ×
            </button>

            {/* Modal Header */}
            <div className="mh-modal-header">
              <div>
                <h2 className="mh-modal-title">Project Milestones</h2>
                <p className="mh-modal-subtitle">
                  {projects.find(p => p._id === expandedProject)?.title}
                </p>
              </div>
            </div>

            {/* Milestones Content */}
            <div className="mh-modal-body">
              <ProjectMilestones
                projectId={expandedProject}
                userRole="client"
              />
            </div>
          </div>
        </div>
      )}
      {/* ✅ END MILESTONES MODAL */}
    </div>
  );
}

export default MyProjects;
