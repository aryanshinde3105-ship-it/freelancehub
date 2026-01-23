import React, { useState, useEffect } from 'react';
import api from '../api';
import '../styles/ProjectMilestones.css';

const ProjectMilestones = ({ projectId, userRole }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingProgress, setUpdatingProgress] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchMilestones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/milestones/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Handle different response structures
      console.log('Milestone API Response:', response.data);
      
      let milestonesArray = response.data;
      
      // If response is wrapped in an object, extract the array
      if (response.data.milestones) {
        milestonesArray = response.data.milestones;
      } else if (response.data.data) {
        milestonesArray = response.data.data;
      }
      
      // Check if it's an array
      if (!Array.isArray(milestonesArray)) {
        console.error('Expected array but got:', milestonesArray);
        setError('Invalid milestone data format');
        setMilestones([]);
        return;
      }
      
      // Sort by order
      const sortedMilestones = milestonesArray.sort((a, b) => a.order - b.order);
      setMilestones(sortedMilestones);
      setError('');
    } catch (err) {
      console.error('Error fetching milestones:', err);
      console.error('Error response:', err.response?.data);
      setError('Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (milestoneId, newProgress) => {
    try {
      setUpdatingProgress({ ...updatingProgress, [milestoneId]: true });

      await api.patch(
        `/api/milestones/${milestoneId}/progress`,
        { progress: Number(newProgress) },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local state
      setMilestones((prev) =>
        prev.map((m) =>
          m._id === milestoneId ? { ...m, progress: Number(newProgress) } : m
        )
      );

      setUpdatingProgress({ ...updatingProgress, [milestoneId]: false });
    } catch (err) {
      console.error('Error updating progress:', err);
      alert(err.response?.data?.message || 'Failed to update progress');
      setUpdatingProgress({ ...updatingProgress, [milestoneId]: false });
    }
  };

  const handleStatusChange = async (milestoneId, newStatus) => {
    try {
      await api.put(
        `/api/milestones/${milestoneId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local state
      setMilestones((prev) =>
        prev.map((m) => (m._id === milestoneId ? { ...m, status: newStatus } : m))
      );

      alert(`Milestone marked as ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      funded: 'status-funded',
      'in-progress': 'status-in-progress',
      submitted: 'status-submitted',
      'under-review': 'status-under-review',
      approved: 'status-approved',
      rejected: 'status-rejected',
      'revision-requested': 'status-revision',
    };
    return statusClasses[status] || 'status-default';
  };

  const getCurrentMilestone = () => {
    return milestones.find(
      (m) =>
        m.status === 'in-progress' ||
        m.status === 'funded' ||
        m.status === 'pending'
    );
  };

  if (loading) {
    return <div className="milestones-loading">Loading milestones...</div>;
  }

  if (error) {
    return <div className="milestones-error">{error}</div>;
  }

  if (milestones.length === 0) {
    return (
      <div className="no-milestones">
        <p>No milestones defined for this project.</p>
      </div>
    );
  }

  const currentMilestone = getCurrentMilestone();
  const completedCount = milestones.filter((m) => m.status === 'approved').length;
  const totalBudget = milestones.reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="project-milestones-container">
      {/* Progress Overview */}
      <div className="milestones-overview">
        <h3>📊 Project Milestones</h3>
        <div className="overview-stats">
          <div className="stat-item">
            <span className="stat-label">Total Milestones:</span>
            <span className="stat-value">{milestones.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Completed:</span>
            <span className="stat-value stat-completed">{completedCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Budget:</span>
            <span className="stat-value">₹{totalBudget.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Current Milestone Highlight */}
      {currentMilestone && userRole === 'freelancer' && (
        <div className="current-milestone-highlight">
          <h4>🎯 Current Focus:</h4>
          <p className="milestone-title">{currentMilestone.title}</p>
          <p className="milestone-amount">₹{currentMilestone.amount.toLocaleString()}</p>
        </div>
      )}

      {/* Milestone List */}
      <div className="milestones-list">
        {milestones.map((milestone, index) => (
          <div
            key={milestone._id}
            className={`milestone-card ${
              currentMilestone?._id === milestone._id ? 'current-milestone' : ''
            }`}
          >
            {/* Milestone Header */}
            <div className="milestone-header">
              <div className="milestone-number">#{milestone.order}</div>
              <div className="milestone-info">
                <h4>{milestone.title}</h4>
                <p className="milestone-description">{milestone.description}</p>
              </div>
              <div className="milestone-amount-badge">
                ₹{milestone.amount.toLocaleString()}
              </div>
            </div>

            {/* Status Badge */}
            <div className="milestone-status-row">
              <span className={`status-badge ${getStatusBadgeClass(milestone.status)}`}>
                {milestone.status.replace('-', ' ')}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="milestone-progress-section">
              <div className="progress-header">
                <span>Progress:</span>
                <span className="progress-percentage">{milestone.progress}%</span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${milestone.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Freelancer Controls */}
            {userRole === 'freelancer' && (
              <div className="milestone-controls">
                {/* Progress Slider */}
                {(milestone.status === 'in-progress' ||
                  milestone.status === 'funded') && (
                  <div className="progress-update-section">
                    <label htmlFor={`progress-${milestone._id}`}>
                      Update Progress:
                    </label>
                    <div className="progress-slider-group">
                      <input
                        type="range"
                        id={`progress-${milestone._id}`}
                        min="0"
                        max="100"
                        step="5"
                        value={milestone.progress}
                        onChange={(e) =>
                          handleProgressUpdate(milestone._id, e.target.value)
                        }
                        disabled={updatingProgress[milestone._id]}
                        className="progress-slider"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={milestone.progress}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, e.target.value));
                          handleProgressUpdate(milestone._id, val);
                        }}
                        disabled={updatingProgress[milestone._id]}
                        className="progress-input"
                      />
                      <span>%</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="milestone-actions">
                  {milestone.status === 'funded' && (
                    <button
                      className="btn-start-work"
                      onClick={() =>
                        handleStatusChange(milestone._id, 'in-progress')
                      }
                    >
                      Start Work
                    </button>
                  )}

                  {milestone.status === 'in-progress' &&
                    milestone.progress === 100 && (
                      <button
                        className="btn-submit"
                        onClick={() =>
                          handleStatusChange(milestone._id, 'submitted')
                        }
                      >
                        Submit for Review
                      </button>
                    )}

                  {milestone.status === 'revision-requested' && (
                    <button
                      className="btn-resubmit"
                      onClick={() =>
                        handleStatusChange(milestone._id, 'submitted')
                      }
                    >
                      Resubmit
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Client Controls */}
            {userRole === 'client' && (
              <div className="milestone-controls">
                {milestone.status === 'submitted' && (
                  <div className="client-review-actions">
                    <button
                      className="btn-approve"
                      onClick={() => handleStatusChange(milestone._id, 'approved')}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="btn-revision"
                      onClick={() =>
                        handleStatusChange(milestone._id, 'revision-requested')
                      }
                    >
                      ↻ Request Revision
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleStatusChange(milestone._id, 'rejected')}
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Dates */}
            <div className="milestone-dates">
              <small>Created: {new Date(milestone.createdAt).toLocaleDateString()}</small>
              {milestone.completedAt && (
                <small>
                  Completed: {new Date(milestone.completedAt).toLocaleDateString()}
                </small>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectMilestones;
