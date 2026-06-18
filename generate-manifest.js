#!/usr/bin/env node
/**
 * generate-manifest.js
 *
 * Walks the content folders and writes manifest.json.
 * Structure expected:
 *   <Subject>/<Chapter>/<Formula Title>.md
 *
 * Run: node scripts/generate-manifest.js
 */

const fs   = require("fs");
const path = require("path");

// Folders to skip entirely
const IGNORE = new Set(["node_modules", ".git", ".github", "scripts", ".DS_Store"]);

// Files to skip
const IGNORE_FILES = new Set(["README.md", "index.html", "manifest.json"]);

const ROOT = path.resolve(__dirname, "..");
const OUT  = path.join(ROOT, "manifest.json");

function isDir(p)  { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function isFile(p) { try { return fs.statSync(p).isFile();      } catch { return false; } }

function readDir(p) {
  return fs.readdirSync(p).filter(n => !IGNORE.has(n) && !n.startsWith(".")).sort();
}

const tree = {};

// Level 1 — Subjects
for (const subject of readDir(ROOT)) {
  const subjPath = path.join(ROOT, subject);
  if (!isDir(subjPath)) continue;

  tree[subject] = {};

  // Level 2 — Chapters
  for (const chapter of readDir(subjPath)) {
    const chapPath = path.join(subjPath, chapter);
    if (!isDir(chapPath)) continue;

    const formulas = [];

    // Level 3 — Formula .md files
    for (const file of readDir(chapPath)) {
      if (!file.endsWith(".md")) continue;
      if (IGNORE_FILES.has(file)) continue;
      const title = file.replace(/\.md$/, "");
      formulas.push(title);
    }

    if (formulas.length > 0) {
      tree[subject][chapter] = formulas;
    }
  }

  // Remove subject if it ended up with no chapters
  if (Object.keys(tree[subject]).length === 0) {
    delete tree[subject];
  }
}

const totalFormulas = Object.values(tree)
  .flatMap(chs => Object.values(chs))
  .reduce((n, fms) => n + fms.length, 0);

const manifest = {
  generated: new Date().toISOString(),
  totalFormulas,
  tree,
};

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2));
console.log(`✓ manifest.json written — ${Object.keys(tree).length} subjects, ${totalFormulas} formulas`);
