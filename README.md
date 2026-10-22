# ReTrip — Auto-index Travelog

**Intelligent Travel Memory Reconstruction System**  
Graduation project | 2 students | Mobile-first (React Native + Expo) | FastAPI + Python

ReTrip aims to reconstruct past travel experiences from photo collections: import photos, extract metadata, detect duplicates, group photos into travel events, handle missing metadata, and present a reviewable timeline and map. AI journal writing is a secondary feature.

> **Status:** Initial project scaffold. The Auto-Indexing Engine, database, production authentication, and mobile app are **not implemented yet**.

## Research focus

**Hybrid spatio-temporal event clustering under incomplete metadata.** Compare time-only, time+GPS, and hybrid (time+GPS+image embeddings) methods. Keep inferred information separate from confirmed facts and allow unassigned photos.

## Repository layout

~~~text
apps/                 Mobile app bootstrap guide (Expo)
services/api/         Runnable FastAPI starter + tests
research/             Auto-Indexing experiment plan
docs/                 Scope, use cases, architecture
infra/                Infrastructure decisions and notes
.github/workflows/    Backend continuous integration
~~~

## Run the API locally

Requires Python 3.11 or newer.

~~~bash
cd services/api
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload
~~~

Open http://127.0.0.1:8000/docs or check http://127.0.0.1:8000/health.

~~~bash
cd services/api
pytest -q
ruff check .
~~~

## Create the mobile application

The mobile app has **not been generated in this commit**. Generate it from the official Expo template so its dependencies are mutually compatible:

~~~bash
cd apps
npx create-expo-app@latest mobile
cd mobile
npx expo start
~~~

The official Expo template uses TypeScript and Expo Router. Follow the Expo SDK/Expo Go compatibility guidance printed by the CLI, especially for physical devices. See [apps/README.md](apps/README.md).

**Physical device note:** To reach FastAPI from a phone, use the development computer's LAN IP rather than 127.0.0.1 and ensure the phone and computer share a reachable network. No production API URL is configured yet.

## Scope

- **P0:** account/trip management, multi-photo import, metadata extraction, duplicate detection, indexing, incomplete-metadata review, event editing, timeline/map, processing status.
- **P1:** grounded AI journaling, journal editing, sharing and privacy controls.
- **Out of scope:** continuous GPS tracking, social feed, video analytics, booking, mandatory semantic search.

See [scope](docs/scope.md), [use cases](docs/use-cases.md), and [architecture](docs/architecture.md).

## Team workflow

- Default branch: **main**, for reviewed changes only.
- Work on **feature/***, **fix/*** or **docs/*** branches and open Pull Requests.
- Prefer small PRs with tests and a reproducible description.
- Track development in Issues. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Data privacy

Repository is **public**. Never commit credentials, service-role keys, .env files, private vacation photos, EXIF/GPS traces, or real user datasets. Use approved synthetic/consented test data and document any published dataset.

## License

No open-source license has been selected. Source visibility does not imply permission for third-party reuse.
