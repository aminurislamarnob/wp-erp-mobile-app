## ADDED Requirements

### Requirement: Label CRUD
The app SHALL allow an authenticated employee to list, create, edit, and delete personal labels via `erp-app/v1/labels`. A label has a required `name`, required hex `color` (`#RRGGBB`), and optional `description`.

#### Scenario: List labels
- **WHEN** the user opens the Label Manager screen
- **THEN** the app issues `GET /labels?per_page=50` and renders each label as a colored chip with name and description

#### Scenario: Create a label with valid color
- **WHEN** the user submits a new label form with name and a valid hex color
- **THEN** the app POSTs to `/labels` and on `201` adds the label to the list and to any open picker

#### Scenario: Duplicate name is rejected
- **WHEN** the API returns 409 for a duplicate label name
- **THEN** the app shows an inline error on the name field ("A label with this name already exists")

#### Scenario: Invalid color is rejected client-side
- **WHEN** the user enters a color that does not match `^#[0-9a-fA-F]{6}$`
- **THEN** the form blocks submission and shows an inline error

#### Scenario: Edit a label
- **WHEN** the user changes a label's name, color, or description and saves
- **THEN** the app issues `PATCH /labels/{id}` and updates the chip and any notes already showing that label

#### Scenario: Delete a label
- **WHEN** the user confirms delete on a label
- **THEN** the app issues `DELETE /labels/{id}` and on success removes it from the list and from local note caches

### Requirement: Inline label picker in the editor
The Note Editor SHALL include a label picker that lets the user assign multiple labels and create new ones without leaving the editor.

#### Scenario: Multi-select labels
- **WHEN** the user opens the label picker and taps multiple chips
- **THEN** all selected labels become part of the note's `label_ids` on save

#### Scenario: Create label inline
- **WHEN** the user taps "+ New label" in the picker, fills name and color, and confirms
- **THEN** the app creates the label, auto-selects it, and keeps the picker open for further selections

### Requirement: Color presets
The label create/edit form SHALL offer at least 8 preset color swatches plus a custom hex input. Selected swatch SHALL be visibly indicated.

#### Scenario: Pick a preset color
- **WHEN** the user taps a swatch
- **THEN** the swatch is marked selected and the color value populates the form
