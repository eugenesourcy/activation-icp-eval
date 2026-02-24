#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const RUNS = [
  { id: "run-v1", label: "v1", summaries: ["run_summary_v1.md"], order: 1 },
  { id: "run-v2", label: "v2", summaries: ["run_summary_v2.md"], order: 2 },
  { id: "run-v3", label: "v3", summaries: ["run_summary_v3.md"], order: 3 },
  { id: "run-v3-test", label: "v3-test", summaries: ["run_summary_v3_test.md"], order: 4 },
  {
    id: "run-v4-fullsr",
    label: "v4",
    summaries: ["run_summary_v4.md", "run_summary_v4_fullsr.md"],
    order: 5,
  },
  { id: "run-v5", label: "v5", summaries: ["run_summary_v5.md"], order: 6 },
  { id: "run-v6", label: "v6b", summaries: ["run_summary_v6.md"], order: 7 },
  { id: "run-v7", label: "v7", summaries: ["run_summary_v7.md"], order: 8 },
];

const PERSONA_LABELS = {
  syed: "Syed",
  anam: "Anam",
  anthony: "Anthony",
  jammaica: "Jammaica",
  jesus: "Jesus",
  candle: "Candle",
  "candle-student": "Candle Student",
  femmoraaa: "femmoraaa",
  battery: "Battery",
  ghost: "Ghost",
  alibaba: "Alibaba Veteran",
  burned: "Burned Buyer",
  confused: "Ad-Click Confused",
  pricer: "Price Shopper",
  researcher: "Researcher",
  "india-spice": "India Spice",
  "indo-cafe": "Indo Cafe",
  "nigeria-compare": "Nigeria Compare",
  "ph-event": "PH Event",
  "uk-dog": "UK Dog",
};

const PERSONA_ALIASES = {
  syed: ["syed"],
  anam: ["anam"],
  anthony: ["anthony"],
  jammaica: ["jammaica"],
  jesus: ["jesus"],
  candle: ["candle", "student"],
  "candle-student": ["candle", "student"],
  femmoraaa: ["femmoraaa"],
  battery: ["battery"],
  ghost: ["ghost"],
  alibaba: ["alibaba", "veteran"],
  burned: ["burned"],
  confused: ["confused"],
  pricer: ["pricer", "price"],
  researcher: ["researcher"],
  "india-spice": ["india", "spice"],
  "indo-cafe": ["indo", "cafe"],
  "nigeria-compare": ["nigeria", "compare"],
  "ph-event": ["ph", "event", "phevent"],
  "uk-dog": ["uk", "dog", "ukdog"],
};

function exists(p) {
  return fs.existsSync(path.join(ROOT, p));
}

function readText(p) {
  return fs.readFileSync(path.join(ROOT, p), "utf8");
}

function listJsonl(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith(".jsonl"))
    .sort((a, b) => a.localeCompare(b));
}

function listMarkdown(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));
}

