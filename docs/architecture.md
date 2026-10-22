# Architecture — preliminary

~~~text
React Native / Expo (mobile client)
      |
      | HTTPS / REST API
      v
FastAPI application
      +-- Auth / Trip / Media / Event services (planned)
      +-- Processing-job orchestration (planned)
      |      |
      |      v
      |  Auto-Indexing worker (planned)
      |      +-- EXIF and timestamp normalization
      |      +-- Duplicate detection
      |      +-- Image embeddings
      |      +-- Time/GPS/hybrid event clustering
      |      +-- Missing-metadata and Unassigned handling
      |
      +-- PostgreSQL + PostGIS (planned)
      +-- S3-compatible object storage (planned)
~~~

## Initial stage

Only **FastAPI + /health + tests + CI** are present. This diagram describes the intended architecture, not deployed services.

## Data-integrity rules

- Store extracted, inferred, and user-confirmed fields separately.
- Keep the original time string and timezone information if present.
- No GPS means **unknown**, never zero distance.
- Preserve user overrides across re-indexing runs.
- Do not present straight line connections as confirmed navigation routes.
- Treat trips as private by default.

## Architecture choices

- Mobile-first with Expo and Expo Router for the UI.
- API and research code in Python.
- PostGIS for future geospatial querying.
- Begin with a simple background worker; introduce Redis/Celery only if needed.
- Keep publishing/share pages optional and read-only.
