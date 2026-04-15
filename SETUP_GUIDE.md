# Whyte Pyramid Academy — Setup Guide

## Step 1: Install Node.js (if not done)
Download from https://nodejs.org — use LTS version

## Step 2: Install dependencies
Open terminal in the project folder and run:
```
npm install
```

## Step 3: Set up Supabase database
1. Go to https://supabase.com → your project
2. Click SQL Editor in the left sidebar
3. Click "New query"
4. Copy the entire contents of `schema.sql`
5. Paste it into the SQL editor
6. Click "Run"
7. You should see "Success. No rows returned"

## Step 4: Get your service_role key
1. Supabase → Settings → API
2. Copy the "service_role" key (NOT the anon key)
3. Open `.env.local`
4. Replace `your_service_role_key_here` with your actual key

## Step 5: Run development server
```
npm run dev
```
Open http://localhost:3000

## Default accounts (password: SuperAdmin@123)
- superadmin@whytepyramid.com → Super Admin
- admin@whytepyramid.com → Admin

## Step 6: Create educator and learner accounts
Log in as admin → go to Educators → Add Educator
Log in as admin → go to Learners → Add Learner

## Deploy to Vercel (free, 2 minutes)
1. Push project to GitHub
2. Go to https://vercel.com → New Project
3. Import your GitHub repo
4. Add all environment variables from .env.local
5. Click Deploy

Your portal will be live at https://your-project.vercel.app
