const fs = require("fs");
const { spawnSync } = require("child_process");

const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "server.js",
  "api/email-notifications.js",
  "api/email-inbox.js",
  "api/email-read.js",
  "api/email-replies.js",
  "api/email-attachments.js",
  "api/app-state.js",
  "api/blob-delete.js",
  "api/blob-upload.js",
  "api/cover-requests.js",
  "api/health.js",
  "lib/app-state-store.js",
  "lib/blob-store.js",
  "lib/cover-email.js",
  "lib/cover-store.js",
  "lib/email-service.js",
  "lib/gmail-service.js",
  "cover-accept.html",
  "cover-accept.js",
  "manifest.webmanifest",
  "sw.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "vercel.json",
  ".vercelignore"
];
const missingFiles = requiredFiles.filter((file) => !fs.existsSync(file));

if (missingFiles.length) {
  console.error(`Missing required file${missingFiles.length === 1 ? "" : "s"}: ${missingFiles.join(", ")}`);
  process.exit(1);
}

JSON.parse(fs.readFileSync("manifest.webmanifest", "utf8"));

["app.js", "server.js", "api/email-notifications.js", "api/email-inbox.js", "api/email-read.js", "api/email-replies.js", "api/email-attachments.js", "api/app-state.js", "api/blob-delete.js", "api/blob-upload.js", "api/cover-requests.js", "api/health.js", "lib/app-state-store.js", "lib/blob-store.js", "lib/cover-email.js", "lib/cover-store.js", "lib/email-service.js", "lib/gmail-service.js", "cover-accept.js", "sw.js"].forEach((file) => {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
});

console.log("Peppermint Crew Planner checks passed.");
