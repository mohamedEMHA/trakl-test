"""Test the new build.gradle patch logic locally before running in CI."""
import re, pathlib, shutil, sys

src = pathlib.Path(r"c:\dev\trakl-test\android\app\build.gradle")
bak = src.with_suffix(".gradle.bak")
shutil.copy(src, bak)

s = src.read_text()

# === The same logic as in the workflow ===
var_block = '''
        // --- Release signing (injected by CI workflow) ---
        def uploadStoreFile     = findProperty('MYAPP_UPLOAD_STORE_FILE')
        def uploadKeyAlias      = findProperty('MYAPP_UPLOAD_KEY_ALIAS')
        def uploadStorePassword = findProperty('MYAPP_UPLOAD_STORE_PASSWORD')
        def uploadKeyPassword   = findProperty('MYAPP_UPLOAD_KEY_PASSWORD')
        def hasReleaseSigning   = [uploadStoreFile, uploadKeyAlias, uploadStorePassword, uploadKeyPassword].every {
            it != null && !it.toString().trim().isEmpty()
        }
        // -----------------------------------------------
        '''
s = re.sub(
    r'(apply plugin:\s*"com\.facebook\.react"\s*\n)',
    r'\1' + var_block,
    s,
    count=1,
)
s = re.sub(
    r'signingConfigs\s*\{\s*debug\s*\{[^}]*\}\s*\}',
    '''signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (hasReleaseSigning) {
                storeFile file(uploadStoreFile)
                storePassword uploadStorePassword
                keyAlias uploadKeyAlias
                keyPassword uploadKeyPassword
            }
        }
    }''',
    s,
    count=1,
)
s = re.sub(
    r'release\s*\{\s*\n(\s*//[^\n]*\n)*\s*signingConfig signingConfigs\.debug',
    '''release {
        signingConfig hasReleaseSigning ? signingConfigs.release : signingConfigs.debug''',
    s,
    count=1,
)

print("==== AFTER PATCH ====")
for i, line in enumerate(s.splitlines(), 1):
    if i <= 18 or 95 <= i <= 145 or "signing" in line.lower() or "hasReleaseSigning" in line:
        print(f"{i:3}: {line}")

# Roll back
shutil.copy(bak, src)
bak.unlink()
print("\n(rolled back; build.gradle restored)")

# Validate
checks = {
    "var def uploadStoreFile": "def uploadStoreFile" in s,
    "def hasReleaseSigning": "def hasReleaseSigning" in s,
    "signingConfigs.release": "release {" in s and "if (hasReleaseSigning)" in s,
    "release block conditional": "signingConfig hasReleaseSigning ? signingConfigs.release" in s,
}
ok = all(checks.values())
for k, v in checks.items():
    print(f"  {'OK' if v else 'FAIL'}: {k}")
if not ok:
    sys.exit(1)
print("\n[OK] All patches applied successfully")
