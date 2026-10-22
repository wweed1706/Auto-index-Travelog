# ReTrip — Scope v1.0

**Project:** Graduation thesis, two students, Mobile-first.

## Problem statement

Given a collection of photos from a past trip, automatically reconstruct a reviewable sequence of travel events using image timestamps, GPS locations and image features, while handling incomplete metadata.

## P0 — Must have

1. Account registration/login and trip management.
2. Photo selection/import and reliable upload.
3. Original metadata extraction and normalization.
4. Exact and near-duplicate detection.
5. Auto-Indexing: time, GPS and visual features.
6. Missing metadata handling, confidence and Unassigned.
7. Event reconstruction and user verification.
8. Timeline and interactive map.
9. Merge, split, move photos, edit events; preserve manual corrections.
10. Background-processing status and retry.

## P1 — After P0 is stable

- AI journal drafts grounded in verified events and images.
- Journal editing.
- Read-only sharing and privacy controls.

## Out of scope

- Continuous GPS tracking or background library synchronization.
- Video processing, booking and social media feed.
- Full web admin application or mandatory semantic search.
- Claims to reconstruct exact travel routes from discrete GPS photo points.

## Acceptance principles

- Import and analyze an authorized trip photo collection.
- Uncertain photos remain Unassigned instead of forced false locations.
- Users can correct events and corrections survive re-indexing.
- Compare baseline and hybrid clustering with trip-level held-out data.
- App must be tested on a physical Android device; iOS support requires iOS testing evidence.

See [Use cases](use-cases.md) for UC-01–UC-22.
