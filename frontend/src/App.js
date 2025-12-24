import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom';

import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import PostProject from './pages/PostProject';
import BrowseProjects from './pages/BrowseProjects';
import MyProjects from './pages/MyProjects';
import ApplyProposal from './pages/ApplyProposal';
import MyProposals from './pages/MyProposals';
import ProjectProposals from './pages/ProjectProposals';
import MyActiveProjects from './pages/MyActiveProjects';
import ProjectChat from './pages/ProjectChat';
import Chats from './pages/Chats';

import { getToken, getCurrentUser, logout } from './auth';

function ProtectedRoute({ children, roles }) {
  const token = getToken();
  const user = token ? getCurrentUser() : null;

  if (!token || !user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

  return children;
}

function Layout() {
  const navigate = useNavigate();
  const token = getToken();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #eee' }}>
  <Link to="/">Home</Link>

  {getToken() && <Link to="/dashboard">Dashboard</Link>}

  <Link to="/browse-projects">Browse Projects</Link>

  {user?.role === 'client' && (
    <>
      <Link to="/post-project">Post Project</Link>
      <Link to="/my-projects">My Projects</Link>
    </>
  )}

  {user?.role === 'freelancer' && (
    <>
      <Link to="/my-proposals">My Proposals</Link>
      <Link to="/my-active-projects">My Active Projects</Link>
    </>
  )}

  {!getToken() && (
    <>
      <Link to="/login">Login</Link>
      <Link to="/register">Create Account</Link>
    </>
  )}

  {getToken() && (
    <>
      <Link to="/chats">Chats</Link>
      <Link to="/profile">Profile</Link>
      <button onClick={handleLogout}>Logout</button>
    </>
  )}
</nav>


      <main style={{ padding: '2rem' }}>
        <Routes>
          <Route
  path="/"
  element={
    <div className="app-container">
      <div className="card">
        <h2>Welcome to FreelanceHub 👋</h2>
        <p>
          FreelanceHub connects clients with freelancers to collaborate on projects,
          manage proposals, chat in real-time, and complete work securely.
        </p>

        <p>
          {getToken()
            ? 'Go to your dashboard to continue working.'
            : 'Create an account or login to get started.'}
        </p>
      </div>
    </div>
  }
/>

          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/browse-projects" element={<BrowseProjects />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/post-project"
            element={
              <ProtectedRoute roles={['client']}>
                <PostProject />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-projects"
            element={
              <ProtectedRoute roles={['client']}>
                <MyProjects />
              </ProtectedRoute>
            }
          />

          <Route
            path="/project/:projectId/proposals"
            element={
              <ProtectedRoute roles={['client']}>
                <ProjectProposals />
              </ProtectedRoute>
            }
          />

          <Route
            path="/apply/:projectId"
            element={
              <ProtectedRoute roles={['freelancer']}>
                <ApplyProposal />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat/:projectId"
            element={
              <ProtectedRoute>
                <ProjectChat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-proposals"
            element={
              <ProtectedRoute roles={['freelancer']}>
                <MyProposals />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-active-projects"
            element={
              <ProtectedRoute roles={['freelancer']}>
                <MyActiveProjects />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chats"
            element={
              <ProtectedRoute>
                <Chats />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
