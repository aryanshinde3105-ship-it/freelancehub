import React, { useState, useEffect } from 'react';
import api from '../api';
import '../styles/ProjectMilestones.css';
import MilestonePayment from './MilestonePayment';

// Bug 6 Fix: Added 'revision-requested' and 'rejected' to statusOrder so stepper doesn't go blank
const StatusStepper = ({ currentStatus }) => {
  const steps = [
    { key: 'pending', label: 'Created', icon: '📝' },
    { key: 'funded', label: 'Funded', icon: '💰' },
    { key: 'in-progress', label: 'In Progress', icon: '⚡' },
    { key: 'submitted', label: 'Submitted', icon: '📤' },
    { key: 'approved', label: 'Completed', icon: '✅' },
  ];

  const statusOrder = [
    'pending',
    'funded',
    'in-progress',
    'submitted',
    'under-review',
    'revision-requested',
    'rejected',
    'approved',
  ];
  const currentIndex = statusOrder.indexOf(currentStatus);

  // For revision-requested and rejected, highlight the submitted step as active
  // so the stepper shows meaningful progress instead of going blank
  const getEffectiveIndex = () => {
    if (currentStatus === 'revision-requested' || currentStatus === 'rejected') {
      return statusOrder.indexOf('submitted');
    }
    return currentIndex;
  };

  const effectiveIndex = getEffectiveIndex();

  const getStepStatus = (stepIndex) => {
    if (stepIndex < effectiveIndex) return 'completed';
    if (stepIndex === effectiveIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div className="status-stepper">
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(index);
        return (
          <React.Fragment key={step.key}>
            <div className={`step-item ${stepStatus}`}>
              <div className="step-circle">
                {stepStatus === 'completed' ? '✓' : step.icon}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`step-line ${stepStatus === 'completed' ? 'completed' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const ProjectMilestones = ({ projectId, userRole }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingProgress, setUpdatingProgress] = useState({});
  const [submissionNotes, setSubmissionNotes] = useState({});
  // Bug 1 Fix: Local draft state so slider doesn't spam API on every drag tick
  const [progressDraft, setProgressDraft] = useState({});
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

      let milestonesArray = response.data;
      if (response.data.milestones) milestonesArray = response.data.milestones;
      else if (response.data.data) milestonesArray = response.data.data;

      if (!Array.isArray(milestonesArray)) {
        setError('Invalid milestone data format');
        setMilestones([]);
        return;
      }

      const sorted = milestonesArray.sort((a, b) => a.order - b.order);
      setMilestones(sorted);
      // Sync draft state with fetched progress values
      const drafts = {};
      sorted.forEach(m => { drafts[m._id] = m.progress; });
      setProgressDraft(drafts);
      setError('');
    } catch (err) {
      console.error('Error fetching milestones:', err);
      setError('Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  // Bug 1 Fix: Only called on mouseUp/touchEnd/blur, not on every drag tick
  const handleProgressUpdate = async (milestoneId, newProgress) => {
    const val = Number(newProgress);
    try {
      setUpdatingProgress(prev => ({ ...prev, [milestoneId]: true }));
      await api.patch(
        `/api/milestones/${milestoneId}/progress`,
        { progress: val },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMilestones(prev =>
        prev.map(m => m._id === milestoneId ? { ...m, progress: val } : m)
      );
    } catch (err) {
      console.error('Error updating progress:', err);
      alert(err.response?.data?.message || 'Failed to update progress');
      // Revert draft on error
      setProgressDraft(prev => {
        const m = milestones.find(ms => ms._id === milestoneId);
        return { ...prev, [milestoneId]: m ? m.progress : prev[milestoneId] };
      });
    } finally {
      setUpdatingProgress(prev => ({ ...prev, [milestoneId]: false }));
    }
  };

  const handleSubmit = async (milestoneId) => {
    const note = submissionNotes[milestoneId] || '';
    try {
      await api.patch(
        `/api/milestones/${milestoneId}/status`,
        { status: 'submitted', submissionNote: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('📤 Work submitted for client review.');
      fetchMilestones();
    } catch (err) {
      console.error('Error submitting milestone:', err);
      alert(err.response?.data?.message || 'Failed to submit');
    }
  };

  const handleStatusChange = async (milestoneId, newStatus) => {
    try {
      if (newStatus === 'approved') {
        await api.post(
          `/api/payments/release/${milestoneId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('✅ Milestone approved! Payment released to freelancer.');

        const updated = await api.get(`/api/milestones/project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let updatedArray = updated.data;
        if (updated.data.milestones) updatedArray = updated.data.milestones;
        else if (updated.data.data) updatedArray = updated.data.data;

        const allApproved = updatedArray.every(m =>
          m._id === milestoneId ? true : m.status === 'approved'
        );

        if (allApproved) {
          await api.patch(
            `/api/projects/${projectId}/approve`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          alert('🎉 All milestones complete! Project has been marked as completed.');
        }
      } else {
        await api.patch(
          `/api/milestones/${milestoneId}/status`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(`Milestone marked as ${newStatus.replace('-', ' ')}`);
      }
      fetchMilestones();
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { icon: '⏳', label: 'Pending Payment', class: 'status-pending' },
      funded: { icon: '💰', label: 'Funded', class: 'status-funded' },
      'in-progress': { icon: '⚡', label: 'In Progress', class: 'status-in-progress' },
      submitted: { icon: '📤', label: 'Submitted', class: 'status-submitted' },
      'under-review': { icon: '👀', label: 'Under Review', class: 'status-under-review' },
      approved: { icon: '✅', label: 'Approved', class: 'status-approved' },
      rejected: { icon: '❌', label: 'Rejected', class: 'status-rejected' },
      'revision-requested': { icon: '🔄', label: 'Revision Requested', class: 'status-revision' },
    };
    return configs[status] || { icon: '•', label: status, class: 'status-default' };
  };

  const getCurrentMilestone = () =>
    milestones.find(m =>
      m.status === 'in-progress' || m.status === 'funded' || m.status === 'pending'
    );

  if (loading) return (
    <div className="milestones-loading">
      <div className="spinner"></div>
      <p>Loading milestones...</p>
    </div>
  );

  if (error) return <div className="milestones-error">⚠️ {error}</div>;

  if (milestones.length === 0) return (
    <div className="no-milestones">
      <div className="empty-state-icon">📋</div>
      <h3>No milestones yet</h3>
      <p>Milestones will appear here once the client creates them.</p>
    </div>
  );

  const currentMilestone = getCurrentMilestone();
  const completedCount = milestones.filter(m => m.status === 'approved').length;
  const totalBudget = milestones.reduce((sum, m) => sum + m.amount, 0);
  const earnedAmount = milestones
    .filter(m => m.status === 'approved')
    .reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="project-milestones-container">
      {/* Overview */}
      <div className="milestones-overview-premium">
        <div className="overview-header">
          <h3>Project Milestones</h3>
          <div className="completion-badge">{completedCount} of {milestones.length} completed</div>
        </div>

        <div className="overview-stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <span className="stat-label">Total Milestones</span>
              <span className="stat-value">{milestones.length}</span>
            </div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{completedCount}</span>
            </div>
          </div>
          <div className="stat-card stat-primary">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <span className="stat-label">Total Budget</span>
              <span className="stat-value">₹{totalBudget.toLocaleString()}</span>
            </div>
          </div>
          {userRole === 'freelancer' && (
            <div className="stat-card stat-earned">
              <div className="stat-icon">💵</div>
              <div className="stat-content">
                <span className="stat-label">Earned</span>
                <span className="stat-value">₹{earnedAmount.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Milestone Spotlight */}
      {currentMilestone && userRole === 'freelancer' && (
        <div className="current-milestone-spotlight">
          <div className="spotlight-header">
            <span className="spotlight-badge">🎯 Current Focus</span>
            <span className="spotlight-amount">₹{currentMilestone.amount.toLocaleString()}</span>
          </div>
          <h4 className="spotlight-title">{currentMilestone.title}</h4>
          <p className="spotlight-description">{currentMilestone.description}</p>
          <div className="spotlight-progress">
            <div className="spotlight-progress-bar">
              <div
                className="spotlight-progress-fill"
                style={{ width: `${progressDraft[currentMilestone._id] ?? currentMilestone.progress}%` }}
              />
            </div>
            <span className="spotlight-progress-text">
              {progressDraft[currentMilestone._id] ?? currentMilestone.progress}% complete
            </span>
          </div>
        </div>
      )}

      {/* Milestone List */}
      <div className="milestones-list">
        {milestones.map((milestone) => {
          const statusConfig = getStatusConfig(milestone.status);
          const draft = progressDraft[milestone._id] ?? milestone.progress;

          return (
            <div
              key={milestone._id}
              className={`milestone-card-premium ${
                currentMilestone?._id === milestone._id ? 'current-active' : ''
              } ${milestone.status === 'approved' ? 'completed' : ''}`}
            >
              <StatusStepper currentStatus={milestone.status} />

              <div className="milestone-header-premium">
                <div className="milestone-badge-number">#{milestone.order}</div>
                <div className="milestone-info-premium">
                  <h4>{milestone.title}</h4>
                  <p className="milestone-description">{milestone.description}</p>
                </div>
              </div>

              <div className="milestone-meta-row">
                <span className={`status-badge-premium ${statusConfig.class}`}>
                  <span className="status-icon">{statusConfig.icon}</span>
                  {statusConfig.label}
                </span>
                <div className="amount-badge-premium">₹{milestone.amount.toLocaleString()}</div>
              </div>

              <div className="progress-section-premium">
                <div className="progress-header-premium">
                  <span className="progress-label">Progress</span>
                  <span className="progress-percentage-premium">{draft}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${draft}%` }}>
                    <div className="progress-glow"></div>
                  </div>
                </div>
              </div>

              {/* ── FREELANCER CONTROLS ── */}
              {userRole === 'freelancer' && (
                <div className="milestone-controls-premium">
                  {/* Bug 3 Fix: Show slider for both 'funded' and 'in-progress' statuses */}
                  {(milestone.status === 'in-progress' || milestone.status === 'funded') && (
                    <div className="progress-update-premium">
                      <label>Update Progress</label>
                      <div className="slider-group">
                        {/* Bug 1 Fix: onChange updates local draft only; API called on mouseUp/touchEnd */}
                        <input
                          type="range" min="0" max="100" step="5"
                          value={draft}
                          onChange={(e) =>
                            setProgressDraft(prev => ({ ...prev, [milestone._id]: Number(e.target.value) }))
                          }
                          onMouseUp={(e) => handleProgressUpdate(milestone._id, e.target.value)}
                          onTouchEnd={(e) => handleProgressUpdate(milestone._id, e.target.value)}
                          disabled={updatingProgress[milestone._id]}
                          className="progress-slider-premium"
                        />
                        <div className="progress-input-group">
                          {/* Bug 1 Fix: number input calls API on blur only */}
                          <input
                            type="number" min="0" max="100"
                            value={draft}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, Number(e.target.value)));
                              setProgressDraft(prev => ({ ...prev, [milestone._id]: val }));
                            }}
                            onBlur={(e) => {
                              const val = Math.min(100, Math.max(0, Number(e.target.value)));
                              handleProgressUpdate(milestone._id, val);
                            }}
                            disabled={updatingProgress[milestone._id]}
                            className="progress-input-premium"
                          />
                          <span className="progress-unit">%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="action-buttons-premium">
                    {milestone.status === 'funded' && (
                      <button
                        className="btn-premium btn-start"
                        onClick={() => handleStatusChange(milestone._id, 'in-progress')}
                      >
                        <span className="btn-icon">🚀</span> Start Work
                      </button>
                    )}

                    {/* Bug 2 Fix: Use Number() to avoid string vs number strict equality issue */}
                    {milestone.status === 'in-progress' && Number(draft) === 100 && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <label style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          display: 'block',
                          marginBottom: '0.4rem',
                        }}>
                          Submission note to client (optional)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Describe what you've completed, any notes for the client..."
                          value={submissionNotes[milestone._id] || ''}
                          onChange={(e) =>
                            setSubmissionNotes(prev => ({ ...prev, [milestone._id]: e.target.value }))
                          }
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            fontSize: '0.875rem',
                            marginBottom: '0.5rem',
                          }}
                        />
                        <button
                          className="btn-premium btn-submit"
                          onClick={() => handleSubmit(milestone._id)}
                        >
                          <span className="btn-icon">📤</span> Submit for Review
                        </button>
                      </div>
                    )}

                    {milestone.status === 'revision-requested' && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <label style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          display: 'block',
                          marginBottom: '0.4rem',
                        }}>
                          Resubmission note
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Describe changes made..."
                          value={submissionNotes[milestone._id] || ''}
                          onChange={(e) =>
                            setSubmissionNotes(prev => ({ ...prev, [milestone._id]: e.target.value }))
                          }
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            fontSize: '0.875rem',
                            marginBottom: '0.5rem',
                          }}
                        />
                        <button
                          className="btn-premium btn-resubmit"
                          onClick={() => handleSubmit(milestone._id)}
                        >
                          <span className="btn-icon">🔄</span> Resubmit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── CLIENT CONTROLS ── */}
              {userRole === 'client' && (
                <div className="milestone-controls-premium">
                  {milestone.payment.status === 'pending' && milestone.status === 'pending' && (
                    <MilestonePayment milestone={milestone} onPaymentSuccess={fetchMilestones} />
                  )}

                  {milestone.status === 'submitted' && (
                    <div className="review-actions-premium">
                      {milestone.submissionNotes && (
                        <div style={{
                          marginBottom: '1rem',
                          padding: '0.75rem',
                          background: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          color: '#14532d',
                        }}>
                          <strong>📝 Freelancer's note:</strong>
                          <p style={{ margin: '0.25rem 0 0' }}>{milestone.submissionNotes}</p>
                        </div>
                      )}

                      <button
                        className="btn-premium btn-approve"
                        onClick={() => handleStatusChange(milestone._id, 'approved')}
                      >
                        <span className="btn-icon">✓</span> Approve & Release Payment
                      </button>
                      <button
                        className="btn-premium btn-revision"
                        onClick={() => handleStatusChange(milestone._id, 'revision-requested')}
                      >
                        <span className="btn-icon">↻</span> Request Revision
                      </button>
                      <button
                        className="btn-premium btn-reject"
                        onClick={() => handleStatusChange(milestone._id, 'rejected')}
                      >
                        <span className="btn-icon">✗</span> Reject
                      </button>
                    </div>
                  )}

                  {milestone.payment.status !== 'pending' && (
                    <div className="payment-status-card">
                      <strong>Payment Status:</strong>
                      <span className={`payment-status-badge ${milestone.payment.status}`}>
                        {milestone.payment.status === 'paid' && '💰 Held in Escrow'}
                        {milestone.payment.status === 'released' && '✅ Released to Freelancer'}
                        {milestone.payment.status === 'refunded' && '↩️ Refunded'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="milestone-footer-premium">
                <span className="footer-date">
                  <span className="footer-icon">📅</span>
                  Created {new Date(milestone.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
                {milestone.completedAt && (
                  <span className="footer-date footer-completed">
                    <span className="footer-icon">✅</span>
                    Completed {new Date(milestone.completedAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectMilestones;
