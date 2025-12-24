import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function PostProject() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Web Development',
    requiredSkills: '',
    budget: '',
    deadline: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ✅ redirect moved to effect
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const skillsArray = formData.requiredSkills
        ? formData.requiredSkills.split(',').map(s => s.trim())
        : [];

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        requiredSkills: skillsArray,
        budget: Number(formData.budget),
        deadline: formData.deadline || undefined,
      };

      await api.post('/api/projects', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage('Project created successfully!');
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message || 'Failed to create project.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Post a Project</h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
      >
        <input
          name="title"
          placeholder="Project Title"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Project Description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          required
        />

        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
        >
          <option value="Web Development">Web Development</option>
          <option value="App Development">App Development</option>
          <option value="AI/ML">AI/ML</option>
          <option value="Other">Other</option>
        </select>

        <input
          name="requiredSkills"
          placeholder="Required skills (comma separated)"
          value={formData.requiredSkills}
          onChange={handleChange}
        />

        <input
          name="budget"
          type="number"
          placeholder="Budget (₹)"
          value={formData.budget}
          onChange={handleChange}
          required
        />

        <input
          name="deadline"
          type="date"
          value={formData.deadline}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Posting…' : 'Post Project'}
        </button>
      </form>

      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
    </div>
  );
}

export default PostProject;
