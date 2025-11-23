# VVAP

## Run API + MySQL with Docker
- Prereqs: Docker + Docker Compose.
- From repo root: `docker-compose up --build`.
- Services: API on `http://localhost:4000` (proxy to frontend), MySQL on `localhost:3306` (user `root`, password `example`, db `reviews_db`).
- DB schema auto-seeded from `backend/db/init.sql` on first start.
- Environment overrides: adjust `docker-compose.yml` or set `FRONTEND_ORIGIN`, `DB_*`, `PORT` as needed.
