# Contributing to ReTrip

This graduation project is developed by a two-person team.

## Workflow

1. Pull the latest **main**.
2. Open or claim a GitHub Issue.
3. Create a short-lived branch: **feature/mobile-trip-list**, **feature/api-trip-service**, **research/time-baseline**, **fix/upload-retry**, or **docs/srs-update**.
4. Commit a coherent change and open a Pull Request targeting **main**.
5. Ask the other team member to review. Merge only after checks pass.

## Commit conventions

Use descriptive commits such as:
- feat(mobile): add trip list screen
- feat(api): add health endpoint
- research(indexing): implement time-only baseline
- test(api): validate health response
- docs(scope): clarify missing-GPS cases

## Pull Request checklist

- Scope and expected behavior are explained.
- Tests and screenshots are attached when appropriate.
- No private images, EXIF/GPS traces, secrets or tokens are committed.
- New API contracts or business rules are documented.
- Manual overrides are preserved for any indexing changes.

## Roles

- **Application stream:** Expo UI, navigation, upload integration, map/timeline, core application APIs.
- **Research stream:** EXIF/feature extraction, duplicate detection, clustering, uncertainty handling, evaluation.
- **Shared:** data models, API contract, integration, privacy/security, testing and documentation.

These are workstreams, not exclusive ownership of individual files.
