# Mobile application (Expo)

The ReTrip mobile project is now present in [mobile](mobile/).

## Run on your development computer

~~~bash
cd apps/mobile
npm install
npx expo install --check
npm run typecheck
npm start
~~~

The project uses Expo SDK 57, React Native, TypeScript, Expo Router, a local photo picker/EXIF preview, and an optional FastAPI health check. Read the [mobile README](mobile/README.md) for LAN connectivity, privacy notes, and known limitations.

## Development focus

- Auth / Trip list and trip detail (not yet implemented)
- Photo selection preview (implemented); upload, storage and backend EXIF (next)
- Indexing job status and Unassigned review (not yet implemented)
- Timeline, map, event corrections (not yet implemented)
- AI journal (P1; not yet implemented)
