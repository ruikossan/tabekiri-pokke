const { withXcodeProject } = require("@expo/config-plugins");

const PHASE_NAME = "Fix iOS supported platforms";

const shellScript = `
set -e

if [ "$PLATFORM_NAME" != "iphoneos" ]; then
  echo "Skipping supported platforms fix for $PLATFORM_NAME."
  exit 0
fi

APP_FRAMEWORKS_DIR="$TARGET_BUILD_DIR/$FRAMEWORKS_FOLDER_PATH"

if [ ! -d "$APP_FRAMEWORKS_DIR" ]; then
  echo "No app Frameworks directory found at $APP_FRAMEWORKS_DIR."
  exit 0
fi

patched_count=0

while IFS= read -r -d '' plist_path; do
  platforms=$(/usr/libexec/PlistBuddy -c "Print :CFBundleSupportedPlatforms" "$plist_path" 2>/dev/null || true)

  should_patch=0

  if echo "$platforms" | grep -q "XRSimulator"; then
    should_patch=1
  fi

  if [[ "$plist_path" == *"ReactNativeDependencies"* ]] && echo "$platforms" | grep -q "iPhoneSimulator"; then
    should_patch=1
  fi

  if [ "$should_patch" -eq 1 ]; then
    /usr/libexec/PlistBuddy -c "Delete :CFBundleSupportedPlatforms" "$plist_path" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Add :CFBundleSupportedPlatforms array" "$plist_path"
    /usr/libexec/PlistBuddy -c "Add :CFBundleSupportedPlatforms:0 string iPhoneOS" "$plist_path"
    patched_count=$((patched_count + 1))
    echo "Patched CFBundleSupportedPlatforms in $plist_path"
  fi
done < <(find "$APP_FRAMEWORKS_DIR" -name Info.plist -print0)

echo "Patched $patched_count Info.plist file(s) for App Store upload."
`.trim();

function hasBuildPhase(project, phaseName) {
  const phases = project.hash.project.objects.PBXShellScriptBuildPhase || {};

  return Object.values(phases).some((phase) => {
    return phase && typeof phase === "object" && phase.name === `"${phaseName}"`;
  });
}

module.exports = function withIosSupportedPlatformsFix(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;

    if (!hasBuildPhase(project, PHASE_NAME)) {
      project.addBuildPhase([], "PBXShellScriptBuildPhase", PHASE_NAME, project.getFirstTarget().uuid, {
        inputPaths: [],
        outputPaths: [],
        shellPath: "/bin/bash",
        shellScript,
      });
    }

    return config;
  });
};
