# 🌍 TourNexus

## Connecting Tourism. Predicting Impact. Adapting Journeys.

**TourNexus** is a dependency-aware tourism intelligence and itinerary adaptation platform designed to understand tourism as an interconnected ecosystem rather than a collection of independent services.

The platform connects tourism components such as:

- 🏛️ Attractions
- 🏨 Hotels
- 🚌 Transportation
- 🍽️ Restaurants
- 🎭 Events
- 🌦️ Weather
- 🗺️ Routes
- 👥 Crowd conditions
- ♿ Accessibility
- 🎟️ Activities and bookings

The key idea behind TourNexus is simple:

> **When one tourism service changes, the system should understand what else is affected and automatically adapt the tourist's journey.**

---

# 🌐 Overview

Modern tourism is supported by many digital services.

A tourist may use one application to discover an attraction, another service to check transportation, another platform to book a hotel, another service for weather information, and another service for restaurants or events.

Although these services may be available digitally, they are often treated as **separate entities**.

This creates a problem when something changes.

```text
Attraction Closed
       ↓
Planned Activity Cancelled
       ↓
Tourist Has Free Time
       ↓
Transport Plan Becomes Suboptimal
       ↓
Restaurant Timing Changes
       ↓
Alternative Attraction Needed
       ↓
New Route Required
       ↓
Itinerary Must Be Replanned
```

---

# 🚀 Running the project

The backend defaults to a local SQLite file, so a fresh clone runs with no
database server to install. PostgreSQL + PostGIS is still used whenever
`DATABASE_URL` is set.

### 1. Backend — FastAPI

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate      # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.database.seed
uvicorn app.main:app --reload
```

API on **http://127.0.0.1:8000** · interactive docs at **/docs**

### 2. Frontend — React + TypeScript + Vite

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App on **http://localhost:5173**

### Demo accounts

Created by the seed script:

| Role | Email | Password |
|---|---|---|
| Tourist | `tourist@tournexus.in` | `tourist123` |
| Authority | `authority@tournexus.in` | `authority123` |

---

# 🧭 What is in the app

### Tourist application
Profile · Destination & Preferences · Itinerary Generation · Interactive Map ·
Current Itinerary · Disruption Alerts · Dependency & Impact View ·
Alternative Recommendations · Updated Itinerary

### Authority console
Overview & KPIs · Destination Map · Active Disruptions · Dependency Graph ·
Ripple Effect Visualization · Impact Analysis · Intervention Prioritization ·
Affected Tourists · Affected Itineraries

Every screen reads from the API. There is no hardcoded tourism data in the
frontend.

---

# 🧱 Architecture

```text
frontend/                     React 18 + TypeScript + Vite + Tailwind v4
  src/lib/api.ts              the only place that calls fetch()
  src/lib/types.ts            response types mirroring the Pydantic schemas
  src/hooks/useApi.ts         loading / error / offline / retry state
  src/context/AuthContext.tsx JWT session, restored on reload
  src/components/             Layout, CrowdMap, DependencyFlow, ui primitives
  src/pages/tourist/          the 9 tourist screens
  src/pages/authority/        the 9 authority screens
  legacy/                     the original standalone HTML pages, kept for reference

backend/                      FastAPI + SQLAlchemy 2.0
  app/api/routes/             REST endpoints
  app/models/                 SQLAlchemy models
  app/schemas/                Pydantic request/response schemas
  app/services/               crowd, dependency graph, ripple, alternatives, interventions
  app/core/                   config and JWT/bcrypt security
  app/database/seed.py        the Puri / Konark / Bhubaneswar scenario
```

## The decision pipeline

```text
Tourism data  →  Dependency graph  →  Ripple analysis  →  Intervention ranking  →  Dashboards
   (rows)         (NetworkX DiGraph)     (BFS/DFS/depth)     (effect ÷ cost)        (React)
```

`GET /api/analytics/interventions/{type}/{id}` runs that whole pipeline for one
disrupted node and returns the cascade, the affected services by depth, and the
ranked response options.

---

# 🔌 API surface

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` |
| Catalogue | `/api/destinations` · `/api/attractions` · `/api/services` · `/api/hotels` · `/api/restaurants` · `/api/transport` · `/api/events` |
| Conditions | `/api/crowd` · `/api/crowd/latest` · `/api/crowd/attraction/{id}` · `/api/disruptions` · `/api/disruptions/active` |
| Planning | `/api/itineraries` · `/api/itinerary-items/itinerary/{id}` |
| Graph engine | `/api/dependencies` · `/api/dependencies/analysis/{type}/{id}` · `/api/dependencies/alternative-path/...` |
| Analytics | `/api/analytics/overview` · `/api/analytics/graph` · `/api/analytics/interventions/{type}/{id}` |

Run `pytest` in `backend/` for the graph and service tests.
