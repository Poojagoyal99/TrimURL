# TrimURL — URL Shortener

A production-grade URL shortener with analytics, built with Django, Redis, Celery, React, and Docker.

---

## Tech Stack

| Layer          | Technology                        |
|----------------|-----------------------------------|
| Backend API    | Django + Django REST Framework    |
| Database       | SQLite (dev) / PostgreSQL (prod)  |
| Cache & Queue  | Redis                             |
| Background Jobs| Celery                            |
| Frontend       | React + Chart.js                  |
| Containers     | Docker + Docker Compose           |

---

## Prerequisites

- Python 3.10+
- Redis (running locally on port 6379)
- Node.js 18+ (for frontend, later)

---

## Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run migrations
python manage.py migrate

# 5. Start the Django development server
python manage.py runserver
```

Server runs at: http://127.0.0.1:8000

---

## Starting Redis (required for caching)

### Windows (using WSL or Redis for Windows)
```bash
redis-server
```

### Mac
```bash
brew services start redis
```

Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

---

## Starting Celery (background task worker)

Open a **second terminal**, activate the venv, then:

```bash
cd backend

# Windows (must use --pool=solo)
python -m celery -A core worker --pool=solo -l info

# Mac/Linux
python -m celery -A core worker -l info
```

### Starting Celery Beat (periodic task scheduler)

Open a **third terminal**:

```bash
cd backend

python -m celery -A core beat -l info
```

> Note: On Windows, the plain `celery` command can resolve to a global Python installation instead of your project virtual environment. Using `python -m celery` avoids that issue.
> `--pool=solo` is still required on Windows for the worker process.

---

## API Endpoints

| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| POST   | `/api/shorten/`                 | Create a short URL                 |
| GET    | `/<short_code>/`                | Redirect to original URL           |
| GET    | `/api/stats/<short_code>/`      | Get click count and URL details    |
| GET    | `/api/analytics/<short_code>/`  | Full analytics (coming Day 8)      |

### Example: Shorten a URL

```bash
curl -X POST http://127.0.0.1:8000/api/shorten/ \
  -H "Content-Type: application/json" \
  -d '{"original_url": "https://google.com"}'
```

### Example: Custom short code

```bash
curl -X POST http://127.0.0.1:8000/api/shorten/ \
  -H "Content-Type: application/json" \
  -d '{"original_url": "https://google.com", "custom_code": "goog"}'
```

---

## Project Structure

```
TrimURL/
├── backend/
│   ├── core/           → Django project settings, URLs
│   ├── trim/           → Main app (models, views, serializers, signals)
│   ├── manage.py
│   └── requirements.txt
├── frontend/           → React app (coming Day 9)
├── docker-compose.yml  → (coming Day 13)
└── ROADMAP.md
```

---

## Running Everything (summary)

| Terminal | Command                                          |
|----------|--------------------------------------------------|
| 1        | `redis-server`                                   |
| 2        | `python manage.py runserver`                     |
| 3        | `python -m celery -A core worker --pool=solo -l info` |
| 4        | `python -m celery -A core beat -l info`               |
