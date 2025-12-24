import React from 'react';
import { getCurrentUser } from '../auth';

function Profile() {
  const user = getCurrentUser();

  if (!user) {
    return (
      <div className="app-container">
        <div className="card">
          <p>User information not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <h2>My Profile</h2>

      <div className="card">
        <p><b>Name:</b> {user.name}</p>
        <p><b>Email:</b> {user.email}</p>
        <p><b>Role:</b> {user.role}</p>
      </div>
    </div>
  );
}

export default Profile;
