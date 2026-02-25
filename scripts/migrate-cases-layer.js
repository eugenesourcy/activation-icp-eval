#!/usr/bin/env node
/**
 * One-time migration: add layer to check_definitions, trim must_pass_checks to conversation-layer only.
 * Conversation layer: CK-005,006,007,008,009,010,015,018,019,020,021,022,023,024
 * Integration layer: CK-001,002,003,004,011,012,013,014,016,017
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const CASES_FILE = path.join(ROOT, "tests", "golden-eugene-v1", "cases.seed.json");

const CONVERSATION_LAYER = new Set([
  "CK-005", "CK-006", "CK-007", "CK-008", "CK-009", "CK-010",
  "CK-015", "CK-018", "CK-019", "CK-020", "CK-021", "CK-022", "CK-023", "CK-024"
]);

const WA_CASE_IDS = new Set(["GD-005", "GD-007", "GD-016", "GD-017", "GD-023", "GD-024"]);

const data = JSON.parse(fs.readFileSync(CASES_FILE, "utf8"));

// Add layer to each check_definition
for (const chk of data.check_definitions || []) {
  chk.layer = CONVERSATION_LAYER.has(chk.id) ? "conversation" : "integration";
}

// Trim must_pass_checks to conversation-layer only
for (const c of data.cases || []) {
  if (Array.isArray(c.must_pass_checks)) {
    c.must_pass_checks = c.must_pass_checks.filter((id) => CONVERSATION_LAYER.has(id));
  }
  if (!c.channel) c.channel = WA_CASE_IDS.has(c.case_id) ? "WA" : "web";
}

fs.writeFileSync(CASES_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("Migrated " + CASES_FILE + ": added layer to check_definitions, trimmed must_pass_checks, set channel (WA for Eric v7 cases, web for rest).");
