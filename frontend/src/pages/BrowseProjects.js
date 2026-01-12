import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { getCurrentUser } from '../auth';
import '../styles/BrowseProjects.css';

function BrowseProjects() {
  const [projects, setProjects] = useState([]);
  const [appliedProjectIds, setAppliedProjectIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [deadlineFilter, setDeadlineFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const user = getCurrentUser();
  const token = localStorage.getItem('token');

  const categories = [
    'All Categories',
    'Web Development',
    'Mobile Development',
    'UI/UX Design',
    'Graphic Design',
    'Content Writing',
    'Digital Marketing',
    'Data Science',
    'Video Editing',
    'Others'
  ];

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      
      if (searchKeyword.trim()) params.append('search', searchKeyword);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (minBudget) params.append('minBudget', minBudget);
      if (maxBudget) params.append('maxBudget', maxBudget);
      if (deadlineFilter) params.append('deadline', deadlineFilter);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const projectsRes = await api.get(`/api/projects?${params.toString()}`);
      setProjects(projectsRes.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Unable to load projects.');
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, selectedCategory, minBudget, maxBudget, deadlineFilter, sortBy, sortOrder]);

  const fetchAppliedProposals = useCallback(async () => {
    try {
      const proposalsRes = await api.get('/api/proposals/my', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const appliedIds = proposalsRes.data.map((p) => p.projectId._id);
      setAppliedProjectIds(appliedIds);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (user?.role === 'freelancer') {
      fetchAppliedProposals();
    }
  }, [user, fetchAppliedProposals]);

  const handleResetFilters = () => {
    setSearchKeyword('');
    setSelectedCategory('all');
    setMinBudget('');
    setMaxBudget('');
    setDeadlineFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  if (loading) return <p>Loading projects...</p>;

  return (
    <div className="app-container">
      <h2>Browse Projects</h2>

      {/* SEARCH & FILTER SECTION */}
      <div className="filters-container">
        {/* Search Bar - Full Width Row */}
        <div className="filter-group search-group">
          <input
            type="text"
            placeholder="🔍 Search by keyword, skills, category..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Filters Row - Grid Layout */}
        <div className="filters-row">
          {/* Category Filter */}
          <div className="filter-group">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.slice(1).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Range */}
          <div className="filter-group budget-group">
            <input
              type="number"
              placeholder="Min Budget (₹)"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              className="budget-input"
            />
            <span className="budget-separator">-</span>
            <input
              type="number"
              placeholder="Max Budget (₹)"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="budget-input"
            />
          </div>

          {/* Deadline Filter */}
          <div className="filter-group">
            <input
              type="date"
              value={deadlineFilter}
              onChange={(e) => setDeadlineFilter(e.target.value)}
              className="filter-input"
              placeholder="Deadline before"
            />
          </div>
        </div>

        {/* Sort Controls & Reset Button */}
        <div className="sort-controls">
          <div className="sort-group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="budget">Sort by Budget</option>
              <option value="deadline">Sort by Deadline</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="filter-select"
            >
              <option value="desc">
                {sortBy === 'budget' ? 'Highest First' : 'Newest First'}
              </option>
              <option value="asc">
                {sortBy === 'budget' ? 'Lowest First' : 'Oldest First'}
              </option>
            </select>
          </div>

          {/* Reset Button */}
          <button onClick={handleResetFilters} className="btn-reset">
            Reset Filters
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && <p className="error-message">{error}</p>}

      {/* RESULTS COUNT */}
      {!error && (
        <p className="results-count">
          Found {projects.length} project{projects.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* EMPTY STATE */}
      {projects.length === 0 && !error && (
        <div className="empty-state">
          <h3>No projects found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}

      {/* PROJECT GRID */}
      {projects.length > 0 && (
        <div className="card-grid">
          {projects.map((project) => {
            const alreadyApplied = appliedProjectIds.includes(project._id);

            return (
              <div key={project._id} className="card project-card">
                {/* HEADER */}
                <div className="project-card-header">
                  <h3 className="project-card-title">{project.title}</h3>
                  <div className="badge badge-open">Open</div>
                </div>

                {/* BODY */}
                <div className="project-card-body">
                  <p className="project-description">{project.description}</p>

                  <div className="project-meta">
                    <p>
                      <b>Category:</b> {project.category}
                    </p>
                    <p>
                      <b>Budget:</b> ₹{project.budget.toLocaleString()}
                    </p>
                    {project.deadline && (
                      <p>
                        <b>Deadline:</b>{' '}
                        {new Date(project.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {project.requiredSkills && project.requiredSkills.length > 0 && (
                    <div className="skills-tags">
                      {project.requiredSkills.map((skill, idx) => (
                        <span key={idx} className="skill-tag">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                {user?.role === 'freelancer' && (
                  <div className="project-card-actions">
                    {alreadyApplied ? (
                      <span className="already-applied">Already applied</span>
                    ) : (
                      <Link to={`/apply/${project._id}`}>
                        <button className="btn btn-primary">Apply</button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BrowseProjects;
