# Quick Deployment Steps

## 1. Setup MongoDB Atlas (5 minutes)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a FREE cluster (M0)
4. Click "Connect" → "Connect your application"
5. Copy connection string: `mongodb+srv://username:password@cluster.xxx.mongodb.net/chatzy`
6. Replace `<password>` with your actual password

## 2. Deploy Backend on Render (10 minutes)
1. Go to https://render.com and sign up with GitHub
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Settings:
   - Name: `chatzy-backend`
   - Root Directory: `Backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Environment Variables:
   ```
   MONGODB_URI = your_mongodb_connection_string
   MONGO_URL = your_mongodb_connection_string
   JWT_SECRET = chatzy-secret-key-12345
   NODE_ENV = production
   FRONTEND_URL = https://chatzy-frontend.vercel.app
   ```
6. Click "Create Web Service"
7. COPY YOUR BACKEND URL (e.g., https://chatzy-backend.onrender.com)

## 3. Deploy Frontend on Vercel (5 minutes)
1. Go to https://vercel.com and sign up with GitHub
2. Click "New Project" → Import your repository
3. Settings:
   - Framework: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Environment Variables:
   ```
   VITE_API_URL = your_backend_url_from_step_2
   VITE_SOCKET_URL = your_backend_url_from_step_2
   ```
5. Click "Deploy"
6. COPY YOUR FRONTEND URL

## 4. Update Backend FRONTEND_URL
1. Go back to Render dashboard
2. Find your backend service
3. Update `FRONTEND_URL` environment variable with your Vercel URL
4. Save and redeploy

## 5. Test Your App
1. Open your Vercel URL
2. Test in multiple browser tabs
3. Share the URL with friends!

## Troubleshooting
- **MongoDB connection failed**: Check IP whitelist is set to 0.0.0.0/0
- **Socket not connecting**: Verify both URLs are correct
- **Backend sleeping**: Free Render services sleep after 15 min inactivity

## Your URLs
- Frontend: https://your-app.vercel.app
- Backend: https://your-app.onrender.com
- MongoDB: Your Atlas connection string

Done! 🎉 Your chat app is now live and accessible to anyone!
