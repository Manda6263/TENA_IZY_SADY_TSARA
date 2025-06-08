# 🚀 Deployment Guide - SuiviVente

This guide will walk you through setting up Supabase and Netlify for the SuiviVente application.

## 📋 Prerequisites

- GitHub account with your project repository
- Supabase account
- Netlify account

## 🗄️ Supabase Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `suivivente-db`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### Step 2: Configure Database

1. Wait for project creation (2-3 minutes)
2. Go to **SQL Editor** in the left sidebar
3. Create a new query and paste the contents of `supabase/migrations/20250606214606_pink_darkness.sql`
4. Click "Run" to execute the schema creation
5. Create another new query and paste the contents of `supabase/migrations/20250606214619_bright_summit.sql`
6. Click "Run" to insert sample data
7. Create a third query and paste the contents of `supabase/migrations/20250606220658_round_snowflake.sql`
8. Click "Run" to add the helper functions

### Step 3: Get API Keys

1. Go to **Settings** > **API** in the left sidebar
2. Copy the following values:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **Project API Key (anon public)**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 4: Configure Authentication

1. Go to **Authentication** > **Settings**
2. Under **Site URL**, add your Netlify domain (you'll get this after Netlify setup)
3. Under **Redirect URLs**, add:
   - `http://localhost:5173` (for development)
   - `https://your-netlify-domain.netlify.app` (for production)

### Step 5: Set Up Row Level Security

The migration scripts already include RLS policies, but verify:

1. Go to **Authentication** > **Policies**
2. Ensure policies are created for `sales`, `products`, and `logs` tables
3. Test policies by creating a test user in **Authentication** > **Users**

## 🌐 Netlify Setup

### Step 1: Connect Repository

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "New site from Git"
3. Choose "GitHub" and authorize Netlify
4. Select your `suiviventev1` repository
5. Configure build settings:
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### Step 2: Add Environment Variables

1. Go to **Site settings** > **Environment variables**
2. Add the following variables:
   - **VITE_SUPABASE_URL**: Your Supabase project URL
   - **VITE_SUPABASE_ANON_KEY**: Your Supabase anon key

### Step 3: Configure Domain

1. Go to **Site settings** > **Domain management**
2. Note your default Netlify domain: `https://amazing-name-123456.netlify.app`
3. Optionally, add a custom domain

### Step 4: Update Supabase Redirect URLs

1. Return to Supabase **Authentication** > **Settings**
2. Add your Netlify domain to **Redirect URLs**:
   - `https://your-netlify-domain.netlify.app`

## 🔧 Local Development Setup

### Step 1: Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start Development Server

```bash
npm run dev
```

## ✅ Verification Checklist

### Supabase
- [ ] Project created successfully
- [ ] Database schema migrated
- [ ] Sample data inserted
- [ ] Helper functions created
- [ ] API keys copied
- [ ] Authentication configured
- [ ] RLS policies active

### Netlify
- [ ] Repository connected
- [ ] Build settings configured
- [ ] Environment variables added
- [ ] Domain configured
- [ ] First deployment successful

### Local Development
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Development server running
- [ ] Can connect to Supabase

## 🚨 Troubleshooting

### Common Issues

**Build fails on Netlify:**
- Check environment variables are set correctly
- Verify build command is `npm run build`
- Check Node.js version (should be 18+)

**Cannot connect to Supabase:**
- Verify URL and API key are correct
- Check if RLS policies are blocking access
- Ensure authentication is working

**Authentication not working:**
- Check redirect URLs in Supabase
- Verify site URL is set correctly
- Test with a simple user creation

### Getting Help

1. Check Supabase logs in **Logs** > **API**
2. Check Netlify deploy logs in **Deploys**
3. Use browser developer tools for client-side errors

## 🔄 Continuous Deployment

Once set up, your deployment workflow will be:

1. Make changes to your code
2. Commit and push to `main` branch
3. Netlify automatically builds and deploys
4. Changes are live within 2-3 minutes

## 🔐 Security Notes

- Never commit `.env.local` to version control
- Use environment variables for all sensitive data
- Regularly rotate API keys
- Monitor Supabase usage and logs
- Keep dependencies updated

## 📊 Monitoring

### Supabase Dashboard
- Monitor database usage
- Check API request logs
- Review authentication metrics

### Netlify Analytics
- Track site performance
- Monitor build success/failure
- Review bandwidth usage

Your SuiviVente application is now ready for production! 🎉