import React from 'react';

function ProjectProgress({ status }) {
  let percent = 0;

  if (status === 'open') percent = 10;
  if (status === 'in-progress') percent = 40;
  if (status === 'pending-approval') percent = 80;
  if (status === 'completed') percent = 100;

  return (
    <div style={{ margin: '0.5rem 0' }}>
      <div
        style={{
          height: '10px',
          background: '#eee',
          borderRadius: '5px',
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: '#4caf50',
            borderRadius: '5px',
          }}
        />
      </div>
      <small>{percent}% complete</small>
    </div>
  );
}

export default ProjectProgress;
