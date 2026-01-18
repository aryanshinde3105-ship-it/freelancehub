import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import api from '../api';
import '../styles/ProfileRatings.css';

const ProfileRatings = ({ userId }) => {
  const [ratings, setRatings] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentPage]);

  const fetchRatings = async () => {
    setLoading(true);
    setError('');
    try {
      const [ratingsRes, userRes] = await Promise.all([
        api.get(`/api/ratings/user/${userId}`, {
          params: { page: currentPage, limit: 5 },
        }),
        api.get(`/api/users/${userId}`),
      ]);
      
      setRatings(ratingsRes.data.ratings || []);
      setTotalPages(ratingsRes.data.totalPages || 1);
      setUserStats(userRes.data.ratingStats || {
        averageRating: 0,
        totalRatings: 0,
        totalReviews: 0,
        avgCommunication: 0,
        avgQuality: 0,
        avgProfessionalism: 0,
        avgTimeliness: 0,
      });
    } catch (err) {
      console.error('Error fetching ratings:', err);
      setError('Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  if (loading && currentPage === 1) {
    return <div className="profile-ratings-loading">Loading ratings...</div>;
  }

  if (error) {
    return <div className="profile-ratings-error">{error}</div>;
  }

  const hasDetailedRatings = userStats && (
    userStats.avgCommunication > 0 ||
    userStats.avgQuality > 0 ||
    userStats.avgProfessionalism > 0 ||
    userStats.avgTimeliness > 0
  );

  return (
    <div className="profile-ratings">
      <div className="rating-summary">
        <h3>Ratings & Reviews</h3>
        
        <div className="stats">
          <div className="overall-rating">
            <span className="rating-number">{userStats?.averageRating || 0}</span>
            <StarRating rating={parseFloat(userStats?.averageRating || 0)} readOnly size={24} />
            <span className="total">({userStats?.totalRatings || 0} {userStats?.totalRatings === 1 ? 'rating' : 'ratings'})</span>
          </div>
          
          {hasDetailedRatings && (
            <div className="dimension-breakdown">
              {userStats.avgCommunication > 0 && (
                <div className="dimension-stat">
                  <span className="label">Communication:</span>
                  <span className="value">{userStats.avgCommunication.toFixed(1)}/5</span>
                </div>
              )}
              {userStats.avgQuality > 0 && (
                <div className="dimension-stat">
                  <span className="label">Quality:</span>
                  <span className="value">{userStats.avgQuality.toFixed(1)}/5</span>
                </div>
              )}
              {userStats.avgProfessionalism > 0 && (
                <div className="dimension-stat">
                  <span className="label">Professionalism:</span>
                  <span className="value">{userStats.avgProfessionalism.toFixed(1)}/5</span>
                </div>
              )}
              {userStats.avgTimeliness > 0 && (
                <div className="dimension-stat">
                  <span className="label">Timeliness:</span>
                  <span className="value">{userStats.avgTimeliness.toFixed(1)}/5</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="reviews-list">
        <h4>Reviews ({userStats?.totalReviews || 0})</h4>
        
        {ratings.length === 0 ? (
          <p className="no-reviews">No reviews yet</p>
        ) : (
          <>
            {ratings.map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <div className="reviewer-info">
                    <strong>{review.reviewerId?.name || 'Anonymous'}</strong>
                    <span className="reviewer-role">({review.reviewerId?.role || 'user'})</span>
                  </div>
                  <StarRating rating={review.rating} readOnly size={16} />
                </div>
                
                <small className="review-project">
                  Project: <strong>{review.projectId?.title || 'Untitled Project'}</strong>
                </small>
                
                {review.comment && (
                  <p className="review-comment">{review.comment}</p>
                )}
                
                {(review.communication || review.quality || review.professionalism || review.timeliness) && (
                  <div className="review-dimensions">
                    {review.communication && <span>Communication: {review.communication}/5</span>}
                    {review.quality && <span>Quality: {review.quality}/5</span>}
                    {review.professionalism && <span>Professionalism: {review.professionalism}/5</span>}
                    {review.timeliness && <span>Timeliness: {review.timeliness}/5</span>}
                  </div>
                )}
                
                <small className="review-date">
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </small>
              </div>
            ))}
            
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="page-info">Page {currentPage} of {totalPages}</span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileRatings;
