# Cyber Cafe SaaS Backend

This is the backend for the Cyber Cafe SaaS project, built with FastAPI, PostgreSQL, and Redis.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Python 3.10+

### Setup

1. **Clone the repository:**

   ```bash
   git clone <repository_url>
   cd cyber-cafe-saas/backend
   ```

2. **Environment Variables:**

   Create a `.env` file in the `backend` directory based on `.env.example` and fill in the required values.

   ```bash
   cp .env.example .env
   ```

3. **Run with Docker Compose (Recommended):**

   ```bash
   docker-compose up --build
   ```

   This will start the FastAPI application and a PostgreSQL database.

4. **Access the API:**

   The API will be available at `http://localhost:8000`.
   Interactive API documentation (Swagger UI) will be at `http://localhost:8000/api/v1/docs`.

### Local Development (without Docker Compose)

1. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Run the application:**

   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── repositories/
│   ├── schemas/
│   ├── security/
│   ├── services/
│   └── workers/
├── main.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Versioning

The API is versioned under `/api/v1`.

## Health Check

A health check endpoint is available at `/api/v1/health`.
