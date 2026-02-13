# 🚀 GANGES Project: Setup & Run Guide

Follow these steps to get both the Backend and Frontend running locally.

---

## 📋 Prerequisites
1.  **Node.js**: [Download here](https://nodejs.org/) (Version 18+ recommended).
2.  **Docker Desktop**: [Download here](https://www.docker.com/products/docker-desktop/). **Ensure it is running** before starting the services below.
---

## 🛠️ Step 1: Infrastructure (Postgres & Redis)
The backend requires a database and a cache server. I've provided a Docker setup for this.

1.  Open a terminal in the **root** `Ganges` folder.
2.  Run the following command:
    ```powershell
    docker-compose up -d
    ```
    *Wait until the containers for `ganges-db` and `ganges-redis` show as "Running" in Docker Desktop.*

---

## 🔑 Step 2: Environment Configuration
The backend needs to connect to your Supabase project for it to handle logins correctly.

1.  Open `backend/.env`.
2.  Replace the temporary values with your real **Supabase** keys:
    *   `SUPABASE_URL`: Your Supabase Project URL.
    *   `SUPABASE_JWT_SECRET`: Found in Settings -> API in Supabase.
3.  Ensure your `DATABASE_URL` matches the updated Docker setup:
    `postgresql://user:password@localhost:5433/ganges?schema=public`

---

## 📦 Step 3: Backend Setup & Run
1.  In your `backend` terminal, install dependencies:
    ```powershell
    npm install
    ```
2.  Push the database schema to your local Postgres:
    ```powershell
    npx prisma migrate dev --name init
    ```
3.  Start the backend server:
    ```powershell
    npm run dev
    ```
    *The API will be live at `http://localhost:3000`.*

---

## 💻 Step 4: Frontend Setup & Run
1.  Open a **NEW** terminal in the root `Ganges` folder.
2.  Install dependencies:
    ```powershell
    npm install
    ```
3.  Start the frontend:
    ```powershell
    npm run dev
    ```
    *The dashboard will be live at `http://localhost:5173`.*

---

---

## 🛠️ Troubleshooting (Windows)
If you get "Port already in use" or "Access Denied" errors, use the automatic fix script:

1.  Open a terminal in the `backend` folder.
2.  Run the fix script:
    ```powershell
    .\fix-server.ps1
    ```
    *If prompted about execution policies, you can run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first.*
