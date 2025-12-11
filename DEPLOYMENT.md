# Deployment Guide

## Prerequisites

1. **Groq API Key**: Get your API key from [https://console.groq.com/](https://console.groq.com/)
2. **GitHub Account** (for Vercel deployment)
3. **Node.js 18+** installed locally (for testing builds)

## Option 1: Deploy to Vercel (Recommended)

Vercel is the easiest and recommended platform for Next.js applications.

### Steps:

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [https://vercel.com](https://vercel.com)
   - Sign up/Login with your GitHub account
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Add Environment Variable**
   - In Vercel project settings, go to "Environment Variables"
   - Add: `GROQ_API_KEY` = `your_groq_api_key_here`
   - Save and redeploy

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Vercel Configuration

Vercel automatically handles:
- ✅ Next.js build optimization
- ✅ Serverless functions for API routes
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments on git push

## Option 2: Deploy to Other Platforms

### Netlify

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy**
   - Go to [https://netlify.com](https://netlify.com)
   - Drag and drop the `.next` folder, or
   - Connect to GitHub for continuous deployment

3. **Add Environment Variable**
   - Go to Site settings → Environment variables
   - Add `GROQ_API_KEY`

### Railway

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Add Environment Variable**
   - In Railway dashboard, add `GROQ_API_KEY`

### Self-Hosted (VPS/Server)

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

3. **Use PM2 for process management**
   ```bash
   npm install -g pm2
   pm2 start npm --name "ai-resume" -- start
   pm2 save
   pm2 startup
   ```

4. **Set up reverse proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Set Environment Variable**
   ```bash
   export GROQ_API_KEY=your_groq_api_key_here
   ```

## Environment Variables

Create a `.env.local` file (for local development) or add in your hosting platform:

```env
GROQ_API_KEY=your_groq_api_key_here
```

**Important**: Never commit `.env.local` to git. It's already in `.gitignore`.

## Pre-Deployment Checklist

- [ ] Test the application locally (`npm run dev`)
- [ ] Build the application successfully (`npm run build`)
- [ ] Get Groq API key from [console.groq.com](https://console.groq.com/)
- [ ] Add `GROQ_API_KEY` environment variable in hosting platform
- [ ] Test file upload functionality
- [ ] Test PDF generation
- [ ] Verify all features work in production

## Troubleshooting

### Build Errors

If you encounter build errors:

1. **Check Node.js version**: Ensure you're using Node.js 18+
   ```bash
   node --version
   ```

2. **Clear cache and reinstall**
   ```bash
   rm -rf node_modules .next
   npm install
   npm run build
   ```

### API Key Issues

- Ensure `GROQ_API_KEY` is set in your hosting platform's environment variables
- Restart/redeploy after adding environment variables
- Check API key is valid at [console.groq.com](https://console.groq.com/)

### PDF Generation Issues

- Ensure `pdf-lib` and `pdf2json` are in dependencies (they are)
- Check serverless function timeout limits (Vercel: 10s on free tier, 60s on Pro)

## Post-Deployment

1. Test all features:
   - Upload resume PDF
   - Paste job description
   - Run analysis
   - Download tailored PDF

2. Monitor:
   - Check Vercel/Netlify logs for errors
   - Monitor API usage in Groq console
   - Check application performance

## Custom Domain (Optional)

### Vercel
- Go to Project Settings → Domains
- Add your custom domain
- Follow DNS configuration instructions

### Netlify
- Go to Site settings → Domain management
- Add custom domain
- Configure DNS

---

**Recommended**: Use Vercel for the easiest deployment experience with Next.js.

