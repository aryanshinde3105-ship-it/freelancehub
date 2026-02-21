# 🚀 FreelanceHub - Hire & Work with Freelancers

A modern, full-stack freelancing marketplace platform built with **MERN Stack** that connects clients with skilled freelancers. Post projects, receive proposals, collaborate in real-time, and manage payments securely.

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Node](https://img.shields.io/badge/Node-v20+-green)
![React](https://img.shields.io/badge/React-v18+-blue)

---

## ✨ Features

### 🎯 Core Features
- **User Authentication**: JWT-based secure authentication with role-based access (Client/Freelancer)
- **Project Management**: Clients can post projects with detailed requirements and budget
- **Proposal System**: Freelancers can submit proposals with bid amounts and timelines
- **Real-time Chat**: Integrated messaging system for client-freelancer communication
- **File Management**: Upload deliverables with Azure Blob Storage integration
- **Dashboard Analytics**: Real-time stats and activity tracking for both roles
- **Project Lifecycle**: Track projects from creation to completion with status management
- **Milestone Payments**: Milestone-based payment workflow with escrow and release
- **Ratings & Reviews**: Post-completion review system for clients and freelancers
- **Notifications**: In-app notification system with unread count and clear-all

### 🎨 UI/UX Features
- **Modern Design**: Glassmorphism effects with gradient backgrounds
- **Smooth Animations**: Page transitions, card stagger effects, and hover animations
- **Responsive Layout**: Fully mobile-responsive design
- **Dark Mode Ready**: CSS variables for easy theme switching
- **Accessibility**: Reduced motion support and semantic HTML

### 🛠️ Technical Features
- **Cloud Storage**: Azure Blob Storage for reliable file uploads
- **MongoDB Atlas**: NoSQL database with scalable architecture
- **Real-time Updates**: Dashboard with live analytics
- **Error Handling**: Comprehensive error messages and validation
- **Security**: CORS protection, input validation, authentication middleware

---

## 🏗️ Architecture

```
FreelanceHub/
├── backend/                 # Node.js + Express API
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth, file upload
│   ├── utils/              # Azure storage, helpers
│   └── server.js           # Main server
├── frontend/               # React 18 (Create React App)
│   ├── src/
│   │   ├── pages/          # Route components
│   │   ├── components/     # Reusable components
│   │   ├── styles/         # Global CSS
│   │   ├── api.js          # Axios instance
│   │   └── auth.js         # Auth helpers
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20 or higher
- MongoDB Atlas account
- Azure Storage Account
- Git

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/Aryanshinde3105/FreelanceHub.git
cd FreelanceHub
```

#### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key

# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=your_storage_account
AZURE_STORAGE_ACCOUNT_KEY=your_storage_key
AZURE_STORAGE_CONTAINER_NAME=freelancer-files

# Server
PORT=5000
NODE_ENV=development
```

Start backend:
```bash
npm start
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create `.env` file:
```
REACT_APP_API_URL=http://localhost:5000
```

Start frontend:
```bash
npm start
```

Visit: http://localhost:3000

---

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile

### Projects
- `GET /api/projects` - Get all open projects
- `POST /api/projects` - Create new project (Client)
- `GET /api/projects/my` - Get client's projects
- `GET /api/projects/active` - Get freelancer's active projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/:id/upload` - Upload deliverables
- `PATCH /api/projects/:id/approve` - Approve completion
- `PATCH /api/projects/:id/reject` - Reject with feedback
- `PATCH /api/projects/:id/archive` - Archive chat
- `PATCH /api/projects/:id/unarchive` - Unarchive chat

### Proposals
- `POST /api/proposals` - Submit proposal
- `GET /api/proposals/my` - Get freelancer's proposals
- `PATCH /api/proposals/:id/accept` - Accept proposal
- `PATCH /api/proposals/:id/reject` - Reject proposal

### Milestones
- `POST /api/milestones` - Create milestone (Client)
- `GET /api/milestones/project/:projectId` - Get project milestones
- `GET /api/milestones/:id` - Get single milestone
- `PUT /api/milestones/:id` - Edit milestone fields (Client, pending only)
- `PATCH /api/milestones/:id/status` - Update milestone status
- `PATCH /api/milestones/:id/progress` - Update progress (Freelancer)
- `DELETE /api/milestones/:id` - Delete milestone (Client, pending only)

### Payments
- `POST /api/payments/release/:milestoneId` - Release milestone payment

### Ratings
- `POST /api/ratings` - Submit review
- `GET /api/ratings/can-review/:projectId` - Check if user can review

### Notifications
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/mark-all-read` - Mark all as read
- `PATCH /api/notifications/:id/read` - Mark one as read
- `DELETE /api/notifications` - Clear all notifications
- `DELETE /api/notifications/:id` - Delete single notification

### Chat
- `GET /api/chat/:projectId` - Get project messages
- `POST /api/chat/:projectId` - Send message

### Dashboard
- `GET /api/dashboard/stats` - Get analytics data

---

## 🔐 Security Features
- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ CORS protection
- ✅ Input validation on frontend & backend
- ✅ File type validation (PDF, images, ZIP only)
- ✅ 10MB file size limit
- ✅ Azure private blob storage
- ✅ Environment variables for sensitive data
- ✅ Role-based access control

---

## 📦 Tech Stack

### Frontend
- **React 18** - UI library (Create React App)
- **React Router v6** - Navigation
- **Axios** - HTTP client
- **CSS3** - Styling with animations

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File uploads
- **Azure Storage** - Cloud storage
- **Bcrypt** - Password hashing

### Infrastructure
- **Vercel** - Frontend hosting
- **Render** - Backend hosting
- **MongoDB Atlas** - Database hosting
- **Azure Blob Storage** - File storage

---

## 🎯 User Roles

### Client
- Post projects with budget and deadline
- Review freelancer proposals
- Manage project timeline and milestones
- Fund milestones via escrow
- Approve/reject completed work
- Leave ratings and reviews
- View dashboard analytics

### Freelancer
- Browse available projects
- Submit proposals with bid amounts
- Update milestone progress
- Submit milestones for review
- Deliver work with file uploads
- Communicate with client via chat
- View earnings and project stats

---

## 📊 Dashboard Analytics

### Client Analytics
- Total projects posted
- Active projects count
- Completed projects
- Total proposals received
- Total budget allocated

### Freelancer Analytics
- Total proposals submitted
- Accepted proposals count
- Pending proposals
- Active projects
- Completed projects

---

## 🐛 Known Issues & Limitations
- File uploads only persist in Azure (local uploads deleted on server restart)
- Chat uses polling (8-second intervals) instead of WebSockets

---

## 🚧 Future Features
- [ ] Email notifications
- [ ] Real-time chat with WebSockets
- [ ] Advanced search and filters
- [ ] Skill endorsements
- [ ] Dark mode toggle
- [ ] Mobile app (React Native)

---

## 📱 Deployment

### Frontend (Vercel)
Automatic deployment from main branch

Set environment variable:
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

### Backend (Render)
Automatic deployment from main branch

Set environment variables in Render dashboard:
```
MONGODB_URI
JWT_SECRET
AZURE_STORAGE_ACCOUNT_NAME
AZURE_STORAGE_ACCOUNT_KEY
AZURE_STORAGE_CONTAINER_NAME
```

---

## 📖 Usage Examples

### As a Client
1. Sign up and create account
2. Go to "Post Project"
3. Fill in project details, budget, deadline
4. Submit project
5. Review incoming proposals
6. Accept freelancer
7. Fund milestones
8. Approve completed work and release payment

### As a Freelancer
1. Sign up and create account
2. Go to "Browse Projects"
3. Find suitable project
4. Submit proposal with bid
5. Wait for client acceptance
6. Start working on funded milestones
7. Upload deliverables and submit for review
8. Communicate with client via chat

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Aryan Shinde**
- GitHub: [@Aryanshinde3105](https://github.com/Aryanshinde3105)
- Portfolio: [freelancehub.works](https://freelancehub.works)
- Email: aryanshinde3105@gmail.com

---

## 🙏 Acknowledgments

- MongoDB Atlas for database hosting
- Render for backend deployment
- Vercel for frontend hosting
- Azure for cloud storage solutions
- The MERN community for amazing tools and libraries

---

## 📞 Support

For support, email aryanshinde3105@gmail.com or open an issue on GitHub.

---

## 🎓 Learning Resources

- [MERN Stack Tutorial](https://mern.io)
- [Express.js Guide](https://expressjs.com)
- [React Documentation](https://react.dev)
- [MongoDB Manual](https://docs.mongodb.com)
- [Azure Storage Docs](https://docs.microsoft.com/azure/storage)

---

Made with ❤️ by Aryan Shinde

Last Updated: February 2026
