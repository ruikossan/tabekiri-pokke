const { existsSync, readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const podspecPath = join(
  process.cwd(),
  "node_modules",
  "react-native",
  "third-party-podspecs",
  "ReactNativeDependencies.podspec",
);

const marker = "[tabekiri-pokke] Fix ReactNativeDependencies supported platforms";

const patchBlock = `

      echo "${marker}"
      find "$PODS_ROOT" -path "*ReactNativeDependencies*.bundle/Info.plist" -print | while IFS= read -r plist_path; do
        platforms=$(/usr/libexec/PlistBuddy -c "Print :CFBundleSupportedPlatforms" "$plist_path" 2>/dev/null || true)
        if echo "$platforms" | grep -E -q "XRSimulator|iPhoneSimulator"; then
          /usr/libexec/PlistBuddy -c "Delete :CFBundleSupportedPlatforms" "$plist_path" 2>/dev/null || true
          /usr/libexec/PlistBuddy -c "Add :CFBundleSupportedPlatforms array" "$plist_path"
          /usr/libexec/PlistBuddy -c "Add :CFBundleSupportedPlatforms:0 string iPhoneOS" "$plist_path"
          echo "Patched CFBundleSupportedPlatforms in $plist_path"
        fi
      done
`;

if (!existsSync(podspecPath)) {
  console.log("ReactNativeDependencies.podspec was not found. Skipping patch.");
  process.exit(0);
}

const podspec = readFileSync(podspecPath, "utf8");

if (podspec.includes(marker)) {
  console.log("ReactNativeDependencies.podspec is already patched.");
  process.exit(0);
}

const replaceCommand =
  '"$NODE_BINARY" "$REACT_NATIVE_PATH/third-party-podspecs/replace_dependencies_version.js" -c "$CONFIG" -r "#{version}" -p "$PODS_ROOT"';

if (!podspec.includes(replaceCommand)) {
  console.error("Could not find the ReactNativeDependencies replacement command to patch.");
  process.exit(1);
}

writeFileSync(podspecPath, podspec.replace(replaceCommand, `${replaceCommand}${patchBlock}`));
console.log("Patched ReactNativeDependencies.podspec to fix App Store supported platforms.");
