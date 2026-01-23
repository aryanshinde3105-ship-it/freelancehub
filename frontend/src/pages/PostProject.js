import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import MilestoneForm from '../components/MilestoneForm';
import MilestoneList from '../components/MilestoneList';
import '../styles/PostProject.css';

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
    paymentType: 'milestone-based',
  });

  const [milestones, setMilestones] = useState([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ NEW: Handle budget input with whole number validation
  const handleBudgetChange = (e) => {
    const value = e.target.value;
    // Only allow whole numbers (no decimals)
    if (value === '' || /^\d+$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        budget: value,
      }));
    }
  };

  const handleAddMilestone = (milestone) => {
    setMilestones([...milestones, milestone]);
    setShowMilestoneForm(false);
  };

  const handleDeleteMilestone = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const validateMilestones = () => {
    if (formData.paymentType === 'milestone-based' && milestones.length === 0) {
      setMessage('Please add at least one milestone for milestone-based payment');
      return false;
    }

    if (formData.paymentType === 'milestone-based') {
      const totalMilestoneAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
      const projectBudget = Number(formData.budget);

      if (totalMilestoneAmount !== projectBudget) {
        setMessage(
          `Milestone total (₹${totalMilestoneAmount}) must equal project budget (₹${projectBudget})`
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!validateMilestones()) {
      setLoading(false);
      return;
    }

    try {
      const skillsArray = formData.requiredSkills
        ? formData.requiredSkills.split(',').map((s) => s.trim())
        : [];

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        requiredSkills: skillsArray,
        budget: Number(formData.budget),
        deadline: formData.deadline || undefined,
        paymentType: formData.paymentType,
      };

      // Create project
      const projectRes = await api.post('/api/projects', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // ✅ FIXED: Handle different response structures
      const project = projectRes.data.project || projectRes.data;
      const projectId = project._id;

      console.log('Project created successfully:', project); // Debug

      // Create milestones if milestone-based
      if (formData.paymentType === 'milestone-based' && milestones.length > 0) {
        const milestonePromises = milestones.map((milestone) =>
          api.post(
            '/api/milestones',
            {
              projectId,
              ...milestone,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        );

        await Promise.all(milestonePromises);
        console.log('All milestones created successfully'); // Debug
      }

      setMessage('Project created successfully with milestones!');

      // Redirect to my projects after 2 seconds
      setTimeout(() => {
        navigate('/my-projects');
      }, 2000);
    } catch (err) {
      console.error('Error creating project:', err);
      console.error('Error response:', err.response?.data); // ✅ Added detailed error log
      setMessage(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };


  const milestoneTotal = milestones.reduce((sum, m) => sum + m.amount, 0);
  const budgetRemaining = Number(formData.budget) - milestoneTotal;

  return (
    <div className="post-project-container">
      <h2>Post a Project</h2>

      <form onSubmit={handleSubmit} className="post-project-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-group">
            <label>Project Title *</label>
            <input
              name="title"
              placeholder="e.g., Build a responsive website"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              placeholder="Describe your project requirements in detail..."
              value={formData.description}
              onChange={handleChange}
              rows={5}
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="Web Development">Web Development</option>
              <option value="App Development">App Development</option>
              <option value="AI/ML">AI/ML</option>
              <option value="UI/UX Design">UI/UX Design</option>
              <option value="Content Writing">Content Writing</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Required Skills</label>
            <input
              name="requiredSkills"
              placeholder="React, Node.js, MongoDB (comma separated)"
              value={formData.requiredSkills}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Budget & Timeline */}
        <div className="form-section">
          <h3>Budget & Timeline</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Total Budget (₹) *</label>
              <input
                name="budget"
                type="number"
                placeholder="15000"
                value={formData.budget}
                onChange={handleBudgetChange} // ✅ Updated handler
                min="1"
                step="1" // ✅ Whole numbers only
                onWheel={(e) => e.target.blur()} // ✅ Disable scroll wheel
                onKeyDown={(e) => {
                  // ✅ Prevent decimal point, comma, minus, and 'e'
                  if (e.key === '.' || e.key === ',' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                required
              />
              <small className="form-hint">Enter amount in whole rupees (no paisa)</small>
            </div>

            <div className="form-group">
              <label>Deadline</label>
              <input
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Payment Type */}
          <div className="form-group">
            <label>Payment Type *</label>
            <select
              name="paymentType"
              value={formData.paymentType}
              onChange={handleChange}
            >
              <option value="milestone-based">Milestone-Based (Recommended)</option>
              <option value="fixed-price">Fixed Price (Pay at completion)</option>
            </select>
            <small className="form-hint">
              Milestone-based payments provide better project tracking and security
            </small>
          </div>
        </div>

        {/* Milestones Section */}
        {formData.paymentType === 'milestone-based' && (
          <div className="form-section milestones-section">
            <div className="section-header">
              <h3>Project Milestones</h3>
              <button
                type="button"
                onClick={() => setShowMilestoneForm(!showMilestoneForm)}
                className="btn-add-milestone"
              >
                {showMilestoneForm ? '− Cancel' : '+ Add Milestone'}
              </button>
            </div>

            {formData.budget && (
              <div className="budget-tracker">
                <div className="budget-info">
                  <span>Budget Allocated:</span>
                  <strong>₹{milestoneTotal.toLocaleString()}</strong>
                </div>
                <div className="budget-info">
                  <span>Remaining:</span>
                  <strong
                    style={{
                      color: budgetRemaining === 0 ? '#10b981' :
                        budgetRemaining < 0 ? '#ef4444' : '#f59e0b'
                    }}
                  >
                    ₹{budgetRemaining.toLocaleString()}
                  </strong>
                </div>
              </div>
            )}

            {showMilestoneForm && (
              <MilestoneForm
                onAdd={handleAddMilestone}
                onCancel={() => setShowMilestoneForm(false)}
                existingMilestones={milestones}
              />
            )}

            <MilestoneList
              milestones={milestones}
              onDelete={handleDeleteMilestone}
              isEditable={true}
            />

            {milestones.length === 0 && (
              <div className="empty-milestones-hint">
                <p>💡 Add milestones to break your project into manageable phases</p>
                <p>Example: Design Phase (₹5,000) → Development (₹8,000) → Testing (₹2,000)</p>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/browse-projects')}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating Project...' : 'Post Project'}
          </button>
        </div>
      </form>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default PostProject;
