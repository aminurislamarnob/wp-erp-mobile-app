## Context

The WP-ERP App Helper plugin exposes a new `erp-app/v1` REST namespace for personal notes and labels (CRUD + pin/archive + filtering + export). Authentication uses the same Bearer token issued by `erp-mobile/v1/login` that the app already stores via `expo-secure-store`. Attachments are uploaded through WordPress core's `wp/v2/media` endpoint.

The mobile app is an Expo React Native app with:
- An Axios client (`src/api/client.ts`) that injects the Bearer token, handles 401 auto-logout, and exposes a pagination helper using `X-WP-Total` / `X-WP-TotalPages`.
- Domain-organized screens under `src/screens/<domain>/`.
- A theme-reactive `useStyles()` pattern, a shared `AppHeader`, and existing UI primitives on the dashboard: `QuickAction`, `CollapsibleSection`, `Skeleton`.
- `RootStack` for global flows (e.g., Announcements) plus tab navigators for Dashboard, Leave, Attendance (gated), Profile, More.

This change is additive — it must fit cleanly into the existing patterns rather than introduce a parallel architecture.

## Goals / Non-Goals

**Goals:**
- Provide CRUD + pin/archive + search/filter for personal notes, fully consistent with existing app UI (purple primary, theme-reactive, AppHeader, no native nav headers).
- Make notes one-tap reachable from the dashboard via three surfaces: collapsible pinned card, quick action, and bottom-right FAB.
- Reuse existing components (`CollapsibleSection`, `QuickAction`, `Skeleton`, `AppHeader`) so the feature feels native to the app.
- Support label management inline so users never have to leave the editor to create a label.
- Honor the same offline/error/toast/loading conventions used elsewhere (e.g., leave, announcements).

**Non-Goals:**
- Full WYSIWYG rich-text editing. The API stores HTML in `content`, but v1 ships a plain-text editor that round-trips HTML safely (see Decisions).
- Notes export from the app (the API has `/notes/export` but UI export is deferred).
- Sharing or collaborative notes — the API is per-user/personal.
- Offline-first / local-cache CRUD. v1 is online-only with optimistic UI for pin/archive.
- Biometric-token specific flows (the existing login already covers auth).

## Decisions

### 1. New API module: `src/api/notes.ts`

`endpoints.ts` is already 633 lines covering HRM. Notes is a separate namespace (`erp-app/v1`) and a new domain, so create `src/api/notes.ts` and `src/api/labels.ts` (or one combined `notes.ts`) that build on the existing `getApiClient()` factory. **Alternative considered:** appending to `endpoints.ts` — rejected to keep file size manageable and domain boundaries clear.

### 2. Plain-text editor with HTML round-trip (v1)

API content is HTML (`<p>...</p>`). For v1 the editor uses a `TextInput` (multiline, `textAlignVertical="top"`). On save we wrap user input in `<p>` blocks (split on blank lines); on read we strip HTML for editing and render via `react-native-render-html` for display. **Alternative considered:** a full rich-text editor (e.g., `@10play/tentap-editor`, `react-native-pell-rich-editor`) — deferred to keep bundle size small and ship faster. The renderer dependency is small and is also useful for announcements.

### 3. Dashboard FAB implementation

Render the FAB as an absolutely-positioned `Pressable` inside `DashboardScreen`'s root `View` (NOT in the `ScrollView` content) so it stays fixed. Position `bottom: insets.bottom + 16, right: 16`. Use the app's primary purple with white note icon (`Feather "edit-3"` or `"file-text"`). On press it navigates to the Notes stack (root: My Notes screen). **Alternative considered:** using `react-native-paper`'s FAB — rejected to avoid introducing a UI library for one component.

### 4. Pinned-notes collapsible card

Reuse the existing `CollapsibleSection` component on the dashboard. Fetches `GET /notes?pinned=true&per_page=10`. Each row shows title, label chips (max 2, "+N" overflow), and updated date. Empty state mirrors "Everyone is in today" tone ("No pinned notes yet"). Loading state uses the same `Skeleton` rows used by Birthdays/Holidays.

### 5. Notes stack on RootStack

Register a `NotesStack` on the **RootStack** (sibling to `AnnouncementsStack` pattern), not inside MainTabs, so the FAB / quick action can deep-link from anywhere without breaking back-stack semantics. Stack screens:
- `NotesList` (the My Notes screen)
- `NoteDetail`
- `NoteEditor` (create + edit; takes optional `noteId` param)
- `NoteFilter` (modal-style screen for label + date filter)
- `LabelManager` (list/create/edit labels)

Also add a "My Notes" entry to the **More** stack for discoverability parity with other features (Standup, Reimbursement).

### 6. List screen UX