function normalizeKey(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function derivePersonaKey(baseName) {
  let name = baseName.replace(/\.jsonl$/i, "");
  name = name.replace(/^v\d+[a-z]*-/, "");
  name = name.replace(/^sr-/, "");
  name = name.replace(/^ts-/, "");
  name = name.replace(/^t-/, "");
  name = name.replace(/-test$/, "");
  name = normalizeKey(name);

  if (name === "india") return "india-spice";
  if (name === "indo") return "indo-cafe";
  if (name === "nigeria") return "nigeria-compare";
  if (name === "phevent") return "ph-event";
  if (name === "ukdog") return "uk-dog";
  if (name === "candle-student") return "candle-student";
  return name;
}

function deriveScenarioType(runId, baseName) {
  const b = baseName.replace(/\.jsonl$/i, "");
  if (runId === "run-v3-test") return "holdout-test";
  if (runId === "run-v4-fullsr") {
    if (b.startsWith("sr-")) return "full-sr-core";
    if (b.startsWith("v4t-")) return "adversarial-test";
    if (b.startsWith("ts-")) return "test-set";
    if (b.startsWith("v4-")) return "core-replay";
  }
  return "core";
}

function parseJsonlMessages(filePath) {
  const raw = readText(filePath);
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const messages = [];
  let sessionId = null;
  let model = null;

  for (const line of lines) {
    let obj;
    try {
      obj = JSON.parse(line);
    } catch (_e) {
      continue;
    }

    if (obj.type === "session" && obj.id) sessionId = String(obj.id);
    if (obj.type === "model_change" && obj.modelId) model = String(obj.modelId);

    if (obj.type !== "message" || !obj.message) continue;
    const role = obj.message.role;
    if (role !== "user" && role !== "assistant") continue;

    let text = "";
    const content = obj.message.content;
    if (Array.isArray(content)) {
      text = content
        .filter((c) => c && c.type === "text" && typeof c.text === "string")
        .map((c) => c.text)
        .join("");
    } else if (typeof content === "string") {
      text = content;
    }

    text = text.replace(/\r/g, "").trim();
    if (!text) continue;

    messages.push({
      role,
      text,
      timestamp: obj.timestamp || null,
    });
  }

  const assistantCount = messages.filter((m) => m.role === "assistant").length;
  const userCount = messages.filter((m) => m.role === "user").length;
  return { messages, sessionId, model, assistantCount, userCount };
}

function matchAssessment(runId, personaKey) {
  const dir = path.join("tests", runId, "assessments");
  if (!exists(dir)) return null;
  const files = listMarkdown(dir);
  if (!files.length) return null;

  const aliases = PERSONA_ALIASES[personaKey] || [personaKey];
  let best = null;
  let bestScore = 0;

  for (const file of files) {
    const lower = file.toLowerCase();
    let score = 0;
    for (const a of aliases) {
      if (lower.includes(a)) score += Math.max(a.length, 1);
    }
    if (score > bestScore) {
      bestScore = score;
      best = file;
    }
  }

  if (!best || bestScore === 0) return null;
  const relPath = path.join("tests", runId, "assessments", best);
  return {
    path: relPath.replace(/\\/g, "/"),
    text: readText(relPath),
  };
}

function buildEntries() {
  const entries = [];
  for (const run of RUNS) {
    const resultsDir = path.join("tests", run.id, "results");
    const files = listJsonl(resultsDir);
    for (const file of files) {
      const personaKey = derivePersonaKey(file);
      const personaLabel = PERSONA_LABELS[personaKey] || personaKey;
      const scenarioType = deriveScenarioType(run.id, file);
      const relJsonl = path.join(resultsDir, file).replace(/\\/g, "/");
      const parsed = parseJsonlMessages(relJsonl);
      const assessment = matchAssessment(run.id, personaKey);

      entries.push({
        id: `${run.id}/${file}`,
        runId: run.id,
        runLabel: run.label,
        runOrder: run.order,
        file: relJsonl,
        fileName: file,
        personaKey,
        personaLabel,
        scenarioType,
        sessionId: parsed.sessionId,
        model: parsed.model,
        userCount: parsed.userCount,
        assistantCount: parsed.assistantCount,
        messageCount: parsed.messages.length,
        messages: parsed.messages,
        summaries: run.summaries.map((s) => path.join("tests", run.id, s).replace(/\\/g, "/")),
        assessment,
      });
    }
  }
  return entries.sort((a, b) => {
    if (a.runOrder !== b.runOrder) return a.runOrder - b.runOrder;
    if (a.personaLabel !== b.personaLabel) return a.personaLabel.localeCompare(b.personaLabel);
    return a.fileName.localeCompare(b.fileName);
  });
}

function buildHtml(data) {
  const dataJson = JSON.stringify(data).replace(/<\/script/gi, "<\\/script");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sourcy ICP Eval Deep Dive</title>
  <style>
    :root {
      --bg: #f3efe5;
      --panel: #fffaf0;
      --ink: #1f2b2b;
      --muted: #637171;
      --line: #d7ccba;
      --brand: #0f6c5f;
      --brand2: #d77f35;
      --user: #eef7ff;
      --assistant: #edfff6;
      --shadow: 0 10px 28px rgba(20, 25, 27, 0.08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif;
      background:
        radial-gradient(800px 300px at 90% -20%, #ffd9b2 0%, transparent 70%),
        radial-gradient(900px 450px at -10% 0%, #bce4dc 0%, transparent 65%),
        var(--bg);
    }
    .wrap {
      max-width: 1320px;
      margin: 0 auto;
      padding: 16px;
    }
    .hero {
      background: linear-gradient(135deg, #143534 0%, #0f6c5f 50%, #28a38c 100%);
      color: #f3fffd;
      border-radius: 14px;
      padding: 16px;
      box-shadow: var(--shadow);
    }
    .hero h1 {
      margin: 0 0 6px;
      font-size: clamp(22px, 3vw, 31px);
    }
    .hero p {
      margin: 0;
      color: #def8f2;
    }
    .filters, .stats {
      margin-top: 12px;
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 8px;
    }
    .filters .field, .stat {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 10px;
      box-shadow: var(--shadow);
    }
    label {
      display: block;
      margin-bottom: 6px;
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      font-weight: 700;
    }
    select, input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid #c9beac;
      border-radius: 8px;
      font: inherit;
      background: #fffdf8;
      color: var(--ink);
    }
    .stat .v {
      font-size: 24px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
      color: var(--brand);
    }
    .stat .k {
      font-size: 12px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .main {
      margin-top: 12px;
      display: grid;
      grid-template-columns: 420px 1fr;
      gap: 10px;
      min-height: 72vh;
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 12px;
      box-shadow: var(--shadow);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .panel h2 {
      margin: 0;
      padding: 12px 14px;
      font-size: 17px;
      border-bottom: 1px solid var(--line);
      background: #f8f1e3;
    }
    .list {
      overflow: auto;
      padding: 8px;
    }
    .item {
      border: 1px solid #e4d9c8;
      border-radius: 10px;
      padding: 10px;
      cursor: pointer;
      background: #fffdf7;
    }
    .item + .item { margin-top: 8px; }
    .item.active {
      border-color: #8ecbc0;
      background: #eefcf7;
      box-shadow: inset 0 0 0 1px #8ecbc0;
    }
    .item .top {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 6px;
    }
    .item .persona {
      font-weight: 700;
      font-size: 15px;
    }
    .item .run {
      font-size: 12px;
      color: var(--muted);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .pill {
      display: inline-block;
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 999px;
      background: #edf1f1;
      color: #4d5b5b;
      margin-right: 4px;
      margin-bottom: 4px;
      border: 1px solid #d6dede;
    }
    .pill.core { background: #e9f6f2; color: #16685c; border-color: #b6e0d8; }
    .pill.test { background: #fff2e5; color: #91590f; border-color: #f2d6b6; }
    .detail {
      overflow: auto;
      padding: 12px;
    }
    .detail-head {
      border: 1px solid #e2d7c6;
      background: #fffdf7;
      border-radius: 10px;
      padding: 10px;
      margin-bottom: 10px;
    }
    .detail-head h3 {
      margin: 0 0 6px;
      font-size: 20px;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 8px;
      color: var(--muted);
      font-size: 13px;
      margin-bottom: 8px;
    }
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .links a {
      text-decoration: none;
      font-size: 12px;
      border: 1px solid #bad7d1;
      background: #ecf9f6;
      color: #0f4f47;
      border-radius: 999px;
      padding: 4px 9px;
      font-weight: 700;
    }
    .two-col {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 10px;
    }
    .box {
      border: 1px solid #e4dac9;
      border-radius: 10px;
      background: #fffdf8;
      overflow: hidden;
      min-height: 380px;
      display: flex;
      flex-direction: column;
    }
    .box h4 {
      margin: 0;
      padding: 10px 12px;
      border-bottom: 1px solid #e4dac9;
      background: #fbf4e8;
      font-size: 15px;
    }
    .box-body {
      padding: 10px;
      overflow: auto;
      flex: 1;
    }
    .msg {
      border: 1px solid #dce3e2;
      border-radius: 10px;
      padding: 8px;
      margin-bottom: 8px;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 14px;
      line-height: 1.4;
    }
    .msg .role {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 4px;
      color: #5f6e6d;
    }
    .msg.user { background: var(--user); }
    .msg.assistant { background: var(--assistant); }
    pre {
      margin: 0;
      font-family: "JetBrains Mono", "SFMono-Regular", ui-monospace, monospace;
      font-size: 12px;
      white-space: pre-wrap;
      line-height: 1.35;
    }
    .empty {
      color: var(--muted);
      font-size: 14px;
      padding: 20px;
      text-align: center;
    }
    code {
      font-family: "JetBrains Mono", "SFMono-Regular", ui-monospace, monospace;
      font-size: 12px;
      background: #f3f6f6;
      border: 1px solid #d9e1e1;
      border-radius: 6px;
      padding: 1px 5px;
    }
    @media (max-width: 1180px) {
      .main { grid-template-columns: 1fr; }
      .two-col { grid-template-columns: 1fr; }
    }
    @media (max-width: 860px) {
      .filters, .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 560px) {
      .filters, .stats { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <h1>ICP Eval Deep Dive</h1>
      <p>Drill into each version/persona with parsed conversation turns and available assessment notes.</p>
      <p style="margin-top:6px;">File: <code>icp_eval_deep_dive.html</code></p>
    </section>

    <section class="filters">
      <div class="field">
        <label for="runFilter">Version</label>
        <select id="runFilter"></select>
      </div>
      <div class="field">
        <label for="personaFilter">Persona</label>
        <select id="personaFilter"></select>
      </div>
      <div class="field">
        <label for="scenarioFilter">Scenario</label>
        <select id="scenarioFilter"></select>
      </div>
      <div class="field">
        <label for="hasAssessmentFilter">Assessment</label>
        <select id="hasAssessmentFilter">
          <option value="all">All</option>
          <option value="yes">With assessment</option>
          <option value="no">No assessment</option>
        </select>
      </div>
      <div class="field">
        <label for="searchInput">Search Text</label>
        <input id="searchInput" type="text" placeholder="e.g. budget, catalog, battery" />
      </div>
    </section>

    <section class="stats">
      <article class="stat">
        <div class="v" id="statTotal">0</div>
        <div class="k">Conversations</div>
      </article>
      <article class="stat">
        <div class="v" id="statVersions">0</div>
        <div class="k">Versions</div>
      </article>
      <article class="stat">
        <div class="v" id="statPersonas">0</div>
        <div class="k">Personas</div>
      </article>
      <article class="stat">
        <div class="v" id="statAssessments">0</div>
        <div class="k">Assessments</div>
      </article>
      <article class="stat">
        <div class="v" id="statMsgs">0</div>
        <div class="k">Visible Messages</div>
      </article>
    </section>

    <section class="main">
      <section class="panel">
        <h2>Conversation Index</h2>
        <div class="list" id="list"></div>
      </section>

      <section class="panel">
        <h2>Deep View</h2>
        <div class="detail" id="detail">
          <div class="empty">Select a conversation from the left list.</div>
        </div>
      </section>
    </section>
  </div>

  <script id="seed" type="application/json">${dataJson}</script>
  <script>
    (function () {
      var DATA = JSON.parse(document.getElementById("seed").textContent);
      var entries = DATA.entries || [];
      var currentId = null;

      var runFilter = document.getElementById("runFilter");
      var personaFilter = document.getElementById("personaFilter");
      var scenarioFilter = document.getElementById("scenarioFilter");
      var hasAssessmentFilter = document.getElementById("hasAssessmentFilter");
      var searchInput = document.getElementById("searchInput");
      var listEl = document.getElementById("list");
      var detailEl = document.getElementById("detail");

      function unique(arr) {
        return Array.from(new Set(arr));
      }

      function scenarioClass(type) {
        if (type.indexOf("test") >= 0) return "test";
        return "core";
      }

      function scenarioLabel(type) {
        return type.replace(/-/g, " ");
      }

      function fillSelect(select, values, defaultLabel) {
        select.innerHTML = "";
        var all = document.createElement("option");
        all.value = "all";
        all.textContent = defaultLabel;
        select.appendChild(all);
        values.forEach(function (v) {
          var op = document.createElement("option");
          op.value = v;
          op.textContent = v;
          select.appendChild(op);
        });
      }

      function bootFilters() {
        var runValues = unique(entries.map(function (e) { return e.runLabel; }));
        var personaValues = unique(entries.map(function (e) { return e.personaLabel; })).sort();
        var scenarioValues = unique(entries.map(function (e) { return e.scenarioType; })).sort();

        fillSelect(runFilter, runValues, "All versions");
        fillSelect(personaFilter, personaValues, "All personas");
        fillSelect(scenarioFilter, scenarioValues, "All scenarios");
      }

      function filteredEntries() {
        var runValue = runFilter.value;
        var personaValue = personaFilter.value;
        var scenarioValue = scenarioFilter.value;
        var assessValue = hasAssessmentFilter.value;
        var q = (searchInput.value || "").toLowerCase().trim();

        return entries.filter(function (e) {
          if (runValue !== "all" && e.runLabel !== runValue) return false;
          if (personaValue !== "all" && e.personaLabel !== personaValue) return false;
          if (scenarioValue !== "all" && e.scenarioType !== scenarioValue) return false;
          if (assessValue === "yes" && !e.assessment) return false;
          if (assessValue === "no" && !!e.assessment) return false;
          if (q) {
            var hay = (
              e.personaLabel + " " + e.runLabel + " " + e.fileName + " " +
              (e.assessment ? e.assessment.text : "") + " " +
              e.messages.map(function (m) { return m.text; }).join(" ")
            ).toLowerCase();
            if (hay.indexOf(q) < 0) return false;
          }
          return true;
        });
      }

      function setStats(rows) {
        document.getElementById("statTotal").textContent = String(rows.length);
        document.getElementById("statVersions").textContent = String(unique(rows.map(function (r) { return r.runLabel; })).length);
        document.getElementById("statPersonas").textContent = String(unique(rows.map(function (r) { return r.personaLabel; })).length);
        document.getElementById("statAssessments").textContent = String(rows.filter(function (r) { return !!r.assessment; }).length);
        var msgCount = rows.reduce(function (acc, r) { return acc + (r.messageCount || 0); }, 0);
        document.getElementById("statMsgs").textContent = String(msgCount);
      }

      function renderList(rows) {
        listEl.innerHTML = "";
        if (!rows.length) {
          var empty = document.createElement("div");
          empty.className = "empty";
          empty.textContent = "No conversations matched the current filters.";
          listEl.appendChild(empty);
          currentId = null;
          detailEl.innerHTML = '<div class="empty">No details to show.</div>';
          return;
        }

        if (!currentId || !rows.some(function (r) { return r.id === currentId; })) {
          currentId = rows[0].id;
        }

        rows.forEach(function (e) {
          var div = document.createElement("div");
          div.className = "item" + (e.id === currentId ? " active" : "");
          div.dataset.id = e.id;

          var top = document.createElement("div");
          top.className = "top";
          var persona = document.createElement("div");
          persona.className = "persona";
          persona.textContent = e.personaLabel;
          var run = document.createElement("div");
          run.className = "run";
          run.textContent = e.runLabel;
          top.appendChild(persona);
          top.appendChild(run);
          div.appendChild(top);

          var pills = document.createElement("div");
          var p1 = document.createElement("span");
          p1.className = "pill " + scenarioClass(e.scenarioType);
          p1.textContent = scenarioLabel(e.scenarioType);
          pills.appendChild(p1);

          var p2 = document.createElement("span");
          p2.className = "pill";
          p2.textContent = e.messageCount + " msgs";
          pills.appendChild(p2);

          var p3 = document.createElement("span");
          p3.className = "pill";
          p3.textContent = e.assessment ? "assessment" : "no assessment";
          pills.appendChild(p3);
          div.appendChild(pills);

          var file = document.createElement("div");
          file.style.marginTop = "6px";
          file.style.color = "var(--muted)";
          file.style.fontSize = "12px";
          file.textContent = e.fileName;
          div.appendChild(file);

          div.addEventListener("click", function () {
            currentId = e.id;
            render(rows);
          });
          listEl.appendChild(div);
        });
      }

      function tag(text) {
        var s = document.createElement("span");
        s.className = "pill";
        s.textContent = text;
        return s;
      }

      function renderDetail(entry) {
        if (!entry) {
          detailEl.innerHTML = '<div class="empty">Select a conversation from the left list.</div>';
          return;
        }

        detailEl.innerHTML = "";

        var head = document.createElement("div");
        head.className = "detail-head";

        var h3 = document.createElement("h3");
        h3.textContent = entry.personaLabel + " (" + entry.runLabel + ")";
        head.appendChild(h3);

        var meta = document.createElement("div");
        meta.className = "meta";
        meta.appendChild(tag("scenario: " + scenarioLabel(entry.scenarioType)));
        meta.appendChild(tag("messages: " + entry.messageCount));
        if (entry.sessionId) meta.appendChild(tag("session: " + entry.sessionId));
        if (entry.model) meta.appendChild(tag(entry.model));
        head.appendChild(meta);

        var links = document.createElement("div");
        links.className = "links";

        var raw = document.createElement("a");
        raw.href = entry.file;
        raw.textContent = "Raw JSONL";
        links.appendChild(raw);

        entry.summaries.forEach(function (s) {
          var a = document.createElement("a");
          a.href = s;
          a.textContent = "Run Summary";
          links.appendChild(a);
        });

        if (entry.assessment) {
          var as = document.createElement("a");
          as.href = entry.assessment.path;
          as.textContent = "Assessment";
          links.appendChild(as);
        }
        head.appendChild(links);
        detailEl.appendChild(head);

        var two = document.createElement("div");
        two.className = "two-col";

        var convoBox = document.createElement("section");
        convoBox.className = "box";
        convoBox.innerHTML = '<h4>Conversation Turns</h4>';
        var convoBody = document.createElement("div");
        convoBody.className = "box-body";
        if (!entry.messages.length) {
          var empty = document.createElement("div");
          empty.className = "empty";
          empty.textContent = "No parsed text messages in this file.";
          convoBody.appendChild(empty);
        } else {
          entry.messages.forEach(function (m, i) {
            var msg = document.createElement("div");
            msg.className = "msg " + m.role;
            var role = document.createElement("div");
            role.className = "role";
            role.textContent = (i + 1) + ". " + m.role;
            var body = document.createElement("div");
            body.textContent = m.text;
            msg.appendChild(role);
            msg.appendChild(body);
            convoBody.appendChild(msg);
          });
        }
        convoBox.appendChild(convoBody);
        two.appendChild(convoBox);

        var assessBox = document.createElement("section");
        assessBox.className = "box";
        assessBox.innerHTML = "<h4>Assessment Notes</h4>";
        var assessBody = document.createElement("div");
        assessBody.className = "box-body";
        if (!entry.assessment) {
          var none = document.createElement("div");
          none.className = "empty";
          none.textContent = "No assessment markdown found for this run/persona.";
          assessBody.appendChild(none);
        } else {
          var pre = document.createElement("pre");
          pre.textContent = entry.assessment.text;
          assessBody.appendChild(pre);
        }
        assessBox.appendChild(assessBody);
        two.appendChild(assessBox);

        detailEl.appendChild(two);
      }

      function render(rows) {
        setStats(rows);
        renderList(rows);
        var current = rows.find(function (r) { return r.id === currentId; }) || rows[0];
        renderDetail(current);
      }

      function wire() {
        [runFilter, personaFilter, scenarioFilter, hasAssessmentFilter, searchInput].forEach(function (el) {
          el.addEventListener("input", function () {
            render(filteredEntries());
          });
          el.addEventListener("change", function () {
            render(filteredEntries());
          });
        });
      }

      bootFilters();
      wire();
      render(filteredEntries());
    })();
  </script>
</body>
</html>
`;
}

function main() {
  const entries = buildEntries();
  const output = {
    generatedAt: new Date().toISOString(),
    entryCount: entries.length,
    entries,
  };

  const html = buildHtml(output);
  const outPath = path.join(ROOT, "icp_eval_deep_dive.html");
  fs.writeFileSync(outPath, html, "utf8");
  console.log(`Wrote ${entries.length} conversations to ${outPath}`);
}

main();
