# Frontend architecture

The frontend is now API-first. Repository data is not seeded in the React bundle.

## Data flow

`Express API -> repository hook -> React state/cache -> tree + General Details`

`POST/PATCH/DELETE -> Express API -> cache/state update`

## Repository hook

`src/hooks.js` owns fetching, request de-duplication, detail caching and persistence queues. It intentionally keeps fetched records in memory when the selected route changes.

## API client

`src/api.js` contains all HTTP paths. Components do not construct API URLs directly.

## Tree

The tree keeps the previous hover-only company interaction. Companies are loaded by `division + incorporation year`; sub-details appear only in the company hover popup.

## Details

General Details resolves the selected node and renders the corresponding component. Sub-detail components call the repository update/upload/delete callbacks rather than maintaining independent persistence logic.

## Files

Persisted files are metadata objects (`id`, `name`, `url`, `mimeType`, `size`). Browser `File` objects are only used during the upload request. PDF preview uses the file URL in the existing PDF workspace.

## Backend boundary

No Express backend is included in this repository yet. See `API_CONTRACT.md` for the endpoint contract and intended `storage/<division>/<year>/<company>/<detail>` organization.
