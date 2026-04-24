import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ProjectProgress from '../components/ProjectProgress';
import RatingForm from '../components/RatingForm';
import ProjectMilestones from '../components/ProjectMilestones';
import '../styles/milestonesModal.css';

const ACCEPTED_UPLOAD_EXTENSIONS =
  '.pdf,.doc,.docx,.rtf,.txt,.md,.csv,.xls,.xlsx,.ppt,.pptx,.json,.xml,.yaml,.yml,.js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.h,.hpp,.cs,.go,.php,.rb,.swift,.kt,.kts,.scala,.rs,.sql,.sh,.ps1,.bat,.html,.css,.scss,.less,.png,.jpg,.jpeg,.webp,.zip,.7z,.rar,.tar,.gz';

function MyActiveProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [projectMilestones, setProjectMilestones] = useState({});

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentRatingProject, setCurrentRatingProject] = useState(null);
  const [canReviewStatus, setCanReviewStatus] = useState({});

  const token = localStorage.getItem('token');

  const fetchMilestonesForProject = async (projectId) => {
    try {
      const res = await api.get(`/api/milestones/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let arr = res.data;
      if (res.data.milestones) arr = res.data.milestones;
      else if (res.data.data) arr = res.data.data;
      if (Array.isArray(arr)) {
        setProjectMilestones(prev => ({ ...prev, [projectId]: arr }));
      }
    } catch (err) {
      console.error('Failed to fetch milestones for project:', projectId, err);
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/api/projects/active', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(res.data);

        for (const project of res.data) {
          if (project.paymentType === 'milestone-based') {
            fetchMilestonesForProject(project._id);
          }
          if (project.status === 'completed') {
            checkCanReview(project._id);
          }
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

  const checkCanReview = async (projectId) => {
    try {
      const res = await api.get(`/api/ratings/can-review/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCanReviewStatus(prev => ({ ...prev, [projectId]: res.data }));
    } catch (err) {
      console.error('Error checking review status:', err);
    }
  };

  const openRatingModal = async (project) => {
    try {
      const res = await api.get(`/api/projects/${project._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fullProject = res.data;

      const userStr = localStorage.getItem('user');
      let currentUserId;
      if (userStr) {
        const currentUser = JSON.parse(userStr);
        currentUserId = currentUser.id || currentUser._id;
      }
      if (!currentUserId) {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        currentUserId = tokenPayload.userId || tokenPayload.id;
      }

      const clientId = typeof fullProject.clientId === 'object'
        ? fullProject.clientId._id
        : fullProject.clientId;

      const freelancerId = typeof fullProject.assignedFreelancerId === 'object'
        ? fullProject.assignedFreelancerId._id
        : fullProject.assignedFreelancerId;

      let reviewedUserId, reviewedUserName;

      if (clientId === currentUserId) {
        reviewedUserId = freelancerId;
        reviewedUserName = typeof fullProject.assignedFreelancerId === 'object'
          ? fullProject.assignedFreelancerId.name : 'Freelancer';
      } else {
        reviewedUserId = clientId;
        reviewedUserName = typeof fullProject.clientId === 'object'
          ? fullProject.clientId.name : 'Client';
      }

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

      setCurrentRatingProject({ ...project, reviewedUserId, reviewedUserName });
      setShowRatingModal(true);
    } catch (err) {
      console.error('Error opening rating modal:', err);
      alert('Failed to load project details');
    }
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setCurrentRatingProject(null);
  };

  const handleRatingSuccess = () => {
    closeRatingModal();
    if (currentRatingProject) checkCanReview(currentRatingProject._id);
  };

  const openMilestoneModal = (projectId) => setExpandedProject(projectId);
  const closeMilestoneModal = () => {
    setExpandedProject(null);
    // refresh milestones after modal closes so progress bar updates
    if (expandedProject) fetchMilestonesForProject(expandedProject);
  };

  const handleFileChange = (projectId, file) => {
    setSelectedFiles(prev => ({ ...prev, [projectId]: file }));
  };

  const uploadFile = async (projectId) => {
    const file = selectedFiles[projectId];
    if (!file) { alert('Please select a file first'); return; }

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
      setSelectedFiles(prev => { const u = { ...prev }; delete u[projectId]; return u; });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Upload failed');
    }
  };

  if (loading) return <p>Loading projects...</p>;

  return (
    <div className="app-container">
      <h2>My Active Projects</h2>

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
          <h3>No active projects</h3>
          <p>You don't have any ongoing work right now.</p>
          <Link to="/browse-projects">
            <button className="btn btn-primary">Browse projects</button>
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {projects.map((project) => {
            const reviewStatus = canReviewStatus[project._id];
            const isMilestoneBased = project.paymentType === 'milestone-based';
            const milestones = projectMilestones[project._id];

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
                  {/* Progress bar — uses real milestone data if available */}
                  <ProjectProgress
                    status={project.status}
                    milestones={isMilestoneBased ? milestones : undefined}
                  />

                  {project.status === 'pending-approval' && !isMilestoneBased && (
                    <p className="mt-1">⏳ Waiting for client approval</p>
                  )}

                  {/* Milestone-based hint */}
                  {isMilestoneBased && project.status === 'in-progress' && (
                    <p style={{
                      marginTop: '0.75rem',
                      fontSize: '0.875rem',
                      color: '#667eea',
                      background: '#eef2ff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                    }}>
                      💡 Submit your work inside each milestone using <strong>View Milestones</strong> below.
                    </p>
                  )}

                  {project.rejectionReason && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      color: '#9a3412',
                      fontSize: '0.9rem',
                    }}>
                      <strong>Client feedback:</strong>
                      <div>{project.rejectionReason}</div>
                    </div>
                  )}

                  {project.status === 'completed' && !reviewStatus?.hasReviewed && (
                    <p className="mt-1" style={{ color: '#16a34a', fontWeight: '500' }}>
                      ✅ Project completed successfully!
                    </p>
                  )}

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
                      <button className="btn btn-secondary">Open Chat</button>
                    </Link>
                  )}

                  {/* Upload Work — fixed-price only */}
                  {!isMilestoneBased && project.status === 'in-progress' && (
                    <>
                      <input
                        type="file"
                        accept={ACCEPTED_UPLOAD_EXTENSIONS}
                        onChange={(e) => handleFileChange(project._id, e.target.files[0])}
                      />
                      <details style={{ marginTop: '0.35rem', marginBottom: '0.35rem' }}>
                        <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#475569' }}>
                          Supported formats
                        </summary>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.5 }}>
                          PDF, DOC, DOCX, RTF, TXT, MD, CSV, XLS, XLSX, PPT, PPTX,
                          common code/config files, PNG/JPG/WEBP, ZIP/7Z/RAR/TAR/GZ.
                          <br />
                          Max file size: 25 MB per file.
                        </div>
                      </details>
                      <button
                        className="btn btn-primary"
                        onClick={() => uploadFile(project._id)}
                      >
                        Upload Work
                      </button>
                    </>
                  )}

                  {reviewStatus?.canReview && (
                    <button
                      className="btn btn-primary"
                      onClick={() => openRatingModal(project)}
                      style={{ background: '#f59e0b' }}
                    >
                      ⭐ Leave Review
                    </button>
                  )}

                  {/* View Milestones — milestone-based only */}
                  {isMilestoneBased && (
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

      {expandedProject && (
        <div className="mh-modal-overlay" onClick={closeMilestoneModal}>
          <div className="mh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mh-modal-header">
              <div>
                <h2 className="mh-modal-title">Project Milestones</h2>
                <p className="mh-modal-subtitle">
                  {projects.find(p => p._id === expandedProject)?.title}
                </p>
              </div>
              <button className="mh-modal-close" onClick={closeMilestoneModal}>×</button>
            </div>
            <div className="mh-modal-body">
              <ProjectMilestones projectId={expandedProject} userRole="freelancer" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyActiveProjects;
