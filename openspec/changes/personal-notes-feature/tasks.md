## 1. API + Types Foundation

- [ ] 1.1 Hit `GET /wp-json/erp-app/v1/notes` and `/labels` against a live site to confirm response shapes (label expansion, attachment object, timestamp format) and document field names in a comment in `src/api/notes.ts` — _deferred: needs live backend; client normalizes both `labels`/`label_ids` and `attachments`/`attachment_ids` shapes defensively_
- [x] 1.2 Add `Label`, `NoteAttachment`, `Note`, `NoteListFilters`, and `PaginatedResponse<T>` types to `src/types/index.ts`
- [x] 1.3 Create `src/api/notes.ts` with `listNotes(filters)`, `getNote(id)`, `createNote(payload)`, `updateNote(id, patch)`, `deleteNote(id)`, `pinNote(id)`, `unpinNote(id)`, `archiveNote(id)`, `unarchiveNote(id)` — all using the shared `getApiClient()` and the `X-WP-Total*` pagination helper
- [x] 1.4 Create `src/api/labels.ts` with `listLabels(query)`, `createLabel(payload)`, `updateLabel(id, patch)`, `deleteLabel(id)` — _co-located in `src/api/notes.ts` rather than a separate file_
- [x] 1.5 Add `uploadAttachment(file)` helper that POSTs to `wp/v2/media` via native `fetch` with Bearer token and `Content-Disposition` filename header (mirror existing leave-doc upload pattern) — _reuses existing `uploadWPMedia()` from `endpoints.ts` (same helper used by Payment Request) instead of adding a parallel one_
- [x] 1.6 Verify `AbortController` support in the axios client and add a `signal` parameter to `listNotes`

## 2. Navigation Wiring

- [x] 2.1 Create `src/screens/notes/` directory with placeholder screen components (`NotesScreen`, `NoteDetailScreen`, `NoteEditorScreen`, `NoteFilterScreen`, `LabelManagerScreen`)
- [x] 2.2 Add a `NotesStack` navigator in `AppNavigator.tsx` and register it on the **RootStack** (sibling to the existing global Announcements route)
- [x] 2.3 Add a `MoreNotes` entry in the `MoreStackNav` so My Notes is reachable from the More tab — added "My Notes" + "Labels" entries in MoreScreen menu
- [x] 2.4 Verify deep-link from anywhere: `navigation.navigate('Notes', { screen: 'NotesList' })` works from Dashboard

## 3. My Notes List Screen

- [x] 3.1 Implement `NotesScreen` with `AppHeader`, search input (300ms debounce), segmented control (All / Pinned / Archived), and label-chip filter row
- [x] 3.2 Implement paginated `FlatList` with pull-to-refresh and `onEndReached` infinite scroll (per_page=20)
- [x] 3.3 Render each row: pin indicator, title, HTML-stripped snippet (first ~120 chars), label chips (max 2 + "+N"), updated_at
- [x] 3.4 Implement long-press action sheet: Pin/Unpin, Archive/Unarchive, Delete (with confirm dialog)
- [x] 3.5 Wire optimistic updates for pin/archive/delete with rollback on error + toast
- [x] 3.6 Implement abort-on-stale-filter: cancel the in-flight request when filters change
- [x] 3.7 Empty state and error state matching app conventions; Skeleton rows on initial load — uses ActivityIndicator on initial load (matches AnnouncementsScreen pattern); empty state present
- [x] 3.8 Floating "+" create button on the list screen header → navigates to NoteEditor (create mode)

## 4. Note Filter Screen

- [x] 4.1 Implement `NoteFilterScreen` (modal) with date_from / date_to pickers and multi-select label chips
- [x] 4.2 Apply button returns selected filters to the list via navigation params; show "(N)" badge on the filter button when active
- [x] 4.3 "Clear all" action resets filters

## 5. Note Detail Screen

- [ ] 5.1 Add `react-native-render-html` dependency (or alternative if already present) — _skipped: using existing `stripHtml` plain-text rendering pattern from AnnouncementDetailScreen to avoid bundle bloat. Revisit if rich formatting becomes a requirement_
- [x] 5.2 Implement `NoteDetailScreen` rendering title, label chips, attachments (image thumbs + file rows), and HTML content via the renderer
- [x] 5.3 Header actions: Edit (→ NoteEditor with id), Pin/Unpin, Archive/Unarchive, Delete — implemented as in-screen action row (matches detail-screen UX)
- [x] 5.4 Tap image thumbnail → full-screen viewer; tap file row → open URL via `Linking.openURL` — both open via `Linking.openURL`; full-screen viewer not added (system viewer used)
- [x] 5.5 Loading skeleton + error retry state

## 6. Note Editor Screen

