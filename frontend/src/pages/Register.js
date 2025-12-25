import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { loginUser } from '../auth';

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await api.post('/api/auth/register', formData);

      // ✅ STORE TOKEN + USER TOGETHER (FIX)
      loginUser(res.data);

      // ✅ client-side navigation (no reload)
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h2>Create Account</h2>

      <div className="card">
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <input
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="client">Client</option>
            <option value="freelancer">Freelancer</option>
          </select>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        {message && (
          <p style={{ marginTop: '1rem', color: 'red' }}>{message}</p>
        )}
      </div>
    </div>
  );
}

export default Register;
