# ReTrip — Auto-index Travelog

**Intelligent Travel Memory Reconstruction System**  
Graduation project | 2 students | Mobile-first (React Native + Expo) | FastAPI + Python

ReTrip aims to reconstruct past travel experiences from photo collections: import photos, extract metadata, detect duplicates, group photos into travel events, handle missing metadata, and present a reviewable timeline and map. AI journal writing is a secondary feature.

> **Status:** Early prototype. The **Expo mobile app exists** (navigation, local multi-photo selection/metadata preview, optional FastAPI health check); the **FastAPI API exists** (health endpoint + tests). Authentication, upload/storage, Auto-Indexing, database, map and AI journal are **not implemented yet**.

## Repository layout

~~~text
apps/mobile/           React Native + Expo SDK 57 application
services/api/          FastAPI starter and tests
research/              Auto-Indexing experiment plan
docs/                  Scope, use cases, architecture
infra/                 Infrastructure notes
.github/workflows/     Backend CI and Mobile CI
~~~

## Start FastAPI

Requires Python 3.11+:

~~~bash
cd services/api
python -m venv .venv
# Activate the environment for your OS:
# Linux/macOS: source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
uvicorn app.main:app --reload
~~~

Open http://127.0.0.1:8000/docs or http://127.0.0.1:8000/health.

## Start ReTrip Mobile

Requires Node.js LTS and Expo Go (SDK 57) or a suitable emulator:

~~~bash
cd apps/mobile
npm install
npx expo install --check
npm run typecheck
npm start
~~~

See [mobile instructions](apps/mobile/README.md). Configure an optional LAN API URL in `apps/mobile/.env` (copied from `.env.example`) to check FastAPI connectivity from your device.

## Research focus

**Hybrid spatio-temporal event clustering under incomplete metadata.** Compare time-only, time+GPS, and hybrid (time+GPS+image embeddings) methods. Keep inferred information separate from confirmed facts and allow unassigned photos.

## Scope

- **P0:** account/trip management, multi-photo import, metadata extraction, duplicate detection, indexing, incomplete-metadata review, event editing, timeline/map, processing status.
- **P1:** grounded AI journaling, journal editing, sharing and privacy controls.
- **Out of scope:** continuous GPS tracking, social feed, video analytics, booking, mandatory semantic search.

See [scope](docs/scope.md), [use cases](docs/use-cases.md), and [architecture](docs/architecture.md).

## Team workflow

Use feature branches and Pull Requests; main is protected. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Data privacy

The repository is **public**. Never commit credentials, service-role keys, .env files, private vacation photos, EXIF/GPS traces, or real user datasets. Use approved synthetic/consented test data.

## License

No open-source license has been selected.
