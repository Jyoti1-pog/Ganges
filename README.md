<img width="1885" height="872" alt="image" src="https://github.com/user-attachments/assets/892f58d7-9745-4251-b2c4-3d7c78ff5890" />

Ganges is a web platform that helps users shop from international stores and manage their packages through a virtual warehouse and shipping dashboard. Users can sign up, get a virtual address, track packages, manage shipments, and control their wallet — all in one place.

This project is built as a real working system with authentication, dashboard, package tracking structure, and deployment setup.

🚀 What Ganges Does

Ganges allows users to:

Create an account and log in using Email or Google

Get a virtual warehouse address

View received packages in locker/inventory

Create and manage shipments

Track shipment status

Request personal shopper orders

Estimate shipping costs

Manage wallet balance and transactions

Access support and coupons section

After login, users are redirected to their personal dashboard, not the landing page.

🧩 Main Features
🔐 Authentication

Supabase Authentication

Google OAuth login

Email/password login

Session persistence

Protected dashboard routes

Production redirect (no localhost issues)

📊 User Dashboard

After login, users see:

Welcome message with their name

Wallet balance

Items in locker

Active shipments

Quick action buttons

📦 Locker / Inventory

List of received packages

Package status (received / inspected / ready)

Warehouse photos (structure ready)

Select packages for shipment creation

🚚 Shipments

Shipment list

Tracking ID + status

Courier info (structure ready for API integration)

Shipment creation flow

🛒 Personal Shopper

Submit product URL

Quantity / size / color

Max price

Admin quote workflow (DB ready)

💰 Wallet

Balance display

Transaction history

Add funds (payment integration ready)

🧮 Shipping Calculator

Country input

Weight & dimensions

Estimated shipping cost

Delivery time estimate

🎟 Support & Coupons

FAQ section

Ticket request form

Coupon request option

🛠 Tech Stack
Frontend

React + TypeScript

Vite

Tailwind / Custom CSS

React Router

Context API

Backend / Services

Supabase

Supabase Auth

Supabase Database (PostgreSQL)

Row Level Security (RLS)

Deployment

Vercel

GitHub

📁 Project Structure
src/
 ├── components/
 │   ├── dashboard/
 │   ├── AuthModal.tsx
 │   └── ProtectedRoute.tsx
 │
 ├── contexts/
 │   └── AuthContext.tsx
 │
 ├── pages/
 │   ├── DashboardHome.tsx
 │   ├── Locker.tsx
 │   ├── Shipments.tsx
 │   ├── Wallet.tsx
 │   └── Support.tsx
 │
 ├── services/
 │   ├── api.service.ts
 │   └── database.service.ts
 │
 ├── lib/
 │   └── supabaseClient.ts
 │
 └── App.tsx

⚙️ Environment Variables

Create a .env file:

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key


In Vercel → Project Settings → Environment Variables → add the same values.

▶️ Run Locally

Install dependencies:

npm install


Run dev server:

npm run dev


Build production bundle:

npm run build


Preview production build:

npm run preview

🌐 Deployment (Vercel)
Step 1 — Push to GitHub
git add .
git commit -m "deploy ready"
git push origin main

Step 2 — Import in Vercel

Go to Vercel Dashboard

New Project

Select your repo

Framework → Vite

Build Command → vite build (or npm run build)

Output Directory → build

Step 3 — Add Environment Variables

Add Supabase keys in Vercel settings.

Step 4 — Add Supabase Redirect URL

In Supabase Auth → URL Configuration:

Add:

https://your-vercel-domain.vercel.app


and

https://your-project-ref.supabase.co/auth/v1/callback

🔒 Auth Flow (Production Safe)

No hardcoded localhost redirects

Uses dynamic origin detection

OAuth redirects go to /dashboard

Session restored on refresh

Protected routes block unauthorized access
