# SyncDoc Server

Backend API for collaborative document syncing.

## Run

Install dependencies:

```bash
cd server
npm install
```

Start development server:

```bash
npm run dev
```

Production start:

```bash
npm start
```

## Structure

```
server/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── websocket/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── .env
├── package.json
└── README.md
```
