# STIConnect (Appointment System)

STIConnect is a role-based appointment/consultation booking system with a static HTML/CSS/JS frontend and an ASP.NET Core Web API backed by MySQL.

## Important: folder name must be `appointment_system`

This project must be hosted under the URL path:

`http://localhost/appointment_system`

That means the folder in your web root must be named **exactly**:

`appointment_system`

Example locations:

- **Windows (XAMPP):** `C:\xampp\htdocs\appointment_system`
- **macOS (Apache DocumentRoot):** put the folder under your web root so it resolves to `/appointment_system`

Why this matters:

- Many pages/components use absolute paths like `/appointment_system/...`.
- Push notifications register the service worker at `/appointment_system/sw.js`.

If you rename the folder, you must update all hard-coded `/appointment_system` references across the frontend.

---

## Features

- **Student**: request appointments, view consultations calendar, view history, cancel pending requests.
- **Teacher**: accept/decline requests, view accepted consultations calendar, see request/history lists.
- **Admin**: manage users/sections and monitor schedules (based on available admin pages).
- **Push notifications**: best-effort push notifications for request/accept/decline/cancel events.

## Tech Stack

- **Frontend**: static HTML/CSS/JavaScript (served by Apache/XAMPP)
- **Backend**: ASP.NET Core Web API (.NET 9)
- **Database**: MySQL
- **Optional tooling**: Docker Compose for running the API container

---

## URLs

| Service | URL |
|---|---|
| Frontend | `http://localhost/appointment_system` |
| API base | `http://localhost:5001/api` |
| Swagger | `http://localhost:5001/swagger` |

---

## Quick Start (recommended): Apache/XAMPP + MySQL + Docker API

This repo is set up so **Apache serves the frontend**, **MySQL runs on your host**, and **Docker runs only the API**.

### Prerequisites

- Apache/XAMPP running (so `http://localhost/appointment_system` works)
- MySQL running on your host (default port `3306`)
- Docker Desktop installed

### 1) Put the folder in your web root

Ensure the project folder is named `appointment_system` under your Apache web root.

### 2) Start Apache and MySQL

- **Windows (XAMPP Control Panel):** Start **Apache** and **MySQL**
- **macOS (system Apache):**
	- Start Apache: `sudo apachectl start`
	- Start MySQL (example): `brew services start mysql`

### 3) Start the API (Docker Compose)

From the repository root:

```bash
docker-compose up --build
```

The API will be available on `http://localhost:5001`.

### 4) Open the app

Go to:

`http://localhost/appointment_system`

---

## Alternative: run the API without Docker

If you want to run the API directly (no Docker), you can run it from the `api/` folder:

```bash
cd api
dotnet restore
dotnet run
```

Make sure your MySQL connection string is correct in `api/appsettings.json`.

---

## Configuration

### Frontend API URL

The frontend calls the API using a hard-coded base URL. If you change the API port/host, update:

- `shared/js/api.js`
- `auth/login-new.js`

Default is:

`http://localhost:5001/api`

### Database connection

- **Docker API**: `docker-compose.yml` passes a connection string via environment variables:
	- `ConnectionStrings__DefaultConnection=Server=host.docker.internal;Database=students_db;User=root;Password=;`
	- `host.docker.internal` lets the container reach the MySQL running on your host.

- **Non-Docker API**: `api/appsettings.json` contains the connection string used by `dotnet run`.

### JWT / Secrets

JWT and Web Push settings are stored in `api/appsettings.json`.

- For real deployments, you should change the JWT key and any push keys and avoid committing secrets.

---

## Database Notes

- This repository does **not** include EF Core migrations or a SQL schema dump.
- Create the database/tables manually in MySQL (or import your own dump).
- Some scheduling flows expect a join table named `teacher_sections` (`teacher_id`, `section_id`).

---

## Troubleshooting

### Frontend loads but API calls fail

- Confirm API is running: `http://localhost:5001/swagger`
- If you changed ports, update `API_BASE` in `shared/js/api.js` and `auth/login-new.js`.

### API container can’t connect to MySQL

- Ensure MySQL is running on the host and listening on `3306`.
- Confirm credentials/database exist (default shown uses `students_db`).
- On Linux, `host.docker.internal` may need extra setup; on macOS/Windows it usually works.

### 401 / keeps redirecting to login

- Login stores a JWT in `localStorage`. If it’s missing/expired, protected requests return 401 and the frontend redirects.

### Push notifications don’t work

- You must grant notification permission in the browser.
- The service worker path is `/appointment_system/sw.js` (folder name must be `appointment_system`).

