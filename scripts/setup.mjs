import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const root = process.cwd();
const forceSeed = process.argv.includes("--seed");

console.log("Nexus OS — Setup");
console.log("────────────────");

if (!fs.existsSync(path.join(root, "node_modules"))) {
  console.log("Installing dependencies...");
  execSync("npm install", { stdio: "inherit" });
}

console.log("Seeding demo database (Acme Corporation)...");
execSync("node scripts/seed.mjs", { stdio: "inherit" });

console.log("");
console.log("Setup complete. Start the app with:  npm run dev");
console.log("Then open  http://localhost:3000  and log in with demo@example.com / demo123");
