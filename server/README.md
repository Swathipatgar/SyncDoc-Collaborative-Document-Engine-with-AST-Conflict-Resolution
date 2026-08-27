# SyncDoc backend

The SyncDoc backend is the single Express/Socket.IO server under `server/src`. It provides JWT authentication, document permissions, Yjs collaboration, presence, block editing, cursor synchronization, MongoDB persistence/recovery, checkpoints, and safe HTML export.

## Requirements and configuration

```bash
cd server
npm install
```

Configure `server/.env` (never commit this file):

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/syncdoc
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
```

The Vite frontend runs at `http://localhost:5173`; the backend runs at `http://localhost:5000`. HTTP and Socket.IO CORS use `CLIENT_URL`.

## Run and verify

```bash
npm run dev
npm start
npm test
```

Health check: `GET /api/health`.

## REST API

All protected routes require `Authorization: Bearer <JWT>`.

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/documents`
- `POST /api/documents`
- `GET /api/documents/:id`
- `PUT /api/documents/:id`
- `POST /api/documents/:id/share`
- `DELETE /api/documents/:id/collaborators/:collaboratorId`
- `GET /api/documents/:id/versions`
- `GET /api/documents/:id/export/html`
- `GET /api/documents/:id/export/pdf` (currently returns `501`)

Owners can read, write, manage collaborators, view versions, and export. Write collaborators can read, edit, collaborate, view versions, and export. Read collaborators can read, collaborate in read-only mode, view versions, and export. Unauthorized users receive `403` for an existing private document.

## Socket.IO collaboration events

Clients send `join-document`, `yjs-update`, `cursor-update`, `block-edit-start`, and `block-edit-end`.

The server emits `yjs-sync`, `yjs-update`, `presence-sync`, `presence-update`, `user-joined`, `user-left`, `cursor-sync`, `block-editing`, and `collaboration-error`.

Socket writes require an authenticated socket joined to the same document with write permission. Yjs updates are binary and room-isolated.

## Persistence and AST/export behavior

Yjs state is debounced before MongoDB persistence and is rehydrated on restart. Corrupt persisted Yjs state is logged safely and falls back to stored text without crashing the process. MongoDB connection failures do not stop collaboration; reconnect attempts continue in the background.

Structured content uses recursive JSON AST nodes such as `document`, `root`, `section`, `paragraph`, `text`, `heading`, `code`, `code-block`, `list`, `list-item`, `bold`, `italic`, and `link`. Validation rejects unknown/malformed nodes, unsafe URLs, invalid heading levels, excessive depth, and excessive node counts.

HTML export transforms the current Yjs text through AST parsing and validation. Text, titles, and code blocks are escaped; output tags and attributes are allowlisted, and only `http`, `https`, and `mailto` links are accepted. No DOMPurify dependency is required because untrusted input is never concatenated as markup.

REST JSON bodies are limited to 2 MiB. Document content and Yjs updates are limited to 1 MiB, cursors to 16 KiB, and block IDs to 256 characters. Built-in security headers are enabled.

## Known limitations

- There is no `socket.io-client` integration-test dependency.
- There is no `supertest` integration-test dependency.
- Tests do not use an isolated MongoDB database.
- Full live two-client Socket.IO, stop/restart recovery, and MongoDB outage simulations are not automated.
- PDF export intentionally returns `501` until a reviewed PDF library is added.
