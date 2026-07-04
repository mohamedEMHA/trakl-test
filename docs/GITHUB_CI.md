# GitHub Actions — Android Release Build (Pure Gradle)

Αυτόματο release .aab (και προαιρετικά .apk) για το **TRAKL** χωρίς EAS quota, χωρίς Android Studio, χωρίς τοπικό Gradle setup.

> **Variants** που αποφεύγουμε:
> - A) EAS build μέσω GitHub Actions → μετράει στο EAS quota (δεν το θέλουμε).
> - B) **GitHub Actions + καθαρό Gradle** → αυτό που κάνουμε. Τρέχει `expo prebuild` + `./gradlew bundleRelease` απευθείας στο Ubuntu runner.
>
> **Δεν αγγίζει καθόλου το EAS.** Το `EXPO_TOKEN` δεν χρειάζεται.

## Τι χτίζεται

- **App Bundle (.aab)** — production release, signed με το `android-upload-key.p12`.
- **Προαιρετικά APK (.apk)** — αν επιλεγεί `release-apk` στο manual trigger.
- **Mapping files** — για deobfuscation στο Play Console.

Όλα ανεβαίνουν ως **GitHub Artifacts** (retention 30 ημέρες), downloadable από το Actions run.

## Δομή

```
.github/
  workflows/
    react-native-cicd.yml          # Το κύριο workflow (pure Gradle)
  .secrets/                        # gitignored — base64 keystore για local dry-run
  .gitignore                       # αγνοεί το .secrets/
scripts/
  encode-keystore.ps1              # base64-encode του .p12
  setup-github-secrets.ps1         # local validator + guidance
  local-dry-run.ps1                # local mirror του CI (Windows)
  run-dry-run.ps1                  # wrapper με τα local secrets
  _syntax-check.ps1                # PowerShell syntax validator
```

## Prerequisites

- GitHub repo (υπάρχει ήδη: `mopatch/trakl-test` ή παρόμοιο).
- To `android-upload-key.p12` τοπικά + τα credentials του.
- Public repo → unlimited free minutes. Private repo → 2000 λεπτά/μήνα (αρκετά).

## Setup — Βήμα-βήμα

### 1. Encode το keystore (μία φορά)

```powershell
cd c:\dev\trakl-test
powershell -ExecutionPolicy Bypass -File scripts\encode-keystore.ps1
```

Αυτό γράφει single-line base64 στο `.github\.secrets\android-upload-key.base64.txt`.
SHA-256 του αρχείου: `FF18A46940221196F950103D9BCCA3F429B8FE3276702C778D4C5176CB1FC5B9`
(verify locally με `Get-FileHash android-upload-key.p12 -Algorithm SHA256`)

### 2. Push τον workflow

```bash
git add .github/workflows/react-native-cicd.yml scripts/
git commit -m "ci: add GitHub Actions Android release workflow (pure Gradle)"
git push origin main
```

### 3. Βάλε τα 4 secrets στο GitHub

`GitHub repo → Settings → Secrets and variables → Actions → New repository secret`

| Secret name                  | Value                                                    |
|------------------------------|----------------------------------------------------------|
| `ANDROID_KEYSTORE_BASE64`    | Περιεχόμενο αρχείου `.github\.secrets\android-upload-key.base64.txt` (μία γραμμή, ~3220 chars) |
| `ANDROID_KEYSTORE_PASSWORD`  | `vKqE_w5hPH-pduUrxDVGk3N-RIP8BUJ7`                       |
| `ANDROID_KEY_ALIAS`          | `upload`                                                 |
| `ANDROID_KEY_PASSWORD`       | `vKqE_w5hPH-pduUrxDVGk3N-RIP8BUJ7` (ίδιο με store password) |

> ⚠️ **Τα παραπάνω credentials είναι hard-coded για ευκολία.** Σε production, βάλε τα σε environment-scoped secrets ή rotate τακτικά. Το `MYAPP_UPLOAD_KEY_PASSWORD` και `MYAPP_UPLOAD_STORE_PASSWORD` στο `gradle.properties` πρέπει να **αφαιρεθούν** πριν το commit για production (βλ. "Security hardening" παρακάτω).

### 4. Trigger

- **Manual**: `Actions → React Native CI/CD (Android Release) → Run workflow → release-aab`
- **Auto**: push στο `main` (εκτός `*.md`/`docs/**`/`.github/**`)

### 5. Download το .aab

`Actions → τρέχον run → Artifacts (κάτω) → app-release-aab → app-release.aab`

Upload στο Google Play Console → App releases → Internal testing / Production.

