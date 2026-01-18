import React, { useState } from 'react';
import '../styles/StarRating.css';

const StarRating = ({ rating, setRating, readOnly = false, size = 24 }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const stars = [1, 2, 3, 4, 5];

  const handleClick = (value) => {
    if (!readOnly && setRating) {
      setRating(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readOnly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(0);
    }
  };

  return (
    <div className="star-rating">
      {stars.map((star) => {
        const filled = (hoverRating || rating) >= star;
        return (
          <span
            key={star}
            className={`star ${readOnly ? 'readonly' : 'interactive'} ${filled ? 'filled' : ''}`}
            style={{
              fontSize: `${size}px`,
              cursor: readOnly ? 'default' : 'pointer',
            }}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
          >
            ★
          </span>
        );
      })}
      {!readOnly && rating > 0 && (
        <span className="rating-value">({rating}/5)</span>
      )}
    </div>
  );
};

export default StarRating;
