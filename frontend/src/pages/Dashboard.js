import React from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../auth';

function Dashboard() {
  const user = getCurrentUser();

  if (!user) {
    return (
      <div className="app-container text-center">
        <h2>Please log in</h2>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div className="card">
        <h2>Welcome back, {user.name} 👋</h2>
        <p>
          You are logged in as <b>{user.role}</b>
        </p>
      </div>

      {/* Primary Actions */}
      <div className="card">
        <h3>Quick Actions</h3>

        {user.role === 'client' && (
          <div className="mt-2">
            <Link to="/post-project">
              <button className="btn btn-primary">
                + Post a New Project
              </button>
            </Link>
          </div>
        )}

        {user.role === 'freelancer' && (
          <div className="mt-2">
            <Link to="/browse-projects">
              <button className="btn btn-primary">
                🔍 Browse Projects
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="card">
        <h3>Your Workspace</h3>

        <div className="mt-2" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {user.role === 'client' && (
            <>
              <Link to="/my-projects">
                <button className="btn btn-secondary">
                  📁 My Projects
                </button>
              </Link>

              <Link to="/chats">
                <button className="btn btn-secondary">
                  💬 Chats
                </button>
              </Link>
            </>
          )}

          {user.role === 'freelancer' && (
            <>
              <Link to="/my-proposals">
                <button className="btn btn-secondary">
                  📄 My Proposals
                </button>
              </Link>

              <Link to="/active-projects">
                <button className="btn btn-secondary">
                  🛠 Active Work
                </button>
              </Link>

              <Link to="/chats">
                <button className="btn btn-secondary">
                  💬 Chats
                </button>
              </Link>
            </>
          )}

          <Link to="/profile">
            <button className="btn btn-secondary">
              👤 Profile
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
