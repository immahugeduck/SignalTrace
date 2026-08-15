#!/usr/bin/env bash
# Installs the Android SDK command-line tools and accepts licenses, then
# installs exactly the platform / build-tools / NDK / CMake versions this
# project's android/build.gradle already pins:
#   compileSdk 35, buildTools 35.0.0, ndk 27.1.12297006, cmake 3.22.1
# Runs once via devcontainer.json's onCreateCommand. Idempotent — safe to
# re-run (e.g. on a container rebuild).
set -euo pipefail

ANDROID_HOME="${ANDROID_HOME:-/home/vscode/android-sdk}"
# Filename from https://developer.android.com/studio#command-tools as of this
# writing. Google occasionally retires old cmdline-tools builds; if the
# download 404s, grab the current Linux filename from that page and update
# the version number below.
CMDLINE_TOOLS_VERSION="15859902"
PLATFORM="platforms;android-35"
BUILD_TOOLS="build-tools;35.0.0"
NDK="ndk;27.1.12297006"
CMAKE="cmake;3.22.1"

if ! command -v unzip >/dev/null 2>&1 || ! command -v curl >/dev/null 2>&1; then
  echo "==> Installing curl/unzip"
  sudo apt-get update -y
  sudo apt-get install -y --no-install-recommends unzip curl
fi

echo "==> Android SDK target: $ANDROID_HOME"
mkdir -p "$ANDROID_HOME/cmdline-tools"

if [ -x "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]; then
  echo "==> cmdline-tools already installed, skipping download."
else
  ZIP="/tmp/cmdline-tools.zip"
  URL="https://dl.google.com/android/repository/commandlinetools-linux-${CMDLINE_TOOLS_VERSION}_latest.zip"
  echo "==> Downloading $URL"
  curl -fsSL -o "$ZIP" "$URL"

  if ! unzip -tq "$ZIP" >/dev/null 2>&1; then
    echo "ERROR: downloaded file is not a valid zip. Google may have retired" >&2
    echo "cmdline-tools version $CMDLINE_TOOLS_VERSION. Get the current Linux" >&2
    echo "filename from https://developer.android.com/studio#command-tools" >&2
    echo "and update CMDLINE_TOOLS_VERSION in this script." >&2
    exit 1
  fi

  TMP_EXTRACT="/tmp/cmdline-tools-extract"
  rm -rf "$TMP_EXTRACT"
  unzip -q "$ZIP" -d "$TMP_EXTRACT"
  # The zip extracts to a top-level "cmdline-tools" dir; sdkmanager expects it
  # to live under cmdline-tools/<name>, conventionally "latest".
  rm -rf "$ANDROID_HOME/cmdline-tools/latest"
  mv "$TMP_EXTRACT/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
  rm -rf "$TMP_EXTRACT" "$ZIP"
fi

SDKMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager"
export ANDROID_HOME
export ANDROID_SDK_ROOT="$ANDROID_HOME"

echo "==> Accepting SDK licenses"
yes | "$SDKMANAGER" --licenses >/dev/null || true

echo "==> Installing platform-tools, $PLATFORM, $BUILD_TOOLS, $NDK, $CMAKE"
"$SDKMANAGER" \
  "platform-tools" \
  "$PLATFORM" \
  "$BUILD_TOOLS" \
  "$NDK" \
  "$CMAKE" \
  >/dev/null

echo "==> Android SDK ready:"
"$SDKMANAGER" --list_installed
