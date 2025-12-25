import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Profile() {
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
  }, [token]);

  if (!user) {
    return (
      <div className="app-container">
        <div className="card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>My Profile</h2>
        <Link to="/edit-profile">
          <button className="btn btn-primary">Edit Profile</button>
        </Link>
      </div>

      <div className="card profile-header">
        <div className="profile-avatar">{initials}</div>

        <div className="profile-info">
          <h3>{user.name}</h3>
          <div className={`badge badge-${user.role === 'freelancer' ? 'in-progress' : 'open'}`}>
            {user.role}
          </div>
          <p className="profile-email">{user.email}</p>
        </div>
      </div>

      <div className="card">
        <h3>About</h3>
        <p>{user.bio || 'No bio added yet.'}</p>
      </div>

      <div className="card">
        <h3>Professional Details</h3>

        <div className="profile-details">
          {user.role === 'freelancer' && (
            <>
              <div>
                <span className="label">Hourly Rate</span>
                <span className="value">
                  {user.hourlyRate ? `₹${user.hourlyRate}/hr` : 'Not specified'}
                </span>
              </div>

              <div>
                <span className="label">Skills</span>
                <span className="value">
                  {user.skills?.length ? user.skills.join(', ') : 'No skills added'}
                </span>
              </div>
            </>
          )}

          <div>
            <span className="label">Location</span>
            <span className="value">{user.location || 'Not specified'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
