# Deploying SOSGEN to Vercel

## Prerequisites

1. A Vercel account (free at https://vercel.com)
2. Your Gemini API key from Google AI Studio

## Deployment Steps

### 1. Prepare your repository

Push your code to a Git repository (GitHub, GitLab, or Bitbucket):

```bash
git init
git add .
git commit -m "Initial commit - SOSGEN app"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your repository
4. Vercel will automatically detect the configuration from `vercel.json`

### 3. Set Environment Variables

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following variable:
   - `GEMINI_API_KEY`: Your Google Gemini API key

### 4. Deploy

Click "Deploy" and Vercel will:
- Build your frontend
- Set up your serverless API functions
- Deploy everything automatically

## Important Notes

- The app is configured to work with Vercel's serverless functions
- Your Gemini API key is secure and only runs on the server
- The database functionality has been removed for this Vercel deployment
- All API calls are handled through `/api/generate-message`

## Custom Domain (Optional)

You can add a custom domain in your Vercel project settings under "Domains".

## Troubleshooting

If deployment fails:
1. Check the build logs in Vercel dashboard
2. Ensure your Gemini API key is correctly set
3. Verify all files are committed to your repository

Your SOSGEN app will be available at: `https://your-project-name.vercel.app`