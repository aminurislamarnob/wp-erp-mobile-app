## ADDED Requirements

### Requirement: Personal note CRUD
The app SHALL allow an authenticated employee to create, read, update, and delete their own personal notes via the `erp-app/v1/notes` API. Each note has a required `title`, optional HTML `content`, optional `label_ids`, and optional `attachment_ids`.

#### Scenario: Create a note with title and content
- **WHEN** the user opens the Note Editor, enters a non-empty title and content, and taps Save
- **THEN** the app POSTs to `/wp-json/erp-app/v1/notes` with `{ title, content }` and on `201` navigates to the new note's detail screen and shows a success toast

#### Scenario: Create note without a title is blocked client-side
- **WHEN** the user taps Save with an empty title
- **THEN** the app SHALL show an inline validation error and SHALL NOT issue the POST

#### Scenario: Edit an existing note
- **WHEN** the user opens an existing note, modifies fields, and taps Save
- **THEN** the app issues `PATCH /notes/{id}` with only the changed fields and updates the detail view on success

#### Scenario: Delete a note
- **WHEN** the user confirms delete from the action sheet
- **THEN** the app issues `DELETE /notes/{id}` and on success removes the note from the list and navigates back

### Requirement: Pin and archive
The app SHALL allow toggling pinned and archived state for a note independently. Pinned notes SHALL also appear on the dashboard pinned-notes card. Archived notes SHALL be hidden from the default list and shown only in the Archived view.

#### Scenario: Pin a note
- **WHEN** the user taps Pin on a note
- **THEN** the app POSTs to `/notes/{id}/pin` and on success updates the row indicator immediately (optimistic)

#### Scenario: Unpin a note
- **WHEN** the user taps Unpin on a pinned note
- **THEN** the app POSTs to `/notes/{id}/unpin` and removes the pin indicator on success

#### Scenario: Archive a note
- **WHEN** the user archives a note from the default list
- **THEN** the app POSTs to `/notes/{id}/archive`, removes the row from the list optimistically, and the note appears under the Archived segment on next fetch

#### Scenario: Unarchive a note
- **WHEN** the user unarchives a note from the Archived view
- **THEN** the app POSTs to `/notes/{id}/unarchive` and the note returns to the default list

### Requirement: Search and filter
The app SHALL support searching notes by free-text query and filtering by labels (AND semantics), date range (`date_from`, `date_to`), pinned, and archived state.

#### Scenario: Search by keyword
- **WHEN** the user types in the search box
- **THEN** after a 300ms debounce the app issues `GET /notes?search=<term>` and replaces the list with results

#### Scenario: Filter by multiple labels
- **WHEN** the user selects 2+ label chips
- **THEN** the app sends repeated `?label=<id>` query params and shows notes that have ALL selected labels

#### Scenario: Filter by date range
- **WHEN** the user picks a from/to date in the filter screen and applies
- **THEN** the app issues `GET /notes?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD` and any active filter count is shown on the filter button

#### Scenario: Active filters cancel stale requests
- **WHEN** the user changes filters faster than the network responds
- **THEN** the in-flight request SHALL be aborted and only the latest results applied to the list

### Requirement: Pagination
The list SHALL paginate using the WP-style `X-WP-Total` and `X-WP-TotalPages` response headers, default `per_page=20`.

#### Scenario: Infinite scroll loads next page
- **WHEN** the user scrolls near the end of the list and more pages are available
- **THEN** the app fetches the next page and appends results without scroll jumps

#### Scenario: Pull to refresh resets pagination
- **WHEN** the user pulls down to refresh
- **THEN** the app fetches `page=1` with the current filters and replaces the list

### Requirement: Attachments
The app SHALL support attaching images and documents to a note by uploading to `wp/v2/media` and saving the returned `id` in the note's `attachment_ids`.

#### Scenario: Add an image attachment
- **WHEN** the user picks an image in the editor
- **THEN** the app uploads the file via `POST /wp-json/wp/v2/media` with the Bearer token, shows per-file progress, and on success adds the returned id to the note's pending attachments

#### Scenario: Save note with attachments
- **WHEN** the user taps Save after adding attachments
- **THEN** the app issues a single POST/PATCH with `attachment_ids` containing all uploaded ids

#### Scenario: View attachments on the detail screen
- **WHEN** the note detail loads
- **THEN** image attachments render as thumbnails and non-image attachments render as tappable file rows that open the URL in the system viewer

### Requirement: Error and offline handling
The app SHALL surface API errors via the existing toast system and SHALL preserve unsaved editor input on network failure.

#### Scenario: 401 triggers logout
- **WHEN** any notes API call returns 401
- **THEN** the existing Axios interceptor logs the user out (no notes-specific behavior needed)

#### Scenario: 4xx/5xx shows a toast
- **WHEN** a notes API call returns an error
- **THEN** the app shows a toast with the server-provided message (or a default fallback) and keeps the user on the current screen

#### Scenario: Save retains input on failure
- **WHEN** Save fails due to network error
- **THEN** the editor SHALL remain populated with the user's input and the Save button SHALL re-enable
