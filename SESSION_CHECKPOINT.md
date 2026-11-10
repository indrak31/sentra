# SENTRA Session Checkpoint

Date: 2026-10-26

## 1. Completed Today

- Diagnosed the broken map: CARTO basemaps now require an API key, so tiles returned watermarked "API KEY REQUIRED" placeholders.
- Replaced CARTO raster tiles with the free OpenFreeMap dark vector basemap (`https://tiles.openfreemap.org/styles/dark`) using MapLibre GL with Leaflet.
- Preserved the existing Leaflet map, markers, popups, layer controls, legend, map controls, dark theme, and backend data integration.
- Changed the default map view to India, as required.
- Verified the fix in development and in a production build.

## 2. Files Modified

- `frontend/src/components/map/IndiaMap.tsx` - replaced CARTO `TileLayer` with OpenFreeMap/MapLibre basemap.
- `frontend/src/stores/mapStore.ts` - default view changed to India center/zoom.
- `frontend/package.json` - added `maplibre-gl` and `@maplibre/maplibre-gl-leaflet`.
- `frontend/package-lock.json` - matching dependency lockfile updates.

No backend files were modified. The frontend directory is untracked in git; no commit was created.

## 3. Current State

Frontend:
- React 18 + TypeScript + Vite 6 + Tailwind, running at `http://127.0.0.1:3000`.
- `npm run build` passes (`tsc -b && vite build`).
- Bundle-size warning remains: main chunk is about 1.2 MB (320 KB gzip), partly due to MapLibre.
- MapLibre is integrated through Leaflet; existing map behavior and UI are retained.

Backend:
- Unchanged and running at `http://127.0.0.1:8000`.
- Authentication and resource endpoints were verified during testing.
- The resources API caps `page_size` at 100.

## 4. Map Status

Working.

- Dark basemap renders without watermarks on the Dashboard and Live Map.
- Attribution shows `OpenFreeMap © OpenMapTiles Data from OpenStreetMap`.
- 56 markers render on the Dashboard; resource popups open with name, capacity, and district.
- Layer toggle verified: Emergency Fleet off/on changes markers 56 -> 0 -> 56.
- Wheel zoom, map dragging, India View, and Center Region work.
- No JavaScript exceptions or failed network requests during verification.

## 5. Remaining Issues / Unfinished Tasks

- Pre-existing issue: `frontend/src/features/map-view/LiveMapPage.tsx:25` requests `page_size: 150`, while the backend maximum is 100. This returns HTTP 422, so resource markers do not load on `/map`. Proposed one-line fix: change 150 to 100.
- Benign browser console warnings: React Router v7 future flags and missing OpenFreeMap sprite images (`circle-11`, `wood-pattern`).
- The Dashboard subtitle still says "centered on Pune" while the default map view is now India; decide whether to keep India or restore the Pune default.
- Production preview on port 4173 requires a CORS workaround because the backend currently allows the port 3000 origin.

## 6. Next Task

Redesign the Dashboard to match the first cinematic disaster-monitoring reference image. This work has not started.

Requirements for that task:
- Preserve all existing functionality, data hooks, backend integrations, map behavior, navigation, and RBAC.
- Do not use fake data or introduce regressions.
- Keep changes focused; avoid unrelated refactors.
- Validate responsiveness, map interactions, and API-backed content after the redesign.
