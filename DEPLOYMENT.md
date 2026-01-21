# Deployment Guide - Render

This guide will help you deploy the Movie Club application to Render.

## Prerequisites

- A GitHub account with your repository pushed
- A Render account (free tier available)
- PostgreSQL database (Render provides this)

## Deployment Steps

### Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Connect to Render**
   - Go to https://render.com and sign in
   - Click "New +" and select "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and configure everything

3. **Configure Environment Variables**

   Render will auto-generate most variables from `render.yaml`, but you may want to customize:

   - `NEXTAUTH_URL`: Update to your actual Render URL (e.g., `https://movie-club.onrender.com`)
   - `NEXTAUTH_SECRET`: Auto-generated, but you can set a custom value if needed

4. **Deploy**
   - Click "Apply" to start the deployment
   - Render will:
     - Create a PostgreSQL database
     - Install dependencies
     - Run Prisma migrations
     - Build the Next.js application
     - Start the production server

### Option 2: Manual Setup

1. **Create PostgreSQL Database**
   - In Render dashboard, click "New +" → "PostgreSQL"
   - Name: `movie-club-db`
   - Plan: Free
   - Copy the Internal Database URL

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `movie-club`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: Free

3. **Add Environment Variables**
   ```
   NODE_ENV=production
   DATABASE_URL=[Your Internal Database URL from step 1]
   NEXTAUTH_URL=https://movie-club.onrender.com
   NEXTAUTH_SECRET=[Generate a random string]
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for the build to complete

## Post-Deployment

### 1. Run Database Migrations

After first deployment, ensure migrations are applied:
```bash
npm run db:migrate:deploy
```

### 2. Seed the Database (Optional)

If you want to add initial data:
```bash
npm run db:seed
```

### 3. Verify Deployment

- Visit your Render URL (e.g., `https://movie-club.onrender.com`)
- Test the profile picture upload functionality
- Check that the database connection works

## Important Notes

### Free Tier Limitations

- **Cold starts**: Free tier services spin down after 15 minutes of inactivity
- **Database**: Free PostgreSQL has 1GB storage limit
- **Build minutes**: 500 hours/month free build time

### Profile Picture Storage

The current implementation stores profile pictures in the `/public/uploads` directory. This works for development but has limitations on Render's free tier:

- **Files are ephemeral**: Uploaded files may be lost when the service restarts
- **For production**, consider using:
  - **Cloudinary** (free tier: 25GB storage)
  - **AWS S3** (pay-as-you-go)
  - **Render Disks** (paid feature)

To implement persistent storage, you'll need to:
1. Update the upload API route (`app/api/upload-profile-picture/route.ts`)
2. Use a cloud storage service instead of local file system
3. Update the database to store the cloud URL

### Database Backups

Render's free tier doesn't include automatic backups. For production:
- Upgrade to a paid plan for automatic backups
- Or manually backup using: `pg_dump`

## Troubleshooting

### Build Fails

- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify `DATABASE_URL` is correctly set

### Database Connection Issues

- Verify the `DATABASE_URL` environment variable
- Check that Prisma migrations ran successfully
- Review logs for connection errors

### Profile Pictures Not Uploading

- Check file size limits (currently 5MB)
- Verify the `/public/uploads` directory structure
- Note: Files may not persist on free tier (see Profile Picture Storage above)

### Site is Slow to Load

- This is normal for free tier (cold starts)
- Consider upgrading to a paid plan for instant loading
- First request after inactivity takes 30-60 seconds

## Monitoring

- **Logs**: Available in Render dashboard
- **Metrics**: View in Render dashboard (CPU, memory, response times)
- **Alerts**: Configure in Render settings (paid plans)

## Updates and Redeployment

Render automatically redeploys when you push to your connected branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Manual redeployment:
- Go to Render dashboard
- Select your service
- Click "Manual Deploy" → "Deploy latest commit"

## Custom Domain (Optional)

To use a custom domain:
1. Go to your service settings in Render
2. Click "Custom Domain"
3. Add your domain and follow DNS configuration instructions
4. Update `NEXTAUTH_URL` environment variable to your custom domain

## Support

- Render Documentation: https://render.com/docs
- Movie Club Issues: [Your GitHub repo]/issues