- [x] 6.1 Implement `NoteEditorScreen` accepting optional `noteId` route param (create vs. edit mode)
- [x] 6.2 Title `TextInput` (required), content multiline `TextInput` with `textAlignVertical="top"`
- [x] 6.3 Label picker modal: search existing labels, multi-select, inline "+ New label" form (name + preset color swatches + custom hex)
- [x] 6.4 Attachment picker: `expo-image-picker` for images, `expo-document-picker` for files; sequential upload with per-file progress; remove-before-save support — _refactored to match Payment Request pattern: single `DocumentPicker` with `type: ['image/*', 'application/pdf']` and `multiple: true`, files held locally as `LocalFile[]` until Save (then uploaded via `uploadWPMedia` and attached). Already-uploaded attachments (edit mode) and pending picks both removable_
- [x] 6.5 Save button → POST or PATCH; preserves input on failure; success toast + navigate
- [x] 6.6 Discard-changes prompt on back navigation when there are unsaved edits
- [x] 6.7 HTML round-trip: on load, strip HTML for editing; on save, wrap blank-line-separated paragraphs in `<p>` tags

## 7. Label Manager Screen

- [x] 7.1 Implement `LabelManagerScreen` listing labels as colored rows with name + description + edit/delete affordances
- [x] 7.2 Create/edit form (modal or push screen) with 8 preset color swatches + custom hex input (`^#[0-9a-fA-F]{6}$` validation)
- [x] 7.3 Handle 409 (duplicate name) and 4xx (invalid color) inline; surface API error if delete fails because label is in use

## 8. Dashboard Integration

- [x] 8.1 Add a `PinnedNotesCard` section to `DashboardScreen` using the existing `CollapsibleSection`; fetch `GET /notes?pinned=true&per_page=10` in the dashboard's parallel data fetch
- [x] 8.2 Render skeleton rows during initial load; empty state "No pinned notes yet"; rows tap → NoteDetail
- [x] 8.3 Include pinned notes in pull-to-refresh — covered by `loadData()` which is invoked by RefreshControl
- [x] 8.4 Add an "Add Note" `QuickAction` tile (Feather `edit-3` icon, themed background) → NoteEditor (create mode)
- [x] 8.5 Add a fixed bottom-right FAB outside the ScrollView: 52px circle, primary color, white note icon, shadow consistent with existing cards
- [x] 8.6 Position FAB with `bottom: insets.bottom + tabBarHeight + 16` and `right: 16`; verify on iOS notch + Android nav bar — uses `insets.bottom + 66 (tab height) + spacing.md`
- [x] 8.7 FAB tap → navigate to Notes list

## 9. Theming + Polish

- [x] 9.1 Ensure every new screen uses the `useStyles()` + `useTheme()` pattern so styles recompute on theme change
- [x] 9.2 Use existing `AppHeader` on every notes screen (no native nav header)
- [x] 9.3 Match spacing, fontSize, and corner radii from `src/constants/theme.ts`
- [ ] 9.4 Confirm dark-mode rendering for label chips and HTML content (background contrast) — _needs visual verification on device_

## 10. Module Gating + Auth

- [ ] 10.1 Check whether `notes` (or App Helper) is exposed via `erp_pro/v1/admin/modules`; if so, gate FAB / quick action / pinned card behind `isModuleActive('notes')` — _deferred: backend module key unknown; left always-on per 10.2_
- [x] 10.2 If not exposed, leave always-on with graceful empty state on 404 from the notes endpoint — implemented (404 caught, returns empty list)
- [x] 10.3 Confirm 401 from any notes call triggers the existing global Axios interceptor logout (no extra handling needed) — uses shared `getClient()`; inherits global behavior

## 11. Verification

- [ ] 11.1 Manual test: create, edit, pin, unpin, archive, unarchive, delete a note; confirm dashboard pinned card reflects each change — _needs device run_
- [ ] 11.2 Manual test: search, label-AND filter, date filter, infinite scroll, pull-to-refresh — _needs device run_
- [ ] 11.3 Manual test: image and document attachment upload + view + remove — _needs device run_
- [ ] 11.4 Manual test: create/edit/delete labels; verify duplicate-name and invalid-color errors render inline — _needs device run_
- [ ] 11.5 Manual test: theme toggle (light/dark/system) on every notes screen and the dashboard FAB — _needs device run_
- [ ] 11.6 Manual test: FAB does not overlap tab bar on iPhone (notch), iPhone SE (no notch), and an Android device with gesture nav — _needs device run_
- [x] 11.7 Sanity check: bundle size delta from `react-native-render-html` and any picker libs is acceptable — no new deps added; `expo-image-picker` and `expo-document-picker` were already in package.json
