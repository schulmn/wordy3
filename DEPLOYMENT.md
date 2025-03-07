# Wordy3 Deployment Guide

This guide provides instructions for deploying the Wordy3 game online while continuing development.

## Overview

Wordy3 consists of two main components:
1. **Frontend**: A Vite-based web application
2. **Backend**: An Express.js server with MongoDB database

## Prerequisites

- GitHub account (for code hosting)
- Render.com, Railway.app, or similar platform account (for deployment)
- MongoDB Atlas account (already set up based on your .env file)

## Deployment Steps

### 1. Prepare Your Repository

If you haven't already, push your code to GitHub:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy the Backend

#### Using Render.com

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: wordy3-backend
   - **Environment**: Node
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Root Directory**: (leave blank)

4. Add environment variables:
   - `NODE_ENV`: production
   - `PORT`: 10000 (Render will override this with its own port)
   - `MONGODB_URI`: (your MongoDB Atlas connection string)
   - `MONGODB_DB_NAME`: wordy3
   - `CORS_ORIGIN`: * (temporarily, will update with frontend URL)
   - `SESSION_SECRET`: (a secure random string)
   - `ADMIN_USERNAME`: (your admin username)
   - `ADMIN_PASSWORD`: (your admin password)

5. Click "Create Web Service"

#### Using Railway.app

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add a new service from your repo
4. Configure the service:
   - Set the root directory to `/server`
   - Set the start command to `npm start`

5. Add environment variables (same as Render)

### 3. Deploy the Frontend

#### Using Render.com

1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: wordy3-frontend
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Root Directory**: (leave blank)

4. Add environment variables:
   - `VITE_API_URL`: https://your-backend-url.onrender.com/api (use your actual backend URL)

5. Click "Create Static Site"

#### Using Netlify/Vercel

These platforms also work well for the frontend and have similar setup processes.

### 4. Update CORS Settings

After deploying the frontend, update the backend's CORS settings:

1. Go to your backend service dashboard
2. Update the `CORS_ORIGIN` environment variable to your frontend URL (e.g., https://wordy3-frontend.onrender.com)
3. Redeploy the backend service

## Local Development with Production Backend

To continue development locally while using the production backend:

1. Create a `.env.local` file in the project root:
```
VITE_API_URL=https://your-backend-url.onrender.com/api
```

2. Run the frontend locally:
```bash
npm run dev
```

This will connect your local frontend to the deployed backend.

## Switching Between Development and Production

- For local development with local backend: Don't set VITE_API_URL (it will default to localhost)
- For local development with production backend: Set VITE_API_URL to your deployed backend URL
- For production: Set VITE_API_URL during the build process

## Troubleshooting

### CORS Issues

If you encounter CORS errors:
1. Verify the `CORS_ORIGIN` in your backend environment variables matches your frontend URL
2. Check that your API requests are going to the correct URL
3. Temporarily set `CORS_ORIGIN` to `*` for testing

### Database Connection Issues

If the backend can't connect to MongoDB:
1. Verify your MongoDB Atlas connection string is correct
2. Check if your IP address is whitelisted in MongoDB Atlas
3. Ensure your database user has the correct permissions

### Deployment Failures

If deployment fails:
1. Check the build logs for errors
2. Verify all dependencies are correctly listed in package.json
3. Make sure environment variables are correctly set

## Continuous Development

After deployment, you can continue development:

1. Make changes locally
2. Test with local or production backend
3. Commit and push changes
4. Your deployment platform will automatically rebuild and deploy the updated code

## Monitoring

- Use your deployment platform's logging and monitoring tools
- Check MongoDB Atlas monitoring for database performance
- Consider adding application monitoring like Sentry for error tracking
