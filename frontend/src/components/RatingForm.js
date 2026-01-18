import React, { useState } from 'react';
import StarRating from './StarRating';
import axios from 'axios';
import '../styles/RatingForm.css';

const RatingForm = ({ projectId, reviewedUserId, reviewedUserName, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [dimensions, setDimensions] = useState({
    communication: 0,
    quality: 0,
    professionalism: 0,
    timeliness: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select an overall rating');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/ratings`,
        {
          projectId,
          reviewedUserId,
          rating,
          comment: comment.trim(),
          communication: dimensions.communication || null,
          quality: dimensions.quality || null,
          professionalism: dimensions.professionalism || null,
          timeliness: dimensions.timeliness || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert('Rating submitted successfully!');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rating-form-container">
      <form onSubmit={handleSubmit} className="rating-form">
        <h3>Rate {reviewedUserName}</h3>

        {error && <div className="error-message">{error}</div>}

        <div className="rating-section">
          <label>Overall Rating *</label>
          <StarRating rating={rating} setRating={setRating} size={32} />
        </div>

        <div className="dimension-ratings">
          <h4>Detailed Ratings (Optional)</h4>

          <div className="dimension">
            <label>Communication</label>
            <StarRating
              rating={dimensions.communication}
              setRating={(val) => setDimensions({ ...dimensions, communication: val })}
              size={20}
            />
          </div>

          <div className="dimension">
            <label>Quality</label>
            <StarRating
              rating={dimensions.quality}
              setRating={(val) => setDimensions({ ...dimensions, quality: val })}
              size={20}
            />
          </div>

          <div className="dimension">
            <label>Professionalism</label>
            <StarRating
              rating={dimensions.professionalism}
              setRating={(val) => setDimensions({ ...dimensions, professionalism: val })}
              size={20}
            />
          </div>

          <div className="dimension">
            <label>Timeliness</label>
            <StarRating
              rating={dimensions.timeliness}
              setRating={(val) => setDimensions({ ...dimensions, timeliness: val })}
              size={20}
            />
          </div>
        </div>

        <div className="comment-section">
          <label>Review (Optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience working together..."
            maxLength={500}
            rows={4}
          />
          <small className="char-count">{comment.length}/500 characters</small>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-cancel" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RatingForm;