## Τι γίνεται στο workflow

| Βήμα | Τι κάνει |
|------|----------|
| 1. Checkout | Pulls τον κώδικα |
| 2. Setup JDK 17 | Temurin JDK 17 + Gradle cache |
| 3. Setup Node 20 | Node.js 20 + npm cache |
| 4. Setup Android SDK | API 35, build-tools 35.0.0, NDK 26.1.10909125 |
| 5. Gradle cache | ~/.gradle/caches + wrapper |
| 6. `npm ci` | Clean install από package-lock.json |
| 7. `npx expo prebuild --platform android --clean --no-install` | Regenerate android/ folder από app.config.ts |
| 8. Decode keystore | Base64 secret → `android/app/upload-keystore.p12` |
| 9. `keytool` p12→jks | Convert σε JKS για clean Gradle signing |
| 10. Patch gradle.properties | Set MYAPP_UPLOAD_* (file, alias, passwords) |
| 11. `./gradlew bundleRelease` | Κυρίως build — παράγει .aab |
| 12. Upload AAB artifact | `app-release.aab` (30-day retention) |
| 13. Upload mapping | `mapping.txt` για Play Console deobfuscation |

## Trigger inputs

`workflow_dispatch` έχει ένα input:

- `build_type`:
  - `release-aab` (default) — μόνο .aab
  - `release-apk` — .aab **+** .apk (πιο αργό)

## Troubleshooting

### ❌ `Plugin [id: 'com.facebook.react.settings'] was not found`

Σημαίνει ότι το expo prebuild δεν έτρεξε ή δεν είδε τα node_modules. Λύσεις:
- Βεβαιώσου ότι `npm ci` τρέχει πριν το prebuild.
- Μη σβήνεις το `node_modules/` step.

### ❌ `Missing Android release signing properties.`

Σημαίνει ότι τα 4 secrets δεν έχουν μπει ή είναι κενά. Έλεγξε Settings → Secrets.

### ❌ `keytool error: ... Integrity check failed`

Λάθος password. Ξαναβάλε `ANDROID_KEYSTORE_PASSWORD`.

### ❌ `Could not find tools.jar`

JDK 17 δεν εγκαταστάθηκε σωστά. Έλεγξε ότι `setup-java` χρησιμοποιεί `temurin`.

### ❌ `SDK location not found`

Το `android/local.properties` λείπει. Το `android-actions/setup-android@v3` θα έπρεπε να το γράψει αυτόματα. Αν όχι, πρόσθεσε:
```yaml
- name: Write local.properties
  run: echo "sdk.dir=$ANDROID_HOME" >> android/local.properties
```

## Security hardening (προαιρετικό, προτείνεται)

Το τρέχον `android/gradle.properties` περιέχει passwords σε **plaintext**. Αυτό δεν πρέπει να γίνει commit.

Βήματα:
1. **Πριν το πρώτο commit**, αφαίρεσε τις 4 γραμμές `MYAPP_UPLOAD_*` από `android/gradle.properties`.
2. Το workflow ήδη τις γράφει dynamically (sed replace) — δεν χρειάζονται στο source.
3. Αν ήδη τις έκανες commit, **rotate τα passwords** πριν σβήσεις το git history.

Για μελλοντική χρήση, μπορείς να κάνεις τα secrets **environment-scoped** (`Settings → Environments → production`) αντί για repository-wide.

## Local dry-run (προαιρετικό)

Αν θέλεις να τεστάρεις τοπικά πριν push:

```powershell
$env:ANDROID_KEYSTORE_PASSWORD = "vKqE_w5hPH-pduUrxDVGk3N-RIP8BUJ7"
$env:ANDROID_KEY_ALIAS         = "upload"
$env:ANDROID_KEY_PASSWORD      = $env:ANDROID_KEYSTORE_PASSWORD
powershell -File scripts\local-dry-run.ps1
```

> ⚠️ Σε Windows με broken `node_modules` (π.χ. missing `pngjs/lib/sync-inflate.js`) το local dry-run θα αποτύχει. Αυτό είναι ακριβώς το πρόβλημα που λύνει το cloud CI — στο fresh GitHub runner τα deps εγκαθίστανται σωστά.

## Γιατί δεν βάζουμε EXPO_TOKEN

Το `EXPO_TOKEN` χρειάζεται μόνο αν τρέξεις `eas build`. Εδώ τρέχουμε `expo prebuild` (local file generation) + `gradlew bundleRelease` (Gradle). **Κανένα EAS call, κανένα quota consumption.**
