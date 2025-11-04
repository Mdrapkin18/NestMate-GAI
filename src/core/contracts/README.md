# Data Contracts & Migration Plan

This directory contains JSON files that serve as the canonical "source of truth" for our core data models (e.g., `feed.v1.json`). These contracts are language-agnostic and are used to ensure consistency between the web client, the upcoming Flutter client, and any future backend services.

Each contract file includes:
- A human-readable `description`.
- A `version` number, following semantic versioning principles.
- A `payload` section detailing the expected fields and their types.
- `examples` of valid data structures.
- `invariants` or business rules that the data must adhere to.

## Migration Strategy

Our goal is to enable seamless, zero-downtime migrations for our users. We use a **lazy migration on read** approach.

1.  **Schema Versioning**: Every core document in Firestore (e.g., an `entry`, a `baby`) has a `schemaVersion` field.

2.  **Migration Code**: All migration logic is contained in `src/core/migrations`. Each new schema version gets its own file (e.g., `v2.ts`) which exports an `upgrade` function. This function takes a document object from an older version and returns a document object conforming to the new version.

3.  **The Runner**: The `runMigrations` function in `src/core/migrations/index.ts` is the entry point. When our `FirestoreDataProvider` reads a document from Firestore, it passes the raw data to this runner. The runner checks the document's `schemaVersion` against the application's `SCHEMA_VERSION` and applies all necessary `upgrade` functions in order until the document is up-to-date.

4.  **Idempotence**: All migration functions **must** be idempotent. This means they can be run on the same document multiple times without changing the result after the first successful run. This is critical for safety and is enforced by unit tests.

### Example Migration Flow (v1 to v2)

- A user with v1 data opens the new app.
- The `FirestoreDataProvider` fetches an `entry` document which has `schemaVersion: 1` (or is missing the field, which we treat as v1).
- The data is passed to `runMigrations`.
- The runner sees the document is on v1 and the app is on v2, so it calls the `upgrade` function from `migrations/v2.ts`.
- The `v2.ts` upgrade function adds the new `type` field and a `sessionId` for nursing entries, and sets `schemaVersion: 2`.
- The now-upgraded, v2-compliant data object is returned to the UI for rendering.
- When the user next saves this entry, the `FirestoreDataProvider` will write the fully-upgraded v2 object back to Firestore.

This approach ensures that the UI layer only ever deals with the latest data schema, and data is gradually and safely updated in the database over time as users interact with it.
