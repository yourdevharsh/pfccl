# PFCCL Subsidiaries API

Node.js + Express backend for the frontend in this archive. Data is persisted locally under `server/storage/` by default.

## Layout

```text
server/
├── app.js
├── config.js
├── constants.js
├── routes/
├── services/
├── utils/
├── scripts/seed.js
├── src/server.js
├── package.json
├── .env.example
└── storage/
    ├── repository.json
    ├── umpp/
    │   └── <year>/<company-id>/
    └── itp/
        └── <year>/<company-id>/
```

Each company folder contains `company.json` plus one directory per detail module. Uploaded files live inside the corresponding detail directory.

## Run

From `server/`:

```bash
npm install
npm run seed
npm run dev
```

Production-style start:

```bash
npm start
```

The API listens on `http://localhost:3000` by default.

## Environment

Copy `.env.example` to `.env` and adjust values as required.

`PUBLIC_BASE_URL` matters when the React frontend and API are on different origins. It causes persisted file metadata to use URLs such as `http://localhost:3000/files/...` instead of `/files/...`.

## Storage behavior

- Company IDs are server-generated with `company-<uuid>`.
- Company folders are moved automatically when an incorporation date changes year.
- Uploaded file metadata is stored in `company.json`; binary files are stored on disk.
- The original filename is kept in metadata for the frontend, while the physical filename is prefixed with a generated file ID to avoid collisions.
- No database is used.
