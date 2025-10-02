# Blogosphere

A modern full-stack blog application built with React, Node.js, and Firebase.

## 🚀 Features

- **User Authentication** - Secure login and registration
- **Blog Management** - Create, edit, and delete blog posts
- **Rich Content** - Markdown support and rich text editing
- **Real-time Updates** - Live data synchronization with Firebase
- **Responsive Design** - Works perfectly on all devices
- **User Profiles** - Personalized user experience
- **Dark/Light Theme** - Toggle between dark and light modes with system preference detection
- **Collapsible Category Sidebar** - Easy navigation with expandable/collapsible sidebar
- **Advanced Search** - Search posts by title, content, tags, author, and category
- **Category Filtering** - Filter posts by specific categories
- **Reusable Components** - Modular architecture for easy maintenance

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
│   │   │   ├── Navbar.tsx
│   │   │   ├── PostCard.tsx
│   │   │   ├── CategorySidebar.tsx  # Collapsible category navigation
│   │   │   └── SearchBar.tsx        # Reusable search component
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
├── IMPLEMENTATION_SUMMARY.md  # Detailed implementation notes
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

## � Additional Documentation

- **IMPLEMENTATION_SUMMARY.md** - Detailed implementation notes and changes
- **COMPONENT_USAGE.tsx** - Component usage examples and patterns

## 🔧 Adding New Categories

Adding a new category is simple - edit just one file:

1. Open `client/src/components/Navbar.tsx`
2. Add your category to the `CATEGORIES` array:
   ```typescript
   export const CATEGORIES = [
     // ... existing categories
     { id: 'your-category', name: 'Your Category', icon: 'fas fa-icon' }
   ];
   ```
3. That's it! The sidebar, dropdowns, and filters update automatically.

See Font Awesome icons: https://fontawesome.com/icons

## �🔧 Available Scripts

### Backend (server/)
- `npm start` - Start the Express server
- `npm run dev` - Start with nodemon for development

### Frontend (client/)
- `npm start` - Start React development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 🎨 Theme System

Blogosphere includes a comprehensive dark/light theme system:

### Features:
- **Auto Detection** - Respects your system's theme preference
- **Manual Toggle** - Switch themes using the navbar button
- **Persistent Storage** - Remembers your theme choice
- **Smooth Transitions** - All components smoothly transition between themes
- **Complete Coverage** - Every component supports both themes

### Theme Components:
- Navbar with theme toggle button
- All cards and modals
- Form inputs and buttons
- Code blocks and content areas
- Sidebars and navigation elements

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