import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const version = process.argv[2];
if (!version || !/^\d{4}\.\d{2}\.\d{2}\.\d+$/.test(version)) {
  console.error("Uso: node scripts/update-version.mjs AAAA.MM.DD.N");
  process.exit(1);
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const versionFiles = ["js/version.js", "dist/js/version.js"];
const versionedFiles = [
  "index.html",
  "dist/index.html",
  "js/app.js",
  "dist/js/app.js",
  "js/firebase-service.js",
  "dist/js/firebase-service.js",
  "js/ui.js",
  "dist/js/ui.js",
];
const localVersionedUrl = /(\.{1,2}\/[^"'`\s?]+\.(?:css|js|webp|svg))\?v=[^"'`\s&]+/g;

for (const relativePath of versionFiles) {
  fs.writeFileSync(
    path.join(projectRoot, relativePath),
    `export const APP_VERSION = "${version}";\n`,
    "utf8",
  );
}

for (const relativePath of versionedFiles) {
  const filePath = path.join(projectRoot, relativePath);
  const source = fs.readFileSync(filePath, "utf8");
  const updated = source.replace(localVersionedUrl, `$1?v=${version}`);
  fs.writeFileSync(filePath, updated, "utf8");
}

console.log(`Versão atualizada para ${version}.`);
