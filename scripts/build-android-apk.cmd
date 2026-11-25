@echo off
setlocal

for %%I in ("%~dp0..") do set "PROJECT_ROOT=%%~fI"
for %%I in ("%PROJECT_ROOT%\..\gradle-home") do set "GRADLE_USER_HOME=%%~fI"

if not exist "%GRADLE_USER_HOME%" mkdir "%GRADLE_USER_HOME%"
if not exist "%GRADLE_USER_HOME%" (
  echo Could not create Gradle cache directory: "%GRADLE_USER_HOME%"
  exit /b 1
)

pushd "%PROJECT_ROOT%\android" || exit /b 1
call gradlew.bat --no-daemon --gradle-user-home "%GRADLE_USER_HOME%" assembleRelease
set "BUILD_EXIT_CODE=%ERRORLEVEL%"
popd

exit /b %BUILD_EXIT_CODE%
