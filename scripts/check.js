const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const requiredFiles = ["index.html", "styles.css", "app.js", "server.js", "package.json"];
const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));

if (missing.length) {
  console.error(`Missing required files: ${missing.join(", ")}`);
  process.exit(1);
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const js = fs.readFileSync(path.join(root, "app.js"), "utf8");

if (!html.includes('id="workspace"')) {
  console.error("index.html does not contain the app workspace.");
  process.exit(1);
}

if (!js.includes("generateRota")) {
  console.error("app.js does not contain rota generation logic.");
  process.exit(1);
}

console.log("Peppermint Crew Planner checks passed.");
