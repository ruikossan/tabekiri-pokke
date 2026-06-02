const { execFileSync } = require("node:child_process");
const { existsSync, readdirSync, statSync } = require("node:fs");
const { join } = require("node:path");

const plistBuddy = "/usr/libexec/PlistBuddy";
const searchRoot = process.cwd();

function listInfoPlists(directory) {
  if (!existsSync(directory)) return [];

  const entries = readdirSync(directory);
  const files = [];

  entries.forEach((entry) => {
    const fullPath = join(directory, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...listInfoPlists(fullPath));
      return;
    }

    if (entry === "Info.plist") {
      files.push(fullPath);
    }
  });

  return files;
}

function readSupportedPlatforms(plistPath) {
  try {
    return execFileSync(plistBuddy, ["-c", "Print :CFBundleSupportedPlatforms", plistPath], { encoding: "utf8" });
  } catch {
    return "";
  }
}

function setIphoneOsOnly(plistPath) {
  execFileSync(plistBuddy, ["-c", "Delete :CFBundleSupportedPlatforms", plistPath]);
  execFileSync(plistBuddy, ["-c", "Add :CFBundleSupportedPlatforms array", plistPath]);
  execFileSync(plistBuddy, ["-c", "Add :CFBundleSupportedPlatforms:0 string iPhoneOS", plistPath]);
}

if (process.env.EAS_BUILD_PLATFORM !== "ios") {
  console.log("Skipping iOS supported platforms fix outside iOS builds.");
  process.exit(0);
}

const patched = listInfoPlists(searchRoot).filter((plistPath) => {
  const platforms = readSupportedPlatforms(plistPath);
  const shouldPatch = platforms.includes("XRSimulator") || (
    plistPath.includes("ReactNativeDependencies") &&
    platforms.includes("iPhoneOS") &&
    platforms.includes("iPhoneSimulator")
  );

  if (!shouldPatch) return false;

  setIphoneOsOnly(plistPath);
  return true;
});

if (patched.length === 0) {
  console.log("No Info.plist files with XRSimulator supported platform were found.");
} else {
  console.log(`Patched ${patched.length} Info.plist file(s) to use iPhoneOS only:`);
  patched.forEach((plistPath) => console.log(`- ${plistPath}`));
}
