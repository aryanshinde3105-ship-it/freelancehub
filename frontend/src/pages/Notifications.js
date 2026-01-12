import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles/Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(
        `/api/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch(
        '/api/notifications/mark-all-read',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      try {
        await api.delete('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchNotifications();
      } catch (err) {
        console.error('Error clearing notifications:', err);
      }
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'proposal_received':
        return '📨';
      case 'proposal_accepted':
        return '✅';
      case 'proposal_rejected':
        return '❌';
      case 'deliverable_uploaded':
        return '📤';
      case 'project_completed':
        return '🎉';
      case 'project_rejected':
        return '🔄';
      case 'new_message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return new Date(date).toLocaleDateString();
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'read') return notif.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="app-container">
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="notifications-page">
        {/* Header */}
        <div className="notifications-page-header">
          <div>
            <h2>Notifications</h2>
            <p className="notifications-subtitle">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="notifications-actions">
            {unreadCount > 0 && (
              <button className="btn btn-secondary" onClick={markAllAsRead}>
                Mark All Read
              </button>
            )}
            {notifications.length > 0 && (
              <button className="btn btn-danger" onClick={clearAllNotifications}>
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="notifications-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="notifications-list-page">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🔔</span>
              <h3>No notifications</h3>
              <p>
                {filter === 'unread'
                  ? "You're all caught up!"
                  : filter === 'read'
                  ? 'No read notifications'
                  : 'No notifications yet'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-card ${
                  notification.isRead ? 'read' : 'unread'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon-large">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content-large">
                  <div className="notification-title-large">
                    {notification.title}
                  </div>
                  <div className="notification-message-large">
                    {notification.message}
                  </div>
                  <div className="notification-time-large">
                    {timeAgo(notification.createdAt)}
                  </div>
                </div>
                <button
                  className="delete-notification-btn-large"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification._id);
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;
