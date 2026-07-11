# TRAKL

A local-first life tracker app built with Expo / React Native. Track habits, tasks, finances, sleep, workouts, mood, water intake, weight, meditation, goals, and custom trackers — all stored on-device with Zustand + AsyncStorage. Available in 20 languages with AdMob banner ads (with GDPR/UMP consent).

## Tech Stack

- **Framework**: Expo SDK 54, React Native 0.81
- **State**: Zustand with AsyncStorage persistence (encrypted via expo-secure-store for financial data)
- **Navigation**: Expo Router (file-based)
- **Styling**: Uniwind / TailwindCSS
- **i18n**: i18next (20 languages, RTL support)
- **Ads**: react-native-google-mobile-ads (AdMob banners with UMP consent + ATT)
- **Notifications**: expo-notifications (local scheduling)
- **CI**: GitHub Actions (Android Gradle release builds)

## Getting Started

```bash
# Install dependencies
npm ci

# Start the dev server
npx expo start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
app/          # Expo Router pages (tabs, tracker screens)
components/   # Reusable UI components
lib/          # Store, i18n, consent, secure storage, stats, types
hooks/        # Custom React hooks
assets/       # Images, fonts, onboarding assets
__tests__/    # Jest test files
```

## Key Files

- `lib/store.ts` — Zustand store with persistence, migrations, and all actions
- `lib/consent.ts` — GDPR/UMP consent via Google AdsConsent SDK
- `lib/secureStorage.ts` — Encrypted storage for financial transactions
- `lib/i18n.ts` — Internationalization with RTL layout direction
- `app.config.ts` — Expo config (versioning, AdMob, permissions)
- `.github/workflows/react-native-cicd.yml` — Android release CI/CD

## Privacy

All user data is stored locally on-device. Financial transactions are encrypted at rest using expo-secure-store. No data is sent to any server. AdMob ads require GDPR/UMP consent (handled via the official Google UMP SDK) and iOS ATT prompt.

## License

Private project. All rights reserved.
