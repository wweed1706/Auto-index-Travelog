# ReTrip Mobile — Expo SDK 57

This is a **real React Native + Expo Router application scaffold**, with three navigable screens, a multi-image picker, a local metadata preview, and an optional FastAPI health check. It is **not** an implemented travel indexing app yet.

## Requirements

- Node.js LTS and npm
- Expo Go for SDK 57 on a physical Android/iOS device, or a suitable emulator
- A reachable network for the first dependency installation

Expo currently recommends SDK 57 for physical-device Expo Go during the SDK 58 transition. The manifest versions follow Expo's official SDK 57 default template. This app was assembled to match those versions; the development environment used to create the PR **could not run npm install or an emulator**, so dependency installation and device verification remain necessary.

## Install and run

From the repository root:

~~~bash
cd apps/mobile
npm install
npx expo install --check
npx tsc --noEmit
npx expo start
~~~

Scan the QR code in Expo Go or start an emulator from the Expo CLI.

## API health check (optional)

The home screen checks GET /health on the existing FastAPI server. It is **the only** mobile/backend integration in this version.

1. Start FastAPI from `services/api` according to its README.
2. Copy `.env.example` to `.env`.
3. Replace the placeholder IP with your computer's reachable LAN address, e.g. `EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8000`.
4. Run FastAPI bound to `0.0.0.0` for a local physical-phone test and ensure your firewall/LAN permits this connection.
5. Restart Expo after changing the .env value.

**Do not put passwords/API secrets in EXPO_PUBLIC_ variables.** They are included in client bundles. Restrict plain HTTP to trusted local development; production uses HTTPS.

The mobile app is still usable without API configuration.

## Current screens

- `src/app/index.tsx` — home + backend connection status.
- `src/app/import.tsx` — select many photos, preview up to 10 locally, and count EXIF/GPS presence. **No photo upload or server-side storage.**
- `src/app/about.tsx` — product scope and prototype limitations.

## Privacy and data correctness

- Selected photos stay on the device in the current prototype; no upload API calls.
- No raw coordinates, filenames or EXIF values are sent to analytics or logged.
- EXIF obtained through the platform photo picker can be missing or different from the original. This preview is **not** authoritative extraction.
- Media without GPS must not be assigned a fictitious location; this will be handled in the future Auto-Indexing backend.
- The picker is limited to images (no video analysis).

## Upcoming work

1. Verify picker behavior on target phones and metadata preservation, including HEIC.
2. Agree on Trip / MediaAsset API contracts and server-side authorization.
3. Implement uploads with reliable retries and ExifTool processing.
4. Implement time/GPS baseline clustering and the Unassigned workflow.
