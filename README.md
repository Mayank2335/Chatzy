# 💬 Chatzy - Real-time Chat Application

A modern, real-time chat application built with React, Node.js, Socket.io, and MongoDB.

## ✨ Features

- 🚀 Real-time messaging using Socket.io
- 👥 Multiple users can chat simultaneously
- 🎨 Modern UI with Tailwind CSS
- 🌓 Dark/Light mode toggle
- ⌨️ Typing indicators
- 📱 Responsive design
- 💾 Message persistence with MongoDB

## 🛠️ Tech Stack

### Frontend
- React 19
- Vite
- Socket.io Client
- Tailwind CSS

### Backend
- Node.js
- Express
- Socket.io
- MongoDB/Mongoose
- CORS

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/Mayank2335/Chatzy.git
cd Chatzy
```

2. **Setup Backend**
```bash
cd Backend
npm install
```

Create `.env` file in Backend folder:
```env
MONGODB_URL=mongodb://127.0.0.1:27017/chat-app
MONGO_URL=mongodb://127.0.0.1:27017/chat-app
PORT=5000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-key
```

Start backend server:
```bash
npm start
```

3. **Setup Frontend**
```bash
cd ../frontend
npm install
```

Create `.env` file in frontend folder:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Start frontend dev server:
```bash
npm run dev
```

4. **Open your browser**
- Go to `http://localhost:5173`
- Enter your username and start chatting!

## 📦 Deployment
https://chatzy23.netlify.app
## 📝 Environment Variables

### Backend
- `MONGODB_URL` - MongoDB connection string
- `MONGO_URL` - MongoDB connection string (backup)
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS
- `JWT_SECRET` - Secret key for JWT tokens

### Frontend
- `VITE_API_URL` - Backend API URL
- `VITE_SOCKET_URL` - Socket.io server URL


## 🙏 Acknowledgments

- Socket.io for real-time communication
- Tailwind CSS for styling
- MongoDB for data persistence
- Vite for blazing fast development

