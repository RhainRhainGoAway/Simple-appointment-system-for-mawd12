# Appointment System - Docker API Setup

## Setup: API Only (You manage Apache & MySQL)

This Docker setup runs **only the ASP.NET API**. You manually start Apache and MySQL.

---

## Windows Setup

### Prerequisites:
- Docker Desktop installed
- XAMPP installed

### How to Run:

1. **Start XAMPP** (Apache + MySQL)
   - Open XAMPP Control Panel
   - Click **Start** → Apache
   - Click **Start** → MySQL

2. **Start the API with Docker:**
   ```bash
   cd D:\xampp\htdocs\appointment_system
   docker-compose up
   ```

3. **Open your browser:**
   ```
   v
   ```

---

## macOS Setup

### Prerequisites:
- Docker Desktop installed
- MySQL running (via Homebrew or Docker separately)

### How to Run:

1. **Start MySQL** (if not already running)
   ```bash
   brew services start mysql
   # or run standalone MySQL Docker
   ```

2. **Start Apache** (if not already running)
   ```bash
   sudo apachectl start
   ```

3. **Start the API:**
   ```bash
   cd /path/to/appointment_system
   docker-compose up
   ```

4. **Open your browser:**
   ```
   http://localhost/appointment_system
   ```

---

## Service URLs

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost/appointment_system |
| **API** | http://localhost:5000/api |
| **Swagger** | http://localhost:5000/swagger |
| **MySQL** | localhost:3306 (from your local setup) |

---

## Commands

| Command | Description |
|---------|-------------|
| `docker-compose up` | Start API |
| `docker-compose up -d` | Start API in background |
| `docker-compose down` | Stop API |
| `docker-compose logs -f` | View logs |
| `docker-compose restart` | Restart API |

---

## Database Connection

Update your connection string in `api/appsettings.json` if needed:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=students_db;User=root;Password=;"
}
```

---

## To Stop Everything

1. **Stop Docker API:**
   ```bash
   docker-compose down
   ```

2. **Stop MySQL & Apache** (XAMPP or manual)
   - Close XAMPP Control Panel
   - Or: `brew services stop mysql` (macOS)

---

## Troubleshooting

**API not connecting to MySQL?**
- Make sure MySQL is running on `localhost:3306`
- Check connection string in `appsettings.json`

**Port already in use?**
- Change port in `docker-compose.yml` (e.g., `5002:80`)
- Update `API_BASE` in `auth/login-new.js` and `shared/js/api.js`

**Docker won't build?**
```bash
docker-compose build --no-cache
docker-compose up
```
