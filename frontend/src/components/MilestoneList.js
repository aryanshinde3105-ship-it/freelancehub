import React from 'react';
import '../styles/MilestoneList.css';

const MilestoneList = ({ milestones, onEdit, onDelete, isEditable = true }) => {
  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', color: '#9ca3af' },
      funded: { label: 'Funded', color: '#3b82f6' },
      'in-progress': { label: 'In Progress', color: '#f59e0b' },
      submitted: { label: 'Submitted', color: '#8b5cf6' },
      'under-review': { label: 'Under Review', color: '#06b6d4' },
      'revision-requested': { label: 'Revision', color: '#f97316' },
      approved: { label: 'Approved', color: '#10b981' },
      rejected: { label: 'Rejected', color: '#ef4444' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span
        className="milestone-status-badge"
        style={{ backgroundColor: config.color }}
      >
        {config.label}
      </span>
    );
  };

  const getProgressColor = (progress) => {
    if (progress === 0) return '#e5e7eb';
    if (progress < 50) return '#f59e0b';
    if (progress < 100) return '#3b82f6';
    return '#10b981';
  };

  return (
    <div className="milestone-list-container">
      <div className="milestone-list-header">
        <h3>Milestones ({milestones.length})</h3>
        <div className="total-budget">
          Total Budget: <strong>₹{totalAmount.toLocaleString()}</strong>
        </div>
      </div>

      {milestones.length === 0 ? (
        <div className="empty-milestones">
          <p>No milestones added yet</p>
        </div>
      ) : (
        <div className="milestone-cards">
          {milestones.map((milestone, index) => (
            <div key={index} className="milestone-card">
              <div className="milestone-card-header">
                <div className="milestone-number">#{milestone.order || index + 1}</div>
                <h4>{milestone.title}</h4>
                {milestone.status && getStatusBadge(milestone.status)}
              </div>

              <p className="milestone-description">{milestone.description}</p>

              {milestone.progress !== undefined && (
                <div className="milestone-progress">
                  <div className="progress-info">
                    <span>Progress</span>
                    <span className="progress-percentage">{milestone.progress}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${milestone.progress}%`,
                        backgroundColor: getProgressColor(milestone.progress),
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="milestone-footer">
                <div className="milestone-amount">₹{milestone.amount.toLocaleString()}</div>

                {isEditable && !milestone._id && (
                  <div className="milestone-actions">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(index)}
                        className="btn-icon"
                        title="Edit"
                      >
                        ✏️
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(index)}
                        className="btn-icon btn-danger"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}

                {milestone.payment?.status && (
                  <div className="payment-status">
                    Payment: <strong>{milestone.payment.status}</strong>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MilestoneList;
