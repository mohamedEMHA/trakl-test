# TRAKL App — Testing Guide After Bug Fixes

## Quick Start

```bash
# Clear cache and start fresh
npx expo start -c

# Scan QR code with your phone
# App should load cleanly without freezing
```

---

## What to Test

### 1. **App Startup (CRITICAL)**
- [ ] App loads without freezing
- [ ] "Update or Download" prompt doesn't hang
- [ ] App responds to QR code scans immediately
- [ ] No white/blank screens lasting > 2 seconds

### 2. **First Launch (New User)**
- [ ] Splash screen shows (orange + logo)
- [ ] Onboarding flow appears
- [ ] Can complete onboarding
- [ ] App navigates to home screen

### 3. **Returning User**
- [ ] App loads directly to home screen
- [ ] All previous data is visible
- [ ] No data loss

### 4. **Finance Tracker**
- [ ] Can view transactions
- [ ] Can add new transaction
- [ ] Transactions persist after restart
- [ ] Transactions are encrypted (check secure storage)

### 5. **Other Trackers**
- [ ] Habits, tasks, goals, etc. all work
- [ ] Data persists across app restarts
- [ ] No console errors

### 6. **Settings & Profile**
- [ ] Can change language
- [ ] Can change avatar
- [ ] Settings persist

### 7. **Performance**
- [ ] App responds immediately to taps
- [ ] No lag when scrolling
- [ ] Animations are smooth

---

## Testing on Different Platforms

### Android
```bash
npx expo start -c
# Press 'a' to open Android emulator
# OR scan QR code with physical device
```

**Checklist:**
- [ ] App loads cleanly
- [ ] No ANR (Application Not Responding) errors
- [ ] Transactions load from secure storage

### iOS
```bash
npx expo start -c
# Press 'i' to open iOS simulator
# OR scan QR code with physical device
```

**Checklist:**
- [ ] App loads cleanly
- [ ] No crashes
- [ ] Transactions load from secure storage

### Web
```bash
npx expo start -c
# Press 'w' to open web browser
```

**Checklist:**
- [ ] App loads cleanly
- [ ] All features work (except native-only features)
- [ ] No console errors

---

## Debugging if Issues Persist

### App Still Freezes
1. Check console logs: `npx expo start -c` (look for errors)
2. Clear app data: Settings → Apps → TRAKL → Clear Data
3. Restart dev server: Ctrl+C and `npx expo start -c` again
4. Check if `hydrated` state is being set: Add console log in store.ts

### Transactions Not Loading
1. Check if `useTransactionSync` hook is being called
2. Verify `getTransactionsSecure()` is working
3. Check if transactions exist in secure storage

### White Screen on Startup
1. Check if fonts are loading: Look for font errors in console
2. Check if i18n is initializing: Look for i18n errors
3. Check if store is hydrating: Look for hydration errors

---

## Console Commands for Debugging

```javascript
// Check if store is hydrated
useTrakl.getState().hydrated

// Check transactions
useTrakl.getState().transactions

// Check if rehydration failed
useTrakl.getState().rehydrateFailed

// Manually trigger hydration
useTrakl.setState({ hydrated: true })
```

---

## Performance Metrics to Monitor

- **App startup time:** Should be < 3 seconds
- **First interactive:** Should be < 2 seconds
- **Transaction load time:** Should be < 1 second
- **Memory usage:** Should be < 100 MB

---

## Known Issues & Workarounds

### Issue: App freezes after language change
**Workaround:** Restart the app

### Issue: Transactions not visible after first launch
**Workaround:** Restart the app (transactions will load from secure storage)

### Issue: Avatar image not persisting
**Workaround:** Clear app data and re-upload avatar

---

## Success Criteria

✅ **All of the following must be true:**
1. App loads without freezing
2. App responds immediately to user input
3. All data persists across restarts
4. No console errors
5. All tests pass: `npm test`

---

## Next Steps

1. **Run tests:** `npm test`
2. **Test on device:** `npx expo start -c` + scan QR
3. **Verify all features work**
4. **Deploy to production** when ready

---

**Last Updated:** 2026-07-12  
**Status:** ✅ Ready for testing
