import React from 'react';

function ProjectProgress({ status, milestones }) {
  let percent = 0;
  let label = '';

  if (milestones && milestones.length > 0) {
    // Milestone-based: calculate from actual milestone completion
    const approved = milestones.filter(m => m.status === 'approved').length;
    percent = Math.round((approved / milestones.length) * 100);
    label = `${approved} of ${milestones.length} milestones complete`;
  } else {
    // Fixed-price: derive from project status
    if (status === 'open') percent = 10;
    if (status === 'in-progress') percent = 40;
    if (status === 'pending-approval') percent = 80;
    if (status === 'completed') percent = 100;
    label = `${percent}% complete`;
  }

  const color = percent === 100 ? '#16a34a' : '#667eea';

  return (
    <div style={{ margin: '0.5rem 0' }}>
      <div style={{ height: '10px', background: '#eee', borderRadius: '5px' }}>
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: color,
            borderRadius: '5px',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <small style={{ color: '#555' }}>{label}</small>
    </div>
  );
}

export default ProjectProgress;
