# WPERP Mobile App

Employee self-service mobile app for [WP-ERP](https://wperp.com) — the open-source HR, CRM & Accounting solution for WordPress.

Built with **Expo** (React Native) and connects to any WordPress site running the WP-ERP plugin via its REST API.

## Features

- **Dashboard** — Live clock-in/out, quick actions, upcoming birthdays, who's out today, holidays, and interactive calendar
- **Leave Management** — View leave requests with status filters, leave balance with progress bars, holiday list, and submit new requests with file attachments
- **Attendance** — Clock in/out with shift details, attendance log calendar, and monthly report with summary statistics
- **Announcements** — Browse and read company announcements
- **Profile** — View personal info, contact details, job information, experience, education, and dependents. Upload profile photo
- **Team Directory** — Searchable employee directory with pagination
- **Standup** — Daily standup log with FAB-driven entry form
- **Payment Requests (Reimbursement)** — Submit, list, and view payment/reimbursement requests
- **More Menu** — Centralized hub for Standup, Payment Requests, Security, theme switcher, and other tools
- **Security** — Biometric login (fingerprint/face), change password, and session controls
- **Theming** — Light, dark, and system theme modes; switcher accessible from Profile and the More menu

## Recent Improvements (2.0.0 → 2.1.0)

- Biometric login with token persistence across sessions, surfaced as a full-width button below Log In
- Redesigned alert dialogs with centered modal, bounce animation, and dark-mode support
- Login flow streamlined: site URL hardcoded to `https://hr.welabs.dev`, Connect Site step skipped, Log In always shown first
- Updated branding — new logo, refreshed icons, splash screen background set to `#2D5BDB`, app icon now used on the post-splash loading screen
- Login button polish: "Log In" label, Feather arrow-right icon pinned to the right edge
- Dashboard topbar subtitle no longer shows department
- Attendance, leave requests, and dashboard feature updates
- Upgraded to Expo SDK 54 / React Native 0.81 with `expo-font` and `expo-system-ui`
- EAS local-build fix: `ANDROID_HOME` env wiring

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- A WordPress site with [WP-ERP](https://wordpress.org/plugins/erp/) installed and activated
- The **ERP Mobile Auth** companion plugin installed on the WordPress site (provides token-based authentication)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npx expo start
```

This opens the Expo developer tools. You can then:

- Scan the QR code with the **Expo Go** app on your phone
- Press `a` to open on an Android emulator
- Press `i` to open on an iOS simulator

### 3. Run on device/emulator (debug)

```bash
npx expo run:android    # Build debug and run on Android
npx expo run:ios        # Build debug and run on iOS
```

## Building the App

### Local Build

Build the app locally on your machine. Requires Android SDK / Xcode installed.

> **Note:** If the Android build fails with `SDK location not found`, create the `local.properties` file:
>
> ```bash
> echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
> ```
>
> This file is not committed to git since the `android/` directory is generated. You may need to recreate it after running `npx expo prebuild` or cloning the repo fresh.

**Debug build:**

```bash
npx expo run:android                        # Android debug
npx expo run:ios                            # iOS debug
```

**Release build:**

```bash
npx expo run:android --variant release      # Android release APK
npx expo run:ios --configuration Release    # iOS release build
```

The release APK will be generated at `android/app/build/outputs/apk/release/app-release.apk`.

**Reducing APK size for local testing:**

The default release APK is ~66MB because it includes native libraries for all 4 CPU architectures (arm64-v8a, armeabi-v7a, x86, x86_64). You can limit to a single architecture to significantly reduce the build size:

```bash
# For real devices (arm64 — all modern Android phones from ~2015+)
cd android && ./gradlew app:assembleRelease -x lint -x test -PreactNativeArchitectures=arm64-v8a

# For emulators (x86_64)
cd android && ./gradlew app:assembleRelease -x lint -x test -PreactNativeArchitectures=x86_64
```

The APK will be at `android/app/build/outputs/apk/release/app-release.apk`.

> **Note:** For Play Store submission, always use AAB (Android App Bundle) via EAS Build — Google Play automatically splits the bundle per device architecture, so users only download what their device needs (~15-20MB).

### EAS Build (Cloud)

Build on Expo's cloud servers using [EAS Build](https://docs.expo.dev/build/introduction/). Install the EAS CLI first:

```bash
npm install -g eas-cli
```

**Build profiles:**

| Profile       | Description                         | Command                                                        |
| ------------- | ----------------------------------- | -------------------------------------------------------------- |
| `development` | Development client with dev tools   | `eas build --profile development --platform android`           |
| `preview`     | Internal distribution APK           | `eas build --profile preview --platform android`               |
| `production`  | Production release                  | `eas build --profile production --platform android`            |
| `production`  | Production release (arm64-v8a only) | `eas build --profile production-arm64 --platform android`      |
| `update`      | Update                              | `eas update --auto` version change will not work update update |

Replace `android` with `ios` for iOS builds.

## Project Structure

```
src/
  api/
    auth.ts          # Site validation, login, employee & module fetch
    client.ts        # Axios client factory, credential storage, pagination
    endpoints.ts     # All HRM/accounting API endpoint functions
  components/
    AppHeader.tsx    # Shared app header (avatar, name, logout)
    Toast.tsx        # Toast notification provider
  constants/
    theme.ts         # Colors, spacing, font sizes
  contexts/
    AuthContext.tsx   # Authentication state & session management
  navigation/
    AppNavigator.tsx  # Tab & stack navigation setup
  screens/
    announcements/   # Announcement list & detail
    attendance/      # Clock, log, report tabs
    auth/            # Login screen
    dashboard/       # Home screen with clock card, quick actions, calendar
    leave/           # Leave requests, balance, new request, detail
    profile/         # Profile info, team directory
  types/
    index.ts         # TypeScript interfaces for all API models
```

## Backend Requirements

The app requires two WordPress plugins on the server:

1. **WP-ERP** — Provides the HR management REST API (`/wp-json/erp/v1/hrm/...`)
2. **ERP Mobile Auth** — Provides token-based authentication (`/wp-json/erp-mobile/v1/login`) so the app can authenticate without cookies

ERP Mobile Auth repository: [wp-erp-mobile-helper](https://github.com/aminurislamarnob/wp-erp-mobile-helper)

### Authentication Flow

1. User enters their WordPress site URL, username, and password
2. App validates the site has WP-ERP installed via the REST API
3. App authenticates via `POST /wp-json/erp-mobile/v1/login` and receives a Bearer token
4. All subsequent API requests include the token in the `Authorization` header
5. Credentials are stored securely on-device via `expo-secure-store` for session restore

## Tech Stack

- **Expo SDK 54** with React Native 0.81
- **React 19** with TypeScript (strict mode)
- **React Navigation** — Bottom tabs + native stack navigators
- **Axios** — HTTP client for API calls
- **Expo Secure Store** — Encrypted credential storage
- **Expo Image Picker** — Profile photo upload
- **Expo Document Picker** — Leave request attachments

## License

Proprietary - weLabs
