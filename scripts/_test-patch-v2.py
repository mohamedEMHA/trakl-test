"""Test the new build.gradle patch logic (signing + versionCode/versionName) locally."""
import os, re, pathlib, shutil, sys, tempfile

# Simulate the prebuild template content (with hardcoded versionCode 1 / versionName 1.0.0)
TEMPLATE = r'''apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"

react {
    autolinkLibrariesWithApp()
}

def enableMinifyInReleaseBuilds = (findProperty('android.enableMinifyInReleaseBuilds') ?: false).toBoolean()

android {
    ndkVersion rootProject.ext.ndkVersion
    buildToolsVersion rootProject.ext.buildToolsVersion
    compileSdk rootProject.ext.compileSdkVersion

    namespace 'trakl.app'
    defaultConfig {
        applicationId 'trakl.app'
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0.0"

        buildConfigField "String", "REACT_NATIVE_RELEASE_LEVEL", "\"${findProperty('reactNativeReleaseLevel') ?: 'stable'}\""
    }
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug
            def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'false'
            shrinkResources enableShrinkResources.toBoolean()
            minifyEnabled enableMinifyInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
'''

# === Same logic as in the workflow ===
os.environ["VERSION_CODE"] = "2"
os.environ["VERSION_NAME"] = "1.0.1"

s = TEMPLATE

version_code = os.environ.get("VERSION_CODE", "2")
version_name = os.environ.get("VERSION_NAME", "1.0.1")

# 1. Inject variable definitions
var_block = f'''
// --- Release signing (injected by CI workflow) ---
def uploadStoreFile     = findProperty('MYAPP_UPLOAD_STORE_FILE')
def uploadKeyAlias      = findProperty('MYAPP_UPLOAD_KEY_ALIAS')
def uploadStorePassword = findProperty('MYAPP_UPLOAD_STORE_PASSWORD')
def uploadKeyPassword   = findProperty('MYAPP_UPLOAD_KEY_PASSWORD')
def hasReleaseSigning   = [uploadStoreFile, uploadKeyAlias, uploadStorePassword, uploadKeyPassword].each {{
    it != null && !it.toString().trim().isEmpty()
}}
// -----------------------------------------------
'''
# NOTE: the workflow uses .every{}, not .each{}. Fix the template above.
var_block = var_block.replace(".each {", ".every {")
s = re.sub(
    r'(apply plugin:\s*"com\.facebook\.react"\s*\n)',
    r'\1' + var_block,
    s,
    count=1,
)

# 2. Replace signingConfigs block
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

# 3. Conditional signing in release block
s = re.sub(
    r'release\s*\{\s*\n(\s*//[^\n]*\n)*\s*signingConfig signingConfigs\.debug',
    '''release {
    signingConfig hasReleaseSigning ? signingConfigs.release : signingConfigs.debug''',
    s,
    count=1,
)

# 4. Bump versionCode / versionName
s, n1 = re.subn(r'versionCode\s+\d+', f'versionCode {version_code}', s, count=1)
s, n2 = re.subn(r'versionName\s+"[^"]*"', f'versionName "{version_name}"', s, count=1)
print(f"Patched versionCode (replacements={n1}) and versionName (replacements={n2})")

print("==== AFTER PATCH ====")
for line in s.splitlines():
    if any(kw in line for kw in ("versionCode", "versionName", "signing", "hasReleaseSigning", "upload")):
        print("  " + line)

# Validate
checks = {
    "def uploadStoreFile injected": "def uploadStoreFile" in s,
    "def hasReleaseSigning injected": "def hasReleaseSigning" in s,
    "signingConfigs.release block": "if (hasReleaseSigning)" in s and "storeFile file(uploadStoreFile)" in s,
    "release uses conditional signing": "signingConfig hasReleaseSigning ? signingConfigs.release : signingConfigs.debug" in s,
    "versionCode bumped to 2": re.search(r'versionCode\s+2\b', s) is not None,
    "versionName bumped to 1.0.1": 'versionName "1.0.1"' in s,
    "old debug signing line removed from release": not re.search(r'release\s*\{[^}]*signingConfig signingConfigs\.debug[^}]*hasReleaseSigning', s, re.DOTALL),
}
ok = all(checks.values())
for k, v in checks.items():
    print(f"  {'OK' if v else 'FAIL'}: {k}")
if not ok:
    print("\n[FAIL] Some checks failed")
    sys.exit(1)
print("\n[OK] All patches applied successfully")
