# Attendance System – Setup Guide

This project is a **face recognition attendance system** with:

- **Backend**: Laravel (PHP) API – runs on **http://localhost:8000**
- **Frontend**: React + Vite app – runs on **http://localhost:5173**

Use this guide to run it on your laptop after unzipping.

**Quick start (Windows):** Open PowerShell in this folder and run `.\setup.ps1` once to install everything. Then run `.\run-backend.ps1` in one window and `.\run-frontend.ps1` in another. Open http://localhost:5173 in your browser.

---

## Prerequisites (install these first)

| Requirement | Version | Check command |
|-------------|---------|----------------|
| **PHP** | 8.2 or higher | `php -v` |
| **Composer** | Latest | `composer -V` |
| **Node.js** | 18 or higher (LTS recommended) | `node -v` |
| **npm** | Comes with Node.js | `npm -v` |

- **PHP**: [https://windows.php.net/download/](https://windows.php.net/download/) – add PHP to your system PATH.
- **Composer**: [https://getcomposer.org/download/](https://getcomposer.org/download/).
- **Node.js**: [https://nodejs.org/](https://nodejs.org/) – use the LTS version.

---

## Quick setup (first time)

### 1. Backend (Laravel)

Open a terminal in the project root and run:

```powershell
cd backend
```

Then run these commands **one by one**:

```powershell
# Install PHP dependencies
composer install

# Create .env from .env.example if it doesn't exist
if (!(Test-Path .env)) { Copy-Item .env.example .env }

# Generate application key
php artisan key:generate

# Create SQLite database file (if missing)
if (!(Test-Path database\database.sqlite)) { New-Item -ItemType File database\database.sqlite }

# Run database migrations
php artisan migrate --force

# (Optional) Seed demo data
php artisan db:seed --force

# Install frontend build tools for Laravel (Vite)
npm install
```

### 2. Frontend (React)

Open a **second** terminal in the project root and run:

```powershell
cd frontend
npm install
```

---

## Running the app

You need **two terminals** (or use the scripts below).

### Terminal 1 – Backend (Laravel API)

```powershell
cd backend
php artisan serve
```

Leave this running. You should see: **Laravel development server started on http://localhost:8000**.

### Terminal 2 – Frontend (React)

```powershell
cd frontend
npm run dev
```

Leave this running. You should see the local URL, usually **http://localhost:5173**.

### Use the app

- Open your browser and go to: **http://localhost:5173**
- The frontend talks to the API at **http://localhost:8000** (backend must be running).

---

## Using PostgreSQL (pgAdmin)

No SQL is required. Use pgAdmin only to create the database; the app uses it via `.env`.

1. In **pgAdmin**, create a new database (e.g. `sttendanve` or `attendance`).
2. In the project, open **`backend/.env`** and set:

   ```
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=sttendanve
   DB_USERNAME=postgres
   DB_PASSWORD=0000
   ```

   Use your real database name, username, and password.

3. From the **`backend`** folder run:

   ```powershell
   php artisan migrate --force
   php artisan db:seed --force
   ```

Tables and data will appear in your database in pgAdmin. The app will run against PostgreSQL and can perform better with more data.

**Important:** After changing `DB_*` in `.env`, you **must restart** the backend (`php artisan serve` or `run-backend.ps1`). Otherwise the app keeps using the old database (often SQLite).

**Check which database the app is using:** Open **http://localhost:8000/api/debug/database** in your browser (with the backend running). It will show `connection` and `database`. If it says `sqlite`, new students are saved to a file on disk, not to PostgreSQL/pgAdmin.

---

## One-command run (Windows)

From the project root you can use:

- **`run-backend.ps1`** – starts the Laravel server (Terminal 1).
- **`run-frontend.ps1`** – starts the React dev server (Terminal 2).

Run each in a **separate** PowerShell window (run the backend first, then the frontend).

If PowerShell says "script execution is disabled", run once:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| `php` not found | Install PHP and add it to your system PATH. |
| `composer` not found | Install Composer and add it to PATH. |
| `APP_KEY` empty | Run `php artisan key:generate` in the `backend` folder. |
| Database errors | Ensure `backend/database/database.sqlite` exists and run `php artisan migrate --force` in `backend`. |
| Frontend can’t reach backend | Make sure `php artisan serve` is running in `backend` (port 8000). |
| Port 8000 or 5173 in use | Stop the app using that port, or change the port in the command (e.g. `php artisan serve --port=8001`). |
| New students don't show in pgAdmin | App is likely still on SQLite. Set `DB_CONNECTION=pgsql` and other `DB_*` in `backend/.env`, then restart the backend. Check http://localhost:8000/api/debug/database to confirm. |

---

## Summary

1. Install **PHP 8.2+**, **Composer**, and **Node.js 18+**.
2. In **backend**: `composer install`, copy `.env`, `php artisan key:generate`, create DB, `php artisan migrate`, optionally `php artisan db:seed`, then `npm install`.
3. In **frontend**: `npm install`.
4. Run **backend**: `cd backend` → `php artisan serve`.
5. Run **frontend**: `cd frontend` → `npm run dev`.
6. Open **http://localhost:5173** in your browser.

---

## Default login credentials

After running the database seeder (`php artisan db:seed --force` in the `backend` folder), you can log in with:

| Role    | Email                     | Password   |
|---------|---------------------------|------------|
| **Admin**   | `admin@university.edu`     | `password` |
| Student | `student@university.edu`  | `password` |
| Lecturer| `lecturer@university.edu`  | `password` |

**If you get “invalid email or password”:** (1) If you haven't seeded yet, run `php artisan db:seed --force` in the `backend` folder. (2) If you already ran the seeder or get a UNIQUE constraint error, run `php artisan users:fix-passwords` in the `backend` folder to reset all passwords. Then log in with **admin@university.edu** and **password** (all lowercase).
