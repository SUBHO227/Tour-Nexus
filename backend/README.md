# TourNexus Backend

FastAPI + SQLAlchemy 2.0 service behind the TourNexus dashboards.

## Setup

```bash
python -m venv .venv
source .venv/Scripts/activate      # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.database.seed
uvicorn app.main:app --reload
```

Interactive docs: http://127.0.0.1:8000/docs

## Database

`DATABASE_URL` is optional. Leave it unset and the app uses a local SQLite
file (`tournexus.db`) so the project runs on a fresh clone with nothing else
installed. For PostgreSQL + PostGIS, set it in `.env`:

```
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@localhost:5432/tournexus
```

`python -m app.database.seed` is idempotent — it clears the seeded tables and
rewrites them, so it is safe to re-run.

## Layout

```text
app/
  api/routes/     REST endpoints, one module per resource
  core/           config, JWT signing, bcrypt hashing, role guards
  database/       engine/session, table creation, seed data
  models/         SQLAlchemy models
  schemas/        Pydantic request/response schemas
  services/       the engine: crowd, dependency_graph, ripple_analysis,
                  alternative_path, intervention
tests/            pytest suite for the graph and scoring logic
```

## The engine

| Module | Does |
|---|---|
| `services/crowd_service.py` | visitors ÷ capacity → score → low/medium/high/critical |
| `services/dependency_graph.py` | builds a NetworkX `DiGraph` from the `dependencies` table |
| `services/ripple_analysis.py` | BFS/DFS from a disrupted node; affected set, chain, depths, impact level |
| `services/alternative_path.py` | removes the disrupted node, re-runs weighted shortest-simple-paths |
| `services/intervention.py` | scores the intervention catalogue as `reach × strength ÷ cost` |

Node ids in the graph are `"{type}:{id}"` — for example `service:1`,
`transport:4`, `attraction:2`.

## Auth

Registration and login are the only ways to create a user. The client sends a
plain password; the API hashes it with bcrypt and returns a JWT. `/api/users`
requires the `authority` role.

## Tests

```bash
pytest
```
