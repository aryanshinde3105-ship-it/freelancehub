import React from 'react';
import '../styles/MilestoneProgress.css';

const MilestoneProgress = ({ milestones, overallProgress = 0 }) => {
  const completedCount = milestones.filter((m) => m.status === 'approved').length;
  const totalCount = milestones.length;

  return (
    <div className="milestone-progress-container">
      <div className="overall-progress-header">
        <h4>Project Progress</h4>
        <span className="overall-percentage">{overallProgress}%</span>
      </div>

      <div className="overall-progress-bar">
        <div
          className="overall-progress-fill"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      <div className="progress-stats">
        <div className="stat">
          <span className="stat-label">Completed</span>
          <span className="stat-value">
            {completedCount} / {totalCount}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">In Progress</span>
          <span className="stat-value">
            {milestones.filter((m) => m.status === 'in-progress').length}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Pending</span>
          <span className="stat-value">
            {milestones.filter((m) => m.status === 'pending').length}
          </span>
        </div>
      </div>

      <div className="milestone-timeline">
        {milestones.map((milestone, index) => (
          <div key={index} className="timeline-item">
            <div
              className={`timeline-dot ${
                milestone.status === 'approved' ? 'completed' : 
                milestone.status === 'in-progress' ? 'active' : 
                'pending'
              }`}
            >
              {milestone.status === 'approved' ? '✓' : index + 1}
            </div>
            <div className="timeline-content">
              <div className="timeline-title">{milestone.title}</div>
              <div className="timeline-progress">{milestone.progress || 0}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MilestoneProgress;
