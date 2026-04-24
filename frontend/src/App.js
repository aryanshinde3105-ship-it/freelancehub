import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import LandingPage from './pages/LandingPage';
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
import ArchivedChats from './pages/ArchivedChats';
import EditProfile from './pages/EditProfile';
import NotificationBell from './components/NotificationBell';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import { connectSocket, disconnectSocket } from './socket';


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

  useEffect(() => {
    if (token) {
      connectSocket(token);
      return;
    }

    disconnectSocket();
  }, [token]);

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  return (
    <div>
      {/* ================= NAVBAR ================= */}
      <header className="navbar">
        <div className="navbar-inner">
          {/* Brand */}
          <Link to="/" className="navbar-brand">
            FreelanceHub
          </Link>

          {/* Links */}
          <nav className="navbar-links">
            <Link to="/browse-projects">Browse Projects</Link>

            {token && <Link to="/dashboard">Dashboard</Link>}

            {user?.role === 'client' && (
              <>
                <Link to="/post-project">Post Project</Link>
                <Link to="/my-projects">My Projects</Link>
              </>
            )}

            {user?.role === 'freelancer' && (
              <>
                <Link to="/my-proposals">My Proposals</Link>
                <Link to="/my-active-projects">Active Projects</Link>
              </>
            )}

            {token && <Link to="/chats">Chats</Link>}
          </nav>

          {/* Actions */}
          <div className="navbar-actions">
            {!token ? (
              <>
                <Link to="/login" className="btn btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                {/* ADD NOTIFICATION BELL HERE */}
                <NotificationBell />

                <Link to="/profile" className="btn btn-secondary">
                  Profile
                </Link>
                <button
                  className="btn btn-primary"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/"
            element={
              <div className="app-container">
                <div className="card">
                  <h2>Welcome to FreelanceHub 👋</h2>
                  <p>
                    FreelanceHub connects clients with freelancers to collaborate
                    on projects, manage proposals, chat in real-time, and complete
                    work securely.
                  </p>
                  <p>
                    {token
                      ? 'Go to your dashboard to continue working.'
                      : 'Create an account or login to get started.'}
                  </p>
                </div>
              </div>
            }
          />
          <Route path="/admin" element={<AdminDashboard />} />
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
          {/* ✅ ADD THIS ROUTE */}
          <Route
            path="/archived-chats"
            element={
              <ProtectedRoute>
                <ArchivedChats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
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
