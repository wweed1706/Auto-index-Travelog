# Mobile application (Expo)

The official Expo scaffold is generated as a dedicated app inside **apps/mobile**.

~~~bash
# Run from repository root
cd apps
npx create-expo-app@latest mobile
cd mobile
npx expo start
~~~

This intentionally uses Expo's generator rather than manually pinning mismatched versions of React Native, Expo, React and Expo Router.

## Suggested first screens

- Auth / Sign in
- Trip list and trip detail
- Photo picker and upload progress
- Indexing status and Unassigned review
- Timeline, map and event corrections
- Journal (P1)

## Connectivity

On a real phone, use your computer's reachable LAN IP for the development backend. Never place server-side secrets in EXPO_PUBLIC_* variables; these are exposed in client bundles.

## Before the first mobile PR

Check the selected Expo SDK against the Expo Go version on the target device, test selecting 100+ photos and verify original EXIF/GPS preservation on Android and (if available) iOS. The backend, not the client UI, remains the authoritative source for metadata extraction and indexing.
