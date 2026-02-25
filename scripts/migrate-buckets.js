#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const CASES_FILE = path.join(__dirname, "..", "tests", "golden-eugene-v1", "cases.seed.json");

const REMAP = {
  "GD-001": "B4",
  "GD-002": "B1",
  "GD-003": "B2",
  "GD-004": "B6",
  "GD-005": "B1",
  "GD-006": "B3",
  "GD-007": "B3",
  "GD-008": "B1",
  "GD-009": "B3",
  "GD-010": "B3",
  "GD-011": "B3",
  "GD-012": "B3",
  "GD-013": "B1",
  "GD-014": "B3",
  "GD-015": "B3",
  "GD-016": "B4",
  "GD-017": "B3",
  "GD-018": "B2",
  "GD-019": "B3",
  "GD-020": "B3",
  "GD-021": "B6",
  "GD-022": "B2",
  "GD-023": "B4",
  "GD-024": "B1",
  "GD-025": "B6",
  "GD-026": "B3",
  "GD-027": "B2",
};

const data = JSON.parse(fs.readFileSync(CASES_FILE, "utf8"));
let changed = 0;

for (const c of data.cases || []) {
  const newBucket = REMAP[c.case_id];
  if (newBucket && c.behavior_bucket !== newBucket) {
    console.log(`${c.case_id}: ${c.behavior_bucket} -> ${newBucket}`);
    c.behavior_bucket = newBucket;
    changed++;
  }
}

fs.writeFileSync(CASES_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`\nDone. ${changed} cases remapped.`);
