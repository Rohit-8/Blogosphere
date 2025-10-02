# Blogosphere

A modern full-stack blog application built with React, Node.js, and Firebase.

## 🚀 Features

- **User Authentication** - Secure login and registration
- **Blog Management** - Create, edit, and delete blog posts
- **Rich Content** - Markdown support and rich text editing
- **Real-time Updates** - Live data synchronization with Firebase
- **Responsive Design** - Works perfectly on all devices
- **User Profiles** - Personalized user experience

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Bootstrap 5** for responsive styling
- **Axios** for API communication

### Backend
- **Node.js** with Express.js
- **Firebase Admin SDK**
- **Cloud Firestore** database
- **Firebase Authentication**

## 📁 Project Structure

```
blogosphere/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── services/       # API services
│   │   ├── context/        # React context providers
│   │   └── types/          # TypeScript type definitions
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Express middleware
│   │   └── config/         # Configuration files
│   ├── .env                # Environment variables
│   └── package.json
└── README.md
```

## ⚡ Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase project

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd blogosphere
   cd server && npm install
   cd ../client && npm install
   ```

2. **Firebase Setup:**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable **Authentication** (Email/Password provider)
   - Enable **Firestore Database** 
   - Download service account key and place in `server/` directory
   - Update Firebase config in `client/src/config/firebase.js`

3. **Environment Configuration:**
   ```bash
   # In server directory
   cp .env.example .env
   # Edit .env with your Firebase service account path
   ```

4. **Run the application:**
   ```bash
   # Start the backend server
   cd server && npm start
   
   # In a new terminal, start the frontend
   cd client && npm start
   ```

### Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

## 🔧 Available Scripts

### Backend (server/)
- `npm start` - Start the Express server
- `npm run dev` - Start with nodemon for development

### Frontend (client/)
- `npm start` - Start React development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 🔥 Firebase Configuration

### Required Firebase Services:
1. **Firestore Database** - Store blog posts and user data
2. **Authentication** - User login and registration
3. **Security Rules** - Protect your data

### Database Structure:
```
blogosphere (collection)
└── posts (document)
    └── posts (subcollection)
        ├── post-1 (document)
        ├── post-2 (document)
        └── ...
```

## 🚦 API Endpoints

- `GET /health` - Server health check
- `GET /api/posts` - Get all blog posts
- `POST /api/posts` - Create new post (authenticated)
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update post (authenticated)
- `DELETE /api/posts/:id` - Delete post (authenticated)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ using React, Node.js, and Firebase**