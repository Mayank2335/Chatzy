# 🔧 Netlify Deployment Fix Guide

## Problem: "Failed to Fetch" Error

This happens because your frontend can't connect to your backend. Here's how to fix it:

## ✅ What I've Fixed:

1. ✅ Added Netlify configuration files (`netlify.toml` and `_redirects`)
2. ✅ Updated CORS configuration in backend to support Netlify domains
3. ✅ Added proper wildcard support for `*.netlify.app` domains

## 🚨 What YOU Need to Do:

### Step 1: Get Your Backend URL

**Where is your backend deployed?** You need to tell me:
- Render.com?
- Railway.app?
- Vercel?
- Other platform?

Your backend URL should look like:
- `https://chatzy-backend.onrender.com` (Render)
- `https://chatzy-backend.up.railway.app` (Railway)
- `https://chatzy-backend.vercel.app` (Vercel)

### Step 2: Update Frontend .env File

Once you have your backend URL, update this file:
📁 `frontend/.env`

```env
VITE_SOCKET_URL=https://YOUR-ACTUAL-BACKEND-URL.com
VITE_API_URL=https://YOUR-ACTUAL-BACKEND-URL.com/api
```

**Replace `YOUR-ACTUAL-BACKEND-URL.com` with your real backend URL!**

### Step 3: Update Backend Environment Variables

In your backend deployment platform (Render/Railway/Vercel), add this environment variable:

```
FRONTEND_URL=https://your-app.netlify.app
```

**Replace `your-app.netlify.app` with your actual Netlify URL!**

If you have multiple frontend URLs (like testing + production), use comma-separated:
```
FRONTEND_URL=http://localhost:5173,https://your-app.netlify.app,https://main--your-app.netlify.app
```

### Step 4: Rebuild and Redeploy

1. **Backend**: 
   - Go to your backend hosting platform
   - Add/update the `FRONTEND_URL` environment variable
   - Redeploy or restart the service

2. **Frontend**:
   - Update the `.env` file with correct backend URL
   - Commit and push to GitHub:
     ```bash
     git add .
     git commit -m "Fix backend URL configuration"
     git push
     ```
   - Netlify will auto-deploy

### Step 5: Test

1. Open browser console (F12)
2. Go to your Netlify URL
3. Try to login/signup
4. Check console for errors

## 🐛 Still Not Working? Check These:

### Check 1: Is Backend Running?
Visit your backend URL directly in browser:
- `https://your-backend.com/` - Should show: `{"status":"ok","message":"Chatzy Backend Server is running"}`
- `https://your-backend.com/health` - Should show: `{"status":"ok","timestamp":"..."}`

If these don't work, your backend isn't running!

### Check 2: Check MongoDB Connection
Look at your backend logs. You should see:
```
✅ MongoDB Connected
Server running on port 5000
```

If you see `❌ MongoDB Error`, fix your MongoDB connection string.

### Check 3: Check Browser Console
Open browser console (F12) and look for errors:
- `net::ERR_CONNECTION_REFUSED` - Backend URL is wrong
- `CORS error` - FRONTEND_URL not configured correctly
- `Failed to fetch` - Backend not running or URL wrong

### Check 4: MongoDB Atlas Whitelist
1. Go to MongoDB Atlas
2. Network Access
3. Make sure IP whitelist includes `0.0.0.0/0` (allow from anywhere)

## 📋 Quick Checklist:

- [ ] Backend is deployed and running
- [ ] Backend URL is accessible (test in browser)
- [ ] Frontend `.env` has correct backend URL
- [ ] Backend has `FRONTEND_URL` environment variable set
- [ ] MongoDB connection string is correct
- [ ] MongoDB Atlas allows connections from anywhere
- [ ] Both frontend and backend are redeployed after changes

## 🆘 Tell Me:

1. **Where is your backend deployed?** (Render/Railway/Vercel/Other)
2. **What is your backend URL?**
3. **What is your Netlify URL?**

Once you tell me these, I can update the configuration files with the correct URLs!
