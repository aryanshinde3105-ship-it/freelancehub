import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProjectProgress from '../components/ProjectProgress';
import RatingForm from '../components/RatingForm'; // ✅ NEW IMPORT
import { getFileUrl } from '../utils/apiUrl';


function MyProjects() {
  const [projects, setProjects] = useState([]);
  const [rejectReason, setRejectReason] = useState({});
  
  // ✅ NEW: Rating modal state
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
      
      // ✅ NEW: Check review status for completed projects
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
      <h2>My Projects</h2>

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
          <h3>No projects yet</h3>
          <p>You haven't posted any projects yet.</p>
          <Link to="/post-project">
            <button className="btn btn-primary">
              Post your first project
            </button>
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {projects.map((project) => {
            const reviewStatus = canReviewStatus[project._id]; // ✅ NEW
            
            return (
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
                            <a href={file.url || getFileUrl(file.filename)} target="_blank" rel="noreferrer">
                              {file.originalName}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </>
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

                  {/* ✅ NEW: Leave Review Button for Clients */}
                  {reviewStatus?.canReview && project.status === 'completed' && (
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

export default MyProjects;
