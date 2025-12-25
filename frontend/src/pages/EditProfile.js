import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { getCurrentUser } from '../auth';

function EditProfile() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // 🔑 local editable state (decoupled)
  const [form, setForm] = useState({
    bio: '',
    skills: '',
    hourlyRate: '',
    location: '',
  });

  const [loading, setLoading] = useState(false);

  // ✅ initialize ONCE
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;

    setForm({
      bio: user.bio || '',
      skills: user.skills ? user.skills.join(', ') : '',
      hourlyRate: user.hourlyRate || '',
      location: user.location || '',
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = getCurrentUser();

      const payload = {
        bio: form.bio,
        location: form.location,
      };

      if (user.role === 'freelancer') {
        payload.skills = form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        payload.hourlyRate = form.hourlyRate || null;
      }

      const res = await api.put('/api/users/profile', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // update stored user
      localStorage.setItem('user', JSON.stringify(res.data));

      navigate('/profile');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h2>Edit Profile</h2>

      <form className="card" onSubmit={handleSubmit}>
        <div className="mt-2">
          <label>Bio</label>
          <textarea
            name="bio"
            rows="4"
            value={form.bio}
            onChange={handleChange}
            placeholder="Tell others about yourself"
          />
        </div>

        <div className="mt-2">
          <label>Location</label>
          <input
            name="location"
            type="text"
            value={form.location}
            onChange={handleChange}
            placeholder="City, Country"
          />
        </div>

        {getCurrentUser()?.role === 'freelancer' && (
          <>
            <div className="mt-2">
              <label>Skills (comma separated)</label>
              <input
                name="skills"
                type="text"
                value={form.skills}
                onChange={handleChange}
                placeholder="React, Node.js, MongoDB"
              />
            </div>

            <div className="mt-2">
              <label>Hourly Rate (₹)</label>
              <input
                name="hourlyRate"
                type="number"
                value={form.hourlyRate}
                onChange={handleChange}
                placeholder="e.g. 500"
              />
            </div>
          </>
        )}

        <div className="mt-3" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/profile')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProfile;
