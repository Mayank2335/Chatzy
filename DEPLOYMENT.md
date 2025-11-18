# Chatzy Deployment Guide

This guide will help you deploy your chat application so others can use it.

## Prerequisites

1. GitHub account
2. MongoDB Atlas account (free tier available)
3. Deployment platform account (choose one):
   - Render (Recommended - Free tier available)
   - Vercel (Free tier available)
   - Railway (Free tier available)

## Step 1: Setup MongoDB Atlas (Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and log in
3. Create a new cluster (choose Free Tier - M0)
4. Wait for cluster to be created
5. Click "Connect" → "Connect your application"
6. Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster.xxx.mongodb.net/`)
7. Replace `<password>` with your actual password
8. Save this connection string - you'll need it later

## Step 2: Push Code to GitHub

```bash
cd "C:\Users\Admin\Desktop\Chat Application"
git init
git add .
git commit -m "Initial commit - Chat application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/chatzy.git
git push -u origin main
```

## Step 3: Deploy Backend (Choose one platform)

### Option A: Deploy on Render (Recommended)

1. Go to [Render](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: chatzy-backend
   - **Root Directory**: Backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `MONGODB_URI` = Your MongoDB Atlas connection string
   - `MONGO_URL` = Your MongoDB Atlas connection string
   - `JWT_SECRET` = Any random secure string (e.g., "your-super-secret-jwt-key-12345")
   - `NODE_ENV` = production
   - `FRONTEND_URL` = (You'll update this after deploying frontend)
6. Click "Create Web Service"
7. Wait for deployment to complete
8. Copy your backend URL (e.g., `https://chatzy-backend.onrender.com`)

### Option B: Deploy on Railway

1. Go to [Railway](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add Environment Variables (same as Render)
5. Set Root Directory to `Backend`
6. Deploy and copy the URL

## Step 4: Deploy Frontend (Choose one platform)

### Option A: Deploy on Vercel (Recommended for Frontend)

1. Go to [Vercel](https://vercel.com) and sign up
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: frontend
   - **Build Command**: `npm run build`
   - **Output Directory**: dist
5. Add Environment Variables:
   - `VITE_API_URL` = Your backend URL (from Step 3)
   - `VITE_SOCKET_URL` = Your backend URL (from Step 3)
6. Click "Deploy"
7. Wait for deployment to complete
8. Copy your frontend URL (e.g., `https://chatzy.vercel.app`)

### Option B: Deploy Frontend on Render

1. Click "New +" → "Static Site"
2. Connect your repository
3. Configure:
   - **Name**: chatzy-frontend
   - **Root Directory**: frontend
   - **Build Command**: `npm run build`
   - **Publish Directory**: dist
4. Add Environment Variables (same as Vercel)
5. Deploy

## Step 5: Update Backend with Frontend URL

1. Go back to your backend deployment (Render/Railway)
2. Update the `FRONTEND_URL` environment variable with your frontend URL
3. Redeploy the backend service

## Step 6: Update App.jsx Socket Connection

Make sure your `App.jsx` uses the environment variable for socket connection:

```javascript
const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");
```

## Step 7: Test Your Deployment

1. Visit your frontend URL
2. Open it in multiple browser tabs or devices
3. Test the chat functionality
4. Check if messages are being sent and received in real-time

## Troubleshooting

### Backend not connecting to MongoDB
- Check if MongoDB Atlas IP whitelist includes 0.0.0.0/0 (allow all)
- Verify your connection string is correct
- Check environment variables are set correctly

### Socket.io connection errors
- Ensure CORS is properly configured in backend
- Verify FRONTEND_URL in backend matches your actual frontend URL
- Check if both HTTP and WebSocket protocols are allowed

### Frontend not connecting to backend
- Verify VITE_API_URL and VITE_SOCKET_URL are correct
- Check browser console for errors
- Ensure backend is running and accessible

## Environment Variables Summary

### Backend (.env)
```
MONGODB_URI=mongodb+srv://...
MONGO_URL=mongodb+srv://...
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-frontend-url.vercel.app
NODE_ENV=production
PORT=5000
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.onrender.com
VITE_SOCKET_URL=https://your-backend-url.onrender.com
```

## Sharing Your App

Once deployed, simply share your frontend URL with others:
- `https://chatzy.vercel.app` (or your chosen domain)

Users can open this link and start chatting immediately!

## Free Tier Limitations

- **Render**: Backend may sleep after 15 min of inactivity (wakes up in ~30 seconds)
- **Vercel**: 100GB bandwidth per month
- **MongoDB Atlas**: 512MB storage, limited connections

## Upgrading (Optional)

For production use with many users, consider:
- Upgrading to paid hosting plans
- Adding user authentication
- Implementing rate limiting
- Setting up custom domain
- Adding SSL certificate (usually automatic)

---

Need help? Check the documentation or contact support for your hosting platform.
