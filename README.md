# NestMate AI Baby Tracker

NestMate is a Vite-powered React app that helps families monitor day-to-day baby care while collaborating in real time. The experience combines fast activity logging, rich analytics, and an AI assistant that personalizes guidance with Gemini models.

## Table of contents
- [Features](#features)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment variables](#environment-variables)
  - [Run the app locally](#run-the-app-locally)
  - [Build & preview production assets](#build--preview-production-assets)
- [Key architecture](#key-architecture)
- [Troubleshooting tips](#troubleshooting-tips)

## Features
- **Comprehensive care logging** – Record feeds, sleep sessions, diapers, baths, and pumping directly from the home dashboard with timer support for ongoing activities.【F:components/HomeScreen.tsx†L1-L83】
- **Editable history** – Review, edit, undo, or resume entries from the history and detail screens to keep records accurate over time.【F:App.tsx†L20-L168】【F:components/HistoryScreen.tsx†L1-L120】
- **Charts & insights** – Switch to the stats view for rolling 7/30/90-day trends across feeding, sleep, pumping, and diaper data to surface routines at a glance.【F:components/StatsScreen.tsx†L1-L88】
- **Collaborative families** – Invite caregivers into a shared family space so everyone can log updates with a single baby profile.【F:App.tsx†L17-L93】【F:services/familyService.ts†L1-L120】
- **AI assistant** – Chat or speak with an AI helper that blends the baby’s recent context with Gemini text or live audio responses, including optional Google Search grounding.【F:components/AIAssistant.tsx†L1-L133】【F:services/geminiService.ts†L1-L74】
- **Realtime Firebase sync with offline caching** – Firestore adapters hydrate data, listen for changes, and enable persistence when network connectivity drops.【F:src/adapters/firestore/FirestoreDataProvider.ts†L1-L141】【F:services/firebase.ts†L1-L32】

## Project structure
```
.
├── App.tsx                  # Root navigation and screen orchestration
├── components/              # UI screens, charts, navigation, and reusable widgets
├── hooks/                   # Shared React hooks (auth, timers, theme)
├── services/                # Firebase, Gemini, and domain-specific service layers
├── src/                     # Core domain logic, adapters, and migrations
├── types.ts                 # Shared application types and Zod schemas
└── vite.config.ts           # Vite + React configuration and env mapping
```

## Getting started

### Prerequisites
- Node.js 18 or newer
- npm (included with Node.js)

### Installation
```bash
npm install
```

### Environment variables
Create a `.env.local` (or `.env`) file in the project root with the Gemini API key used for AI features:

```
GEMINI_API_KEY=your_google_ai_studio_key
```

Vite exposes this variable to both `process.env.API_KEY` and `process.env.GEMINI_API_KEY`, which are consumed by the Gemini service. If you fork the project, update `services/firebase.ts` with your own Firebase credentials before deploying.【F:vite.config.ts†L1-L22】【F:services/geminiService.ts†L1-L41】【F:services/firebase.ts†L1-L19】

### Run the app locally
```bash
npm run dev
```
The dev server runs on [http://localhost:3000](http://localhost:3000) and enables hot module reloading.

### Build & preview production assets
```bash
npm run build
npm run preview
```
`npm run preview` serves the generated static bundle locally so you can validate production behavior.

## Key architecture
- **React screens composed in `App.tsx`** – Handles auth state, selected baby, modal routing, and cross-screen state like timers and undo banners.【F:App.tsx†L1-L200】
- **Data providers** – `FirestoreDataProvider` implements the `DataProvider` port to read/write entries, babies, and profiles, and to stream realtime updates from Firestore.【F:src/adapters/firestore/FirestoreDataProvider.ts†L1-L141】
- **Services layer** – Firebase initialization, Gemini integrations, and family management live in `services/` to keep external APIs isolated from UI code.【F:services/firebase.ts†L1-L32】【F:services/geminiService.ts†L1-L74】【F:services/familyService.ts†L1-L120】
- **Domain types & validation** – Zod schemas in `types.ts` and `core/domain` ensure Firestore data is validated and migrated before use.【F:types.ts†L1-L120】【F:src/core/migrations/index.ts†L1-L80】

## Troubleshooting tips
- **AI assistant disabled?** Confirm the Gemini key is present and valid; the console will log an error if `process.env.API_KEY` is missing.【F:services/geminiService.ts†L1-L20】
- **Firestore query errors?** Some stats and history queries require Firestore composite indexes—follow any generated console links to create them.【F:components/StatsScreen.tsx†L1-L64】
- **Offline sync warnings?** Firestore persistence falls back automatically if multiple tabs are open or the browser lacks support.【F:services/firebase.ts†L1-L32】
