## ADDED Requirements

### Requirement: Pinned-notes collapsible card on dashboard
The Dashboard SHALL render a `CollapsibleSection` titled "Pinned Notes" that lists the user's pinned notes (up to 10), using the same visual pattern as Birthdays / Who is out / Holidays.

#### Scenario: Pinned notes load
- **WHEN** the dashboard mounts for an authenticated user
- **THEN** the app issues `GET /notes?pinned=true&per_page=10` in parallel with the existing dashboard data fetches and renders rows with title, label chips (max 2 + overflow), and updated date

#### Scenario: Empty pinned state
- **WHEN** the user has no pinned notes
- **THEN** the section renders the empty state "No pinned notes yet" matching existing tone

#### Scenario: Tap pinned row
- **WHEN** the user taps a pinned note row
- **THEN** the app navigates to that note's detail screen on the Notes stack

#### Scenario: Loading skeleton
- **WHEN** the pinned-notes request is in-flight on initial load
- **THEN** the section renders Skeleton rows consistent with other dashboard sections

#### Scenario: Pull-to-refresh updates the section
- **WHEN** the user pulls to refresh the dashboard
- **THEN** pinned notes are refetched alongside the rest of the dashboard

### Requirement: "Add Note" quick action
The Dashboard Quick Actions row SHALL include an "Add Note" tile that opens the Note Editor in create mode.

#### Scenario: Tap Add Note quick action
- **WHEN** the user taps the "Add Note" tile
- **THEN** the app navigates to the Note Editor with no `noteId` (create mode)

#### Scenario: Visual consistency
- **WHEN** the quick action row renders
- **THEN** the "Add Note" tile uses a `Feather` icon and a tinted background consistent with the existing tiles (Leave, Attendance, News, Profile)

### Requirement: Floating action button
The Dashboard SHALL render a circular floating action button anchored to the bottom-right corner that navigates to the My Notes list.

#### Scenario: FAB position respects safe area and tab bar
- **WHEN** the dashboard renders on any device
- **THEN** the FAB is positioned at `right: 16, bottom: insets.bottom + tabBarHeight + 16` so it never overlaps the bottom tab bar or the home indicator

#### Scenario: FAB opens Notes
- **WHEN** the user taps the FAB
- **THEN** the app navigates to the My Notes list screen

#### Scenario: FAB styling
- **WHEN** the FAB renders
- **THEN** it uses the app's primary color, white note icon, ~52px diameter, and an elevation/shadow consistent with existing cards

#### Scenario: FAB does not scroll with content
- **WHEN** the user scrolls the dashboard
- **THEN** the FAB SHALL remain fixed in the viewport
