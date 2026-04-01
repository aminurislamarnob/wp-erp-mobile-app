# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Expo React Native mobile app for WP-ERP (WordPress ERP plugin). Provides an employee self-service portal: dashboard with live clock-in/out, leave management, attendance, announcements, profile (info, experience, education, dependents), and team directory.

Connects to a WordPress site running WP-ERP via its REST API (`/wp-json/erp/v1/hrm/...`). Authentication uses a custom `erp-mobile/v1/login` endpoint that returns a persistent Bearer token.

## Development Commands

```bash
npx expo start          # Start dev server (Expo Go or dev client)
npx expo run:android    # Build and run on Android
npx expo run:ios        # Build and run on iOS
npx expo start --web    # Start web version
```

EAS builds (requires `eas-cli`):
```bash
eas build --profile development --platform android   # Dev client build
eas build --profile preview --platform android        # Preview APK
eas build --profile production --platform android     # Production build
```

No test runner or linter is configured.

## Architecture

**Entry:** `App.tsx` wraps the app in `AuthProvider` → `ToastProvider` → `AppNavigator`.

**Navigation** (`src/navigation/AppNavigator.tsx`):
- Unauthenticated: shows `LoginScreen`
- Authenticated: bottom tab navigator with Dashboard, Leave (stack), Attendance (conditional on module), Profile (stack)
- Announcements list + detail screens live on the RootStack (accessible from dashboard quick action or any screen)
- Attendance tab only appears when the `attendance` module is active on the WP-ERP site
- All native navigation headers are hidden; every screen renders `<AppHeader />` (`src/components/AppHeader.tsx`) — a shared purple header with avatar, name, designation, and logout button
- Profile tabs: Info, Experience, Education, Dependents

**Auth flow** (`src/contexts/AuthContext.tsx`):
- Login: validate site URL → POST to `erp-mobile/v1/login` → verify employee role → fetch employee profile + active modules
- Credentials (including username/password for auto-refresh) stored in `expo-secure-store`
- Session restore: re-authenticates on app launch, auto-logout on 401 via Axios interceptor
- `useAuth()` hook exposes auth state, `login`, `logout`, `connectSite`, `isModuleActive`

**API layer** (`src/api/`):
- `client.ts` — Axios instance factory with Bearer token auth, credential storage via SecureStore, pagination helper
- `auth.ts` — Site validation, login, employee fetch, module fetch
- `endpoints.ts` — All HRM/accounting API calls. Some endpoints use native `fetch` instead of Axios (file uploads, and `clockInOut` where the WP backend uses `wp_send_json_success/die()`)
- API base: `{siteUrl}/wp-json`, namespace `erp/v1/hrm/` for HRM, `erp/v1/accounting/v1/` for accounting, `erp_pro/v1/admin/` for modules

**Types** (`src/types/index.ts`): All TypeScript interfaces for API models. Leave status is numeric (not string).

**Theme** (`src/constants/theme.ts`): Shared `colors`, `spacing`, `fontSize` constants.

## Key Patterns

- Screens are organized by domain: `src/screens/{domain}/{Screen}.tsx`
- Dates may come as Unix timestamps or ISO strings — normalized via helpers like `parseLeaveDate()` in endpoints and `parseDateValue()` in ProfileScreen
- File uploads (leave documents, profile photo) use native `fetch` with `FormData` rather than Axios
- Pagination uses WP-style `X-WP-Total` / `X-WP-TotalPages` headers
- Module-gated features: check `isModuleActive(moduleId)` from AuthContext before rendering
- Announcements use employee-scoped endpoint (`/erp/v1/hrm/employees/{userId}/announcements`) — the main `/hrm/announcements` requires admin capability. Response returns raw WP post fields (`post_title`, `post_content`, `post_date`) normalized via `normalizeAnnouncement()`
- Dashboard clock card shows live ticking time, shift info, check-in status, working elapsed timer, and check-in/out button
- Profile `InfoRow` supports `noCapitalize` prop — used for fields like email, country, state, nationality that should not be title-cased
- WP-ERP API field names sometimes differ from display names (e.g., `hiring_source` for "Source of Hire")
- Bundle ID: `com.welabs.wperpmobile` (both iOS and Android)
