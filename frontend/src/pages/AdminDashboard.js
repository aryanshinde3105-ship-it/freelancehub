import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../auth';
import '../styles/AdminDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
  fetchAdminStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  useEffect(() => {
  if (activeTab === 'users') {
    fetchUsers();
  } else if (activeTab === 'projects') {
    fetchProjects();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTab, searchQuery, roleFilter]);


  const fetchAdminStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        throw new Error('Unauthorized');
      }

      const data = await res.json();
      setStats(data.stats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      alert('Access denied. Admin privileges required.');
      navigate('/login');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/admin/users?search=${searchQuery}&role=${roleFilter}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/projects`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await res.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  const handleBanUser = async (userId, currentBanStatus) => {
    const reason = currentBanStatus
      ? ''
      : prompt('Enter ban reason (optional):') || 'Violated terms of service';

    if (!currentBanStatus && !window.confirm('Are you sure you want to ban this user?')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/ban`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      alert(data.message);
      fetchUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Failed to ban/unban user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await res.json();
      alert(data.message);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/admin/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await res.json();
      alert(data.message);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading admin panel...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🛡️ Admin Dashboard</h1>
        <button onClick={() => navigate('/dashboard')}>Back to Main Dashboard</button>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={activeTab === 'projects' ? 'active' : ''}
          onClick={() => setActiveTab('projects')}
        >
          💼 Projects
        </button>
      </div>

      {activeTab === 'dashboard' && stats && (
        <div className="admin-stats">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Total Projects</h3>
            <p className="stat-number">{stats.totalProjects}</p>
          </div>
          <div className="stat-card">
            <h3>Total Proposals</h3>
            <p className="stat-number">{stats.totalProposals}</p>
          </div>
          <div className="stat-card">
            <h3>Active Users</h3>
            <p className="stat-number green">{stats.activeUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Banned Users</h3>
            <p className="stat-number red">{stats.bannedUsers}</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-users">
          <div className="admin-controls">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="admin-filter"
            >
              <option value="all">All Roles</option>
              <option value="client">Clients</option>
              <option value="freelancer">Freelancers</option>
            </select>
          </div>

          {users && users.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>{user.role}</span>
                    </td>
                    <td>
                      {user.isBanned ? (
                        <span className="status-badge banned">Banned</span>
                      ) : (
                        <span className="status-badge active">Active</span>
                      )}
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className={user.isBanned ? 'btn-unban' : 'btn-ban'}
                        onClick={() => handleBanUser(user._id, user.isBanned)}
                      >
                        {user.isBanned ? '✅ Unban' : '🚫 Ban'}
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteUser(user._id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              No users found.
            </div>
          )}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="admin-projects">
          {projects && projects.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project._id}>
                    <td>{project.title}</td>
                    <td>{project.clientId?.name || 'N/A'}</td>
                    {/* ✅ FIXED: changed from project.client to project.clientId */}
                    <td>${project.budget}</td>
                    <td>
                      <span className={`status-badge ${project.status}`}>
                        {project.status}
                      </span>
                    </td>
                    <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteProject(project._id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              No projects found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
