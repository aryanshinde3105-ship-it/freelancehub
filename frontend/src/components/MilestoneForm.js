import React, { useState } from 'react';
import '../styles/MilestoneForm.css';

const MilestoneForm = ({ onAdd, onCancel, existingMilestones = [] }) => {
  const [milestone, setMilestone] = useState({
    title: '',
    description: '',
    amount: '',
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!milestone.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!milestone.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!milestone.amount || milestone.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validate()) return;

    const newMilestone = {
      ...milestone,
      amount: parseInt(milestone.amount, 10), // ✅ Parse as integer
      order: existingMilestones.length + 1,
    };

    onAdd(newMilestone);

    // Reset form
    setMilestone({
      title: '',
      description: '',
      amount: '',
    });
    setErrors({});
  };

  return (
    <div className="milestone-form-card">
      <h4>Add Milestone</h4>
      <div className="milestone-form">
        <div className="form-group">
          <label>Milestone Title *</label>
          <input
            type="text"
            value={milestone.title}
            onChange={(e) => setMilestone({ ...milestone, title: e.target.value })}
            placeholder="e.g., UI Design Phase"
            maxLength={100}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          />
          {errors.title && <span className="error-text">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            value={milestone.description}
            onChange={(e) => setMilestone({ ...milestone, description: e.target.value })}
            placeholder="Describe what needs to be completed in this milestone..."
            rows={3}
            maxLength={500}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
              }
            }}
          />
          {errors.description && <span className="error-text">{errors.description}</span>}
        </div>

        <div className="form-group">
          <label>Amount (₹) *</label>
          <input
            type="number"
            value={milestone.amount}
            onChange={(e) => {
              const value = e.target.value;
              // ✅ Only allow whole numbers (no decimals)
              if (value === '' || /^\d+$/.test(value)) {
                setMilestone({ ...milestone, amount: value });
              }
            }}
            placeholder="5000"
            min="1"
            step="1" // ✅ Whole numbers only
            onWheel={(e) => e.target.blur()} // ✅ Disable scroll wheel changes
            onKeyDown={(e) => {
              // ✅ Prevent decimal point, comma, minus, and 'e'
              if (e.key === '.' || e.key === ',' || e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
              }
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd(e);
              }
            }}
          />
          {errors.amount && <span className="error-text">{errors.amount}</span>}
          <small className="form-hint">Enter amount in whole rupees (no paisa)</small>
        </div>

        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleAdd}
            className="btn-primary"
          >
            Add Milestone
          </button>
        </div>
      </div>
    </div>
  );
};

export default MilestoneForm;