- Top: search input (debounced, 300ms) bound to `?search=`.
- Below search: horizontal scrollable label-chip filter row (multi-select; AND semantics matches API's repeated `?label=` param).
- Segmented control: **All / Pinned / Archived** mapped to `{}`, `?pinned=true`, `?archived=true`.
- Body: paginated FlatList (page size 20) with infinite scroll via `onEndReached`. Pull-to-refresh.
- Each row: pin indicator, title, content snippet (first ~120 chars stripped of HTML), label chips, updated_at.
- Long-press on a row → action sheet (Pin/Unpin, Archive/Unarchive, Delete).

### 7. Note Detail vs. Editor

Two screens to keep read mode lightweight (rendered HTML, no input focus stealing):
- **NoteDetail** is read-only: renders title, labels, attachments (image thumbnails + file links), HTML content; header has Edit/Pin/Archive/Delete icons.
- **NoteEditor** handles both create (no `noteId`) and edit (with `noteId`). Auto-save on blur/back is **NOT** done in v1 — explicit Save button to keep behavior predictable.

### 8. Attachment handling

Use `expo-image-picker` (already common) for images and `expo-document-picker` for arbitrary files. Upload via native `fetch` to `wp/v2/media` with `Authorization: Bearer ...` and `Content-Disposition: attachment; filename="..."` (mirrors how leave docs and profile photo uploads are done elsewhere in the app). Capture the returned `id` and add it to `attachment_ids` when saving the note. Show a progress spinner per attachment.

### 9. Label management

Inline label-picker modal on the editor screen with:
- Search existing labels.
- Inline "Create label" form (name + color swatch picker — 8 preset hex colors + custom).
- Tap to toggle selection (multi-select).

A dedicated `LabelManager` screen is reachable from the More tab and from the picker modal ("Manage labels"). Edit/Delete operations issue PATCH/DELETE; deleting a label that's in use should warn the user (the API enforces this — surface its 4xx response).

### 10. Types and pagination

Add to `src/types/index.ts`:
- `Label { id, name, color, description?, created_at, updated_at }`
- `NoteAttachment { id, url, filename, mime_type, size? }`
- `Note { id, title, content, labels: Label[], attachments: NoteAttachment[], pinned: boolean, archived: boolean, created_at, updated_at }`
- `NoteListFilters { search?, label_ids?, date_from?, date_to?, pinned?, archived?, page?, per_page? }`

Reuse the existing pagination helper in `client.ts` for `X-WP-Total*` headers. Match the actual API response field names by inspecting a live response (`label_ids` array vs. `labels` array of objects) — the postman bodies use `label_ids` for write but the read shape needs verification before coding.

### 11. Module gating

Personal notes is a per-user feature in App Helper, but check the modules endpoint for a `notes` (or App Helper plugin) flag at runtime before registering the FAB / quick action. If the flag is absent, fall back to **always-on** (the API will 404 if disabled and we'll show a graceful empty state). This avoids hiding the feature on sites where the module flag isn't surfaced.

## Risks / Trade-offs

- **Plain-text editor loses formatting** → Mitigation: store HTML round-trip; document the v2 plan for rich-text. Non-blocking for v1.
- **HTML rendering library bumps bundle size** → Mitigation: `react-native-render-html` is ~80KB; acceptable, and reusable for announcements later.
- **FAB overlapping bottom-tab bar** → Mitigation: position with `insets.bottom + 16 + tabBarHeight`; verify on iOS notch + Android nav bar.
- **Multi-label AND filter UX is non-obvious** → Mitigation: use a clear chip row with selected state; show active-filter count.
- **`label_ids` vs. `labels` shape unknown from postman alone** → Mitigation: hit a live endpoint during task 1 and confirm; gate type definitions on this.
- **Attachment upload flow is async with multiple files** → Mitigation: upload sequentially with per-item progress; collect IDs before PATCH/POST so the note save is a single atomic call.
- **FAB is a heavy CTA on a busy dashboard** → Mitigation: use a smaller-radius button (~52px), low-elevation shadow consistent with existing cards; user can collapse the pinned section if they want it quieter.
- **Search debounce + label filter combinatorics** → Mitigation: derive a single `params` object via `useMemo`, fire one request on change with `AbortController` to cancel stale ones.

## Migration Plan

- No data migration. Feature is purely additive.
- Rollout: ship behind no flag; the FAB and quick action are visible only when authenticated. If we later add a backend module flag, gate via `isModuleActive('notes')`.
- Rollback: revert the PR. No persistent client state beyond what the API stores server-side.

## Open Questions

- Confirm the exact response shape from `GET /notes` (labels expanded? attachment URLs included?) before finalizing types — to be answered in **Task 1**.
- Confirm whether the `notes` module appears in `erp_pro/v1/admin/modules` so we can `isModuleActive` it, or whether it's always-on for App Helper-installed sites.
- Decide whether to ship label deletion in v1 or defer (depends on backend behavior when a label is in use).
- Final FAB icon choice (`edit-3` vs. `file-text` vs. `book-open`) — defer to design review on the first build.
