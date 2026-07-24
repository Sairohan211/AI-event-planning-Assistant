# AuraPlan Deployment Guide

A walkthrough for deploying the AuraPlan Full-Stack event planning platform to Vercel (Frontend) and Render (Backend) with Supabase PostgreSQL.

---

## 🏛️ Platform Map

- **React Frontend**: Deployed on Vercel
- **Express Backend**: Deployed on Render
- **Database Layer**: Supabase PostgreSQL Instance
- **AI Core**: Google Gemini Studio API (Server-side Calls Only)

---

## 📦 Step 1: Database Setup (Supabase)

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Under **Project Settings -> Database**, locate the **Connection String** (URI format starting with `postgres://`).
3. Store this URL as your `DATABASE_URL` in the Render environment variables.
4. Copy the SQL content in `database/schema.sql` and run it in the Supabase **SQL Editor** to ensure tables are initialized, or let the backend do it automatically on startup when connected.

---

## ⚙️ Step 2: Deploy Backend on Render

1. Sign in to [Render](https://render.com/) and create a new **Web Service**.
2. Link your GitHub repository.
3. Configure the settings:
   - **Name**: `auraplan-backend`
   - **Root Directory**: `backend`
   - **Environment/Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables**:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `[A-Long-Secure-Random-String]`
   - `GEMINI_API_KEY`: `[Your-Google-AI-Studio-Key]`
   - `GEMINI_MODEL`: `gemini-1.5-flash`
   - `DATABASE_URL`: `[Your-Supabase-Connection-String]`
   - `FRONTEND_URL`: `https://[your-app-name].vercel.app` (You can update this after Vercel deployment)
5. Deploy and copy your stable Render web service URL (e.g. `https://auraplan-backend.onrender.com`).

---

## 🎨 Step 3: Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com/) and import your project repository.
2. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add the **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://[your-backend-name].onrender.com/api`
4. Deploy the site.
5. In the backend Render configurations, update `FRONTEND_URL` to match the generated Vercel production domain and redeploy the backend web service.

---

## 📋 Post-Deployment Integration Verification

- Access the production domain.
- Register a test Organizer account.
- Create an event and verify that the requirements wizard launches.
- Click **Draft Plan** under AI Planner, verifying the Gemini connection.
- Update a task blocker and quote value, checking that database states update.
- Navigate to the **Academy** tab, generate notes on a test topic, complete the quiz, and check history pages.
