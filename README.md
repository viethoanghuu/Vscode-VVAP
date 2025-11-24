# VVAP - Gaming Laptop Review Aggregator

Demo full-stack app that aggregates gaming laptop reviews from multiple sources and visualizes the data. Stack: React + Vite (frontend), Express + MySQL (backend), plus a small mock scraper.

## Table of Contents
- [Folder Structure](#folder-structure)
- [Quick Start with Docker](#quick-start-with-docker)
- [Manual Dev Setup](#manual-dev-setup)
- [Backend API](#backend-api)
- [Data Model](#data-model)
- [Frontend Usage](#frontend-usage)
- [Notes](#notes)

## Folder Structure
```
backend/   # Express API + MySQL access
frontend/  # React + Vite SPA
scraper/   # Mock scraper (server returns fake review JSON)
docker-compose.yml  # Launches DB + API + frontend via Docker
```

## Quick Start with Docker
Requirements: Docker + Docker Compose.

```bash
docker-compose up --build
```

- API: http://localhost:4000
- Frontend: http://localhost:5173
- MySQL: host localhost:3306, user `root`, password `example`, db `reviews_db`
- On first run MySQL seeds the schema from `backend/db/init.sql`.

## Manual Dev Setup
### 1) Local MySQL
- Create the DB with the script: `mysql -uroot -p < backend/db/init.sql`
- Or create it yourself and update backend environment variables.

### 2) Backend (Express)
```bash
cd backend
npm install
# create .env if needed (see variables below)
npm run dev            # or npm start for production mode
```

Key environment variables:
- `PORT` (default 4000)
- `DB_HOST` (default 127.0.0.1)
- `DB_PORT` (default 3306)
- `DB_USER` / `DB_PASSWORD`
- `DB_NAME` (default reviews_db)
- `FRONTEND_ORIGIN` for CORS, e.g. `http://localhost:5173`

### 3) Frontend (React + Vite)
```bash
cd frontend
npm install
# configure the backend endpoint
echo "VITE_API_URL=http://localhost:4000" > .env.local
npm run dev   # opens http://localhost:5173
```

### 4) Mock scraper (optional)
Mock review data server (not required; backend currently serves built-in mock data).
```bash
cd scraper
npm install
npm start   # runs on :5050, endpoint GET /scrape/all/:productId
```

## Backend API
Base URL: `http://localhost:4000`

- `GET /health`  
  Health check.

- `POST /api/products/:id/fetch`  
  Calls the mock fetcher to store new reviews in the DB. Returns `{ added, skipped, total }`.

- `GET /api/products/:id/reviews`  
  Retrieves up to 500 stored reviews for the product.

- `GET /api/products/:id/aggregate`  
  Returns aggregated statistics:
  ```json
  {
    "overall": { "average_rating": 4.3, "total_reviews": 12, "min_rating": 3, "max_rating": 5 },
    "by_source": [ { "source": "Amazon", "average_rating": 4.5, "review_count": 6 } ],
    "rating_histogram": { "5": 4, "4": 5, "3": 2, "2": 1, "1": 0 }
  }
  ```

## Data Model
Table `reviews` (see `backend/db/init.sql`):
- Composite PK: `(product_id, source, review_id)`
- Main fields: `product_id`, `source`, `review_id`, `author`, `rating` (TINYINT), `title`, `body`, `created_at`, `fetched_at`

## Frontend Usage
- Choose a laptop in the dropdown, click **Fetch Reviews**.  
- Dashboard shows:
  - Cards: total reviews, average rating, number of sources.
- Histogram of ratings 1-5.
  - Pie chart for source share + list with counts/averages.
  - Review table with source filters (All/None/per source).
- Toast notifications for success/error and an overlay spinner while fetching.

## Notes
- Sample products live in `frontend/src/App.jsx` (`PRODUCTS`).
- Mock fetch logic is in `backend/src/services/mockScraper.js`. To use a real scraper, replace `fetchReviewsFromSources` with external service calls (e.g., `scraper/index.js`).
- CORS: adjust `FRONTEND_ORIGIN` (backend) and `VITE_API_URL` (frontend) when deploying.
