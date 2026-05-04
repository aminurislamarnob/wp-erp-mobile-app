## Why

Employees currently have no way to capture personal notes inside the app — quick reminders, meeting follow-ups, and personal task lists live in third-party tools and lose context relative to their HR/work data. The WP-ERP App Helper plugin now exposes a full Notes & Labels REST API (`erp-app/v1`), so the mobile app can offer a first-class personal notes experience without backend work. Surfacing pinned notes and a fast "add note" path on the dashboard turns the app into a daily-use tool rather than only an HR self-service portal.

## What Changes

- Add a dedicated **My Notes** screen (list with search, label filter, pinned/archived toggles, pagination).
- Add a **Note Detail** screen for read/edit (title, rich-text content, labels, attachments, pin/archive/delete actions).
- Add a **Note Editor** screen (create new note, attach labels, attach media via WP `wp/v2/media` upload).
- Add a **Label management** flow (list/create/edit/delete labels, used inline from the editor and filter screens).
- Dashboard additions:
  - Collapsible **Pinned Notes** card (mirrors existing `CollapsibleSection` pattern used for Birthdays / Who is out / Holidays).
  - "Add Note" entry in the **Quick Actions** row.
  - Bottom-right floating action button (FAB) with note icon for one-tap navigation to My Notes.
- API client extensions in `src/api/endpoints.ts` for the new `erp-app/v1/notes`, `erp-app/v1/labels`, and `wp/v2/media` endpoints, including pagination via `X-WP-Total*` headers.
- New TypeScript types in `src/types/index.ts` for `Note`, `Label`, `NoteAttachment`, list filters, and pagination metadata.
- Navigation wiring in `AppNavigator.tsx`: a new `NotesStack` accessible from the dashboard FAB, quick action, pinned card, and from the More tab.

No breaking changes; this is additive.

## Capabilities

### New Capabilities

- `personal-notes`: CRUD for personal notes with title, HTML content, labels, attachments, pinning, archiving, search, and date/label filtering — backed by `erp-app/v1/notes`.
- `note-labels`: User-managed labels (name, color, description) used to categorize notes — backed by `erp-app/v1/labels`.
- `dashboard-notes-surface`: Dashboard integrations (pinned-notes collapsible card, quick action, FAB) that bring notes into the daily landing screen.

### Modified Capabilities

(none — no existing OpenSpec specs in this repo)

## Impact

- **Code**:
  - New screens under `src/screens/notes/` (`NotesScreen`, `NoteDetailScreen`, `NoteEditorScreen`, `NoteFilterScreen`, `LabelManagerScreen`).
  - New API module `src/api/notes.ts` (or extension of `endpoints.ts`).
  - New types in `src/types/index.ts`.
  - New `PinnedNotesCard` component reused on the dashboard.
  - `AppNavigator.tsx`: register `NotesStack` on the root, deep-link from dashboard.
  - `DashboardScreen.tsx`: add quick action, pinned-notes section, and FAB overlay.
- **APIs**: consumes `erp-app/v1/notes`, `erp-app/v1/notes/{id}/(pin|unpin|archive|unarchive)`, `erp-app/v1/labels`, `wp/v2/media`. Bearer token via existing axios client.
- **Dependencies**: likely needs a lightweight rich-text or HTML renderer for note content — evaluate `react-native-render-html` (already a candidate for announcements) vs. plain text fallback. Also requires a document/image picker for attachments (`expo-image-picker` and/or `expo-document-picker`).
- **Module gating**: notes is a core App Helper feature; gate behind a module check only if the backend exposes a flag. Otherwise always available for authenticated employees.
- **No DB / no native code changes.** Existing auth flow and `siteUrl + /wp-json` base apply.
