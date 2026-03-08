import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import '../styles/ProjectMilestones.css';
import MilestonePayment from './MilestonePayment';

/* ─── Submission Modal ──────────────────────────────────────────────────── */
const SubmitWorkModal = ({ milestone, onClose, onSuccess }) => {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const token = localStorage.getItem('token');

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please attach at least one file.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('milestoneFile', f));
      if (message.trim()) formData.append('message', message.trim());

      await api.post(`/api/milestones/${milestone._id}/submit`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="submit-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="submit-modal">
        <div className="submit-modal-header">
          <h3 id="submit-modal-title">📤 Submit Work</h3>
          <button className="submit-modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <p className="submit-modal-subtitle">
          <strong>{milestone.title}</strong> — attach your deliverable files and an optional note for the client.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="submit-modal-field">
            <label className="submit-modal-label">Files <span style={{ color: 'red' }}>*</span></label>
            <div
              className="file-drop-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              {files.length === 0 ? (
                <>
                  <span className="file-drop-icon">📁</span>
                  <span>Click to choose files</span>
                  <span className="file-drop-hint">PDF, PNG, JPG, ZIP · Max 10 MB each</span>
                </>
              ) : (
                <ul className="file-list">
                  {files.map((f, i) => (
                    <li key={i}>✅ {f.name} <span className="file-size">({(f.size / 1024).toFixed(1)} KB)</span></li>
                  ))}
                </ul>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              name="milestoneFile"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.zip"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          <div className="submit-modal-field">
            <label className="submit-modal-label">Message to client <span className="optional">(optional)</span></label>
            <textarea
              className="submit-modal-textarea"
              rows={4}
              placeholder="Describe what you've completed, any notes for the client…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {error && <p className="submit-modal-error">{error}</p>}

          <div className="submit-modal-actions">
            <button type="button" className="btn-premium btn-cancel-modal" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-premium btn-submit" disabled={submitting}>
              {submitting ? 'Submitting…' : <><span className="btn-icon">📤</span> Submit for Review</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Submissions History ───────────────────────────────────────────────── */
const SubmissionsHistory = ({ submissions }) => {
  if (!submissions || submissions.length === 0) return null;

  const formatRelative = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  return (
    <div className="submissions-history">
      <h5 className="submissions-heading">📦 Deliverables</h5>
      <div className="submissions-list">
        {submissions.map((sub, idx) => (
          <div key={sub._id || idx} className="submission-entry">
            <div className="submission-label">
              <span className="submission-index">Submission {idx + 1}</span>
              <span className="submission-time">{formatRelative(sub.submittedAt)}</span>
            </div>
            <ul className="submission-files">
              {sub.files.map((file, fi) => (
                <li key={fi}>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="submission-file-link"
                  >
                    <span className="file-icon">📄</span>
                    {file.filename}
                  </a>
                </li>
              ))}
            </ul>
            {sub.message && (
              <div className="submission-note">
                <span className="submission-note-label">💬 Note from freelancer</span>
                <p className="submission-message">{sub.message}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Bug 6 Fix: Added 'revision-requested', 'rejected', 'cancelled' to statusOrder so stepper doesn't go blank
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
    'cancelled',
    'approved',
  ];
  const currentIndex = statusOrder.indexOf(currentStatus);

  // For revision-requested, rejected, and cancelled — pin the stepper at the
  // 'submitted' step so it shows meaningful progress instead of going blank
  const getEffectiveIndex = () => {
    if (
      currentStatus === 'revision-requested' ||
      currentStatus === 'rejected' ||
      currentStatus === 'cancelled'
    ) {
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
  // Bug 1 Fix: Local draft state so slider doesn't spam API on every drag tick
  const [progressDraft, setProgressDraft] = useState({});
  const [submitModal, setSubmitModal] = useState(null); // milestone object or null
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

  const handleSubmitSuccess = () => {
    setSubmitModal(null);
    alert('📤 Work submitted for client review.');
    fetchMilestones();
  };

  const handleStatusChange = async (milestoneId, newStatus, extra = {}) => {
    try {
      if (newStatus === 'approved') {
        const { data } = await api.post(
          `/api/payments/release/${milestoneId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data.projectCompleted) {
          alert('🎉 All milestones complete! Project has been marked as completed.');
        } else {
          alert('✅ Milestone approved! Payment released to freelancer.');
        }
      } else if (newStatus === 'cancelled') {
        const confirmed = window.confirm(
          'Cancel this milestone? The escrowed payment (if any) will be refunded to you. This cannot be undone.'
        );
        if (!confirmed) return;
        await api.patch(
          `/api/milestones/${milestoneId}/status`,
          { status: 'cancelled' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('🚫 Milestone cancelled. Any escrowed payment has been refunded.');
      } else if (newStatus === 'revision-requested') {
        const revisionNotes = extra.revisionNotes ||
          window.prompt('Please describe what needs to be revised:');
        if (!revisionNotes || !revisionNotes.trim()) {
          alert('Revision notes are required.');
          return;
        }
        await api.patch(
          `/api/milestones/${milestoneId}/status`,
          { status: 'revision-requested', revisionNotes },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('🔄 Revision requested.');
      } else {
        await api.patch(
          `/api/milestones/${milestoneId}/status`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(`Milestone marked as ${newStatus.replace(/-/g, ' ')}`);
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
      cancelled: { icon: '🚫', label: 'Cancelled', class: 'status-cancelled' },
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
      {/* Submit Work Modal */}
      {submitModal && (
        <SubmitWorkModal
          milestone={submitModal}
          onClose={() => setSubmitModal(null)}
          onSuccess={handleSubmitSuccess}
        />
      )}
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
              } ${milestone.status === 'approved' || milestone.status === 'cancelled' ? 'completed' : ''}`}
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

                    {/* Submit Work button — visible for in-progress and revision-requested */}
                    {(milestone.status === 'in-progress' || milestone.status === 'revision-requested') && (
                      <button
                        className="btn-premium btn-submit"
                        onClick={() => setSubmitModal(milestone)}
                      >
                        <span className="btn-icon">📤</span>
                        {milestone.status === 'revision-requested' ? 'Resubmit Work' : 'Submit Work'}
                      </button>
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

                  {/* Review actions: only shown when status is submitted AND at least one submission exists */}
                  {milestone.status === 'submitted' &&
                   milestone.submissions &&
                   milestone.submissions.length > 0 && (
                    <div className="review-actions-premium">
                      {/* Show message from the latest submission, if any */}
                      {milestone.submissions[milestone.submissions.length - 1].message && (
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
                          <p style={{ margin: '0.25rem 0 0' }}>
                            {milestone.submissions[milestone.submissions.length - 1].message}
                          </p>
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

                  {/* Rejected milestone: client can give another chance or cancel it */}
                  {milestone.status === 'rejected' && (
                    <div className="review-actions-premium">
                      <div style={{
                        marginBottom: '0.75rem',
                        padding: '0.75rem',
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: '#9a3412',
                      }}>
                        ⚠️ This milestone was <strong>rejected</strong>. You can reopen it for
                        revision, or cancel it to unblock the rest of the project.
                      </div>
                      <button
                        className="btn-premium btn-revision"
                        onClick={() => handleStatusChange(milestone._id, 'revision-requested')}
                      >
                        <span className="btn-icon">↻</span> Reopen for Revision
                      </button>
                      <button
                        className="btn-premium btn-reject"
                        onClick={() => handleStatusChange(milestone._id, 'cancelled')}
                      >
                        <span className="btn-icon">🚫</span> Cancel Milestone
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

              {/* Submissions history — visible to both roles */}
              {milestone.submissions && milestone.submissions.length > 0 && (
                <SubmissionsHistory submissions={milestone.submissions} />
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
