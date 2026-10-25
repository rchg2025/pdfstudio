#!/bin/bash
set -e
mkdir -p /opt/android-sdk/cmdline-tools
cd /opt/android-sdk/cmdline-tools
if [ ! -d "latest" ]; then
  echo "Downloading Android Commandline Tools..."
  curl -sS -o cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
  unzip -q cmdline-tools.zip
  mv cmdline-tools latest
  rm cmdline-tools.zip
fi

export ANDROID_HOME=/opt/android-sdk
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

echo "Accepting licenses..."
yes | sdkmanager --licenses >/dev/null 2>&1 || true

echo "Installing platforms and build-tools..."
sdkmanager "platforms;android-34" "build-tools;34.0.0" >/dev/null 2>&1

echo "Building APK for Tiện ích ITE..."
cd /var/www/pdfstudio/android
export ANDROID_HOME=/opt/android-sdk
./gradlew assembleDebug

mkdir -p /var/www/pdfstudio/public/download
cp app/build/outputs/apk/debug/app-debug.apk /var/www/pdfstudio/public/download/tienich-ite.apk
mkdir -p /var/www/pdfstudio/dist/download
cp app/build/outputs/apk/debug/app-debug.apk /var/www/pdfstudio/dist/download/tienich-ite.apk

echo "SUCCESS_APK_CREATED"
ls -la /var/www/pdfstudio/public/download/tienich-ite.apk
