#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const CASES_INPUT = path.join(ROOT, "tests", "golden-eugene-v1", "cases.seed.json");
const TRANSCRIPTS_INPUT = path.join(ROOT, "tests", "golden-eugene-v1", "transcripts.seed.json");
const EVAL_COMPARISON_INPUT = path.join(ROOT, "tests", "golden-eugene-v1", "eval_comparison.seed.json");
const OUTPUT = path.join(ROOT, "golden_dataset_review.html");

const AWSAF_PRIORITY = [];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function countBy(items, key) {
  const out = {};
  for (const i of items) out[i[key]] = (out[i[key]] || 0) + 1;
  return out;
}

function sortedKeys(obj) {
  return Object.keys(obj).sort((a, b) => a.localeCompare(b));
}

function buildMatrix(items, rowKey, colKey) {
  const rows = sortedKeys(countBy(items, rowKey));
  const cols = sortedKeys(countBy(items, colKey));
  const values = {};

  for (const r of rows) {
    values[r] = {};
    for (const c of cols) values[r][c] = 0;
  }
  for (const item of items) {
    if (!values[item[rowKey]]) values[item[rowKey]] = {};
    values[item[rowKey]][item[colKey]] = (values[item[rowKey]][item[colKey]] || 0) + 1;
  }
  return { rows, cols, values };
}

function indexTranscripts(transcripts) {
  const byCase = {};
  for (const t of transcripts) {
    if (!byCase[t.case_id]) byCase[t.case_id] = [];
    byCase[t.case_id].push(t);
  }
  return byCase;
}

function buildPayload(casesData, transcriptsData, evalComparisonData) {
  const cases = casesData.cases || [];
  const checks = casesData.check_definitions || [];
  const transcripts = transcriptsData.transcripts || [];
  const transcriptsByCase = indexTranscripts(transcripts);

  const priorityByCase = Object.fromEntries(
    AWSAF_PRIORITY.map((p) => [p.case_id, p])
  );

  const casesEnriched = cases.map((c) => {
    const { owner, ...caseWithoutOwner } = c;
    const linked = transcriptsByCase[c.case_id] || [];
    return {
      ...caseWithoutOwner,
      linked_transcripts: linked,
      linked_transcript_count: linked.length,
      awsaf_priority_stars: 0,
      awsaf_priority_reason: ""
    };
  });

  const coverage = {
    behavior_bucket: countBy(casesEnriched, "behavior_bucket"),
    persona_type: countBy(casesEnriched, "persona_type"),
    motivation: countBy(casesEnriched, "motivation"),
    product_mode: countBy(casesEnriched, "product_mode"),
    input_mode: countBy(casesEnriched, "input_mode"),
    risk_class: countBy(casesEnriched, "risk_class"),
    expected_endpoint: countBy(casesEnriched, "expected_endpoint"),
    review_status: countBy(casesEnriched, "review_status")
  };

  const matrix = buildMatrix(casesEnriched, "persona_type", "product_mode");

  const priorityList = AWSAF_PRIORITY.map((p) => {
    const c = casesEnriched.find((x) => x.case_id === p.case_id);
    return c
      ? {
          case_id: c.case_id,
          title: c.title,
          stars: p.stars,
          reason: p.reason,
          expected_endpoint: c.expected_endpoint,
          review_status: c.review_status,
          linked_transcript_count: c.linked_transcript_count
        }
      : null;
  }).filter(Boolean);

  const toolCalls = transcripts.reduce(
    (acc, t) => acc + (t.steps || []).filter((s) => s.type === "tool_call").length,
    0
  );

  return {
    dataset_name: casesData.dataset_name,
    version: casesData.version,
    generated_for: casesData.generated_for,
    cases: casesEnriched,
    checks,
    eval_comparison: evalComparisonData || null,
    coverage,
    matrix,
    transcripts_count: transcripts.length,
    transcripts_tool_calls: toolCalls,
    priority_list: priorityList
  };
}

function buildHtml(payload) {
  const json = JSON.stringify(payload).replace(/<\/script/gi, "<\\/script");
  const comp = null;
  let evalSection = "";
  if (comp && Array.isArray(comp.groups) && comp.groups.length >= 2) {
    const [awsaf, eric] = comp.groups;
    const delta = Math.round(((awsaf.average || 0) - (eric.average || 0)) * 100) / 100;
    const rows = [...(awsaf.items || []), ...(eric.items || [])]
      .map((x) => {
        const grp = (awsaf.items || []).includes(x) ? "Awsaf" : "Eric";
        const passTag = x.pass ? "<span class='tag locked'>pass</span>" : "<span class='tag reviewed'>fail</span>";
        return (
          "<tr>" +
          "<td>" + grp + "</td>" +
          "<td>" + x.id + "</td>" +
          "<td>" + x.title + "</td>" +
          "<td>" + x.average + "</td>" +
          "<td>" + passTag + "</td>" +
          "<td>" + (x.mode || "") + "</td>" +
          "</tr>"
        );
      })
      .join("");
    evalSection =
      "<h2>Eval Example (Awsaf 5 vs Eric 6)</h2>" +
      "<section class='grid-2'>" +
      "<article class='card'><h3 style='margin:0 0 8px;'>Awsaf Transcript Set</h3>" +
      "<p style='margin:0 0 6px; color:#4c5959;'><strong>Count:</strong> " + awsaf.count + " | <strong>Avg:</strong> " + awsaf.average + "/10 | <strong>Pass rate:</strong> " + awsaf.pass_rate + "%</p>" +
      "<p style='margin:0; color:#4c5959; font-size:13px;'>Source: " + awsaf.source + "</p></article>" +
      "<article class='card'><h3 style='margin:0 0 8px;'>Eric Chat Examples</h3>" +
      "<p style='margin:0 0 6px; color:#4c5959;'><strong>Count:</strong> " + eric.count + " | <strong>Avg:</strong> " + eric.average + "/10 | <strong>Pass rate:</strong> " + eric.pass_rate + "%</p>" +
      "<p style='margin:0; color:#4c5959; font-size:13px;'>Source: " + eric.source + "</p></article>" +
      "</section>" +
      "<section class='card' style='margin-top:10px;'>" +
      "<strong>Current comparison delta:</strong> Awsaf minus Eric = " + delta + " points (threshold 7.0)." +
      "<div style='font-size:12px; color:#5c6969; margin-top:6px;'>Judge mode: " + comp.judge_mode + "</div>" +
      "<div style='font-size:12px; color:#5c6969;'>Prompt template: " + comp.prompt_file + "</div>" +
      "</section>" +
      "<div class='table-wrap' style='margin-top:10px;'><table><thead><tr><th>Set</th><th>ID</th><th>Example</th><th>Avg Score</th><th>Pass</th><th>Score Mode</th></tr></thead><tbody>" + rows + "</tbody></table></div>";
  }
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Golden Review (Cases + Transcripts) - Eugene V1</title>
  <style>
    :root {
      --bg: #f3efe5;
      --panel: #fffaf0;
      --line: #d7ccba;
      --ink: #1f2b2b;
      --muted: #5f6d6d;
      --brand: #126d60;
      --ok: #2f8e45;
      --warn: #b87400;
      --draft: #7a8690;
      --star: #d8832f;
      --shadow: 0 10px 30px rgba(20, 25, 27, 0.08);
      --user: #ecf5ff;
      --assistant: #ebfff5;
      --system: #fff7e9;
      --thinking: #f2f4f6;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif;
      background:
        radial-gradient(860px 300px at 90% -15%, #ffd9b2 0%, transparent 70%),
        radial-gradient(1000px 450px at -10% 0%, #bfe5dd 0%, transparent 65%),
        var(--bg);
    }
    .wrap { max-width: 1380px; margin: 0 auto; padding: 16px; }
    .hero {
      border-radius: 14px;
      background: linear-gradient(135deg, #143534 0%, #126d60 50%, #28a38c 100%);
      color: #f3fffc;
      box-shadow: var(--shadow);
      padding: 16px;
    }
    .hero h1 { margin: 0 0 6px; font-size: clamp(22px, 3vw, 33px); }
    .hero p { margin: 0; color: #ddf9f3; font-size: 14px; }
    .kpis {
      margin-top: 12px;
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 8px;
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 10px;
      box-shadow: var(--shadow);
      padding: 10px;
    }
    .kpi .num { font-size: 24px; font-weight: 700; color: var(--brand); line-height: 1; margin-bottom: 4px; }
    .kpi .label {
      font-size: 12px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.7px;
      font-weight: 700;
    }
    h2 { margin: 18px 0 8px; font-size: 18px; }
    .tag {
      display: inline-block;
      font-size: 11px;
      border-radius: 999px;
      border: 1px solid #d6dede;
      background: #edf1f1;
      color: #4c5959;
      padding: 2px 8px;
      margin-right: 4px;
      margin-bottom: 4px;
    }
    .tag.locked { background: #e8f7eb; border-color: #bde3c5; color: var(--ok); }
    .tag.reviewed { background: #fff4e6; border-color: #f0d6b7; color: var(--warn); }
    .tag.draft { background: #eff2f4; border-color: #d5dde3; color: var(--draft); }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .heat-wrap, .table-wrap {
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 10px;
      background: var(--panel);
    }
    table {
      border-collapse: collapse;
      width: 100%;
      min-width: 760px;
    }
    th, td {
      border-bottom: 1px solid var(--line);
      border-right: 1px solid var(--line);
      padding: 8px 10px;
      font-size: 13px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #ecf8f5;
      font-weight: 700;
      color: #173635;
    }
    tr:last-child td { border-bottom: 0; }
    tr td:last-child, tr th:last-child { border-right: 0; }
    .filters {
      margin-top: 8px;
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 8px;
    }
    .field {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 10px;
      box-shadow: var(--shadow);
      padding: 8px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      color: var(--muted);
      font-weight: 700;
    }
    select, input {
      width: 100%;
      border: 1px solid #ccc0ad;
      border-radius: 8px;
      padding: 8px;
      background: #fffdf8;
      font: inherit;
      color: var(--ink);
    }
    .main {
      margin-top: 10px;
      display: grid;
      grid-template-columns: 440px 1fr;
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
    .panel h3 {
      margin: 0;
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      background: #f8f2e5;
      font-size: 16px;
    }
    .case-list { overflow: auto; padding: 8px; }
    .case-item {
      border: 1px solid #e3d8c8;
      border-radius: 10px;
      padding: 9px;
      background: #fffdf8;
      cursor: pointer;
    }
    .case-item + .case-item { margin-top: 8px; }
    .case-item.active {
      border-color: #8dcbbf;
      box-shadow: inset 0 0 0 1px #8dcbbf;
      background: #eefbf7;
    }
    .case-item .t { font-size: 14px; font-weight: 700; margin-bottom: 5px; }
    .case-item .meta { font-size: 12px; color: var(--muted); margin-bottom: 6px; }
    .detail { overflow: auto; padding: 10px; }
    .detail-head {
      border: 1px solid #e3d8c8;
      border-radius: 10px;
      background: #fffdf8;
      padding: 10px;
      margin-bottom: 10px;
    }
    .detail-head h4 { margin: 0 0 6px; font-size: 20px; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .box {
      border: 1px solid #e4dac9;
      border-radius: 10px;
      background: #fffdf8;
      overflow: hidden;
    }
    .box h5 {
      margin: 0;
      border-bottom: 1px solid #e4dac9;
      background: #fbf4e8;
      padding: 8px 10px;
      font-size: 14px;
    }
    .box .body {
      padding: 8px 10px;
      font-size: 13px;
      color: #263131;
    }
    .list-tight { margin: 0; padding-left: 16px; }
    .list-tight li + li { margin-top: 3px; }
    .check {
      display: inline-block;
      margin: 3px 4px 3px 0;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid #d9e1df;
      background: #eef5f3;
      font-size: 11px;
      color: #3c4d4c;
    }
    .timeline-wrap { margin-top: 10px; }
    .timeline-card {
      border: 1px solid #e3d8c8;
      border-radius: 10px;
      background: #fffdf8;
      padding: 10px;
      margin-bottom: 8px;
    }
    .timeline-title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .transcript-legend {
      margin: 8px 0 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .legend-pill {
      border: 1px solid #d8dedc;
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 11px;
      color: #41504f;
      background: #f0f4f3;
    }
    .legend-pill.user { background: var(--user); }
    .legend-pill.assistant { background: var(--assistant); }
    .legend-pill.internal { background: var(--system); }
    .legend-pill.thinking { background: var(--thinking); }
    .chat-line {
      display: flex;
      margin-bottom: 8px;
    }
    .chat-line.user { justify-content: flex-end; }
    .chat-line.assistant { justify-content: flex-start; }
    .chat-line.internal { justify-content: flex-start; }
    .chat-bubble {
      max-width: 80%;
      border: 1px solid #dfe5e3;
      border-radius: 12px;
      padding: 8px;
      font-size: 13px;
      line-height: 1.36;
      white-space: pre-wrap;
      background: #fff;
    }
    .chat-bubble.user { background: var(--user); border-color: #c9ddef; }
    .chat-bubble.assistant { background: var(--assistant); border-color: #cae6d9; }
    .internal-card {
      width: 100%;
      border: 1px solid #dfe5e3;
      border-radius: 10px;
      padding: 8px;
      font-size: 13px;
      line-height: 1.36;
      white-space: pre-wrap;
      background: var(--system);
    }
    .internal-card.thinking { background: var(--thinking); }
    .internal-card.transition { background: #f6f1e6; }
    .chat-head {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      font-weight: 700;
      color: #5d6a69;
      margin-bottom: 4px;
    }
    .ui-preview {
      margin-top: 7px;
      border: 1px dashed #c6d1cf;
      border-radius: 8px;
      background: #f8fbfa;
      padding: 6px 8px;
      font-size: 12px;
      color: #344242;
    }
    .ui-preview-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      font-weight: 700;
      color: #506160;
      margin-bottom: 4px;
    }
    .empty {
      padding: 18px;
      color: var(--muted);
      text-align: center;
      font-size: 14px;
    }
    @media (max-width: 1200px) {
      .main { grid-template-columns: 1fr; }
      .cols, .grid-2 { grid-template-columns: 1fr; }
    }
    @media (max-width: 960px) {
      .filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 560px) {
      .filters, .kpis { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <h1>Golden Review (Cases + Transcripts)</h1>
      <p id="heroMeta"></p>
    </section>

    <section class="kpis">
      <article class="card kpi"><div class="num" id="kCases">0</div><div class="label">Total Cases</div></article>
      <article class="card kpi"><div class="num" id="kTranscripts">0</div><div class="label">Transcripts</div></article>
      <article class="card kpi"><div class="num" id="kLinked">0</div><div class="label">Cases With Transcript</div></article>
      <article class="card kpi"><div class="num" id="kLocked">0</div><div class="label">Ready For Eval</div></article>
      <article class="card kpi"><div class="num" id="kDraft">0</div><div class="label">Needs Definition</div></article>
      <article class="card kpi"><div class="num" id="kToolCalls">0</div><div class="label">Transcript Tool Calls</div></article>
    </section>

    <section class="card" style="margin-top:10px;">
      <strong>Review Links:</strong>
      <a href="golden_eval_review.html" style="margin-left:8px;">Eval Framework + Eric Results</a>
      <a href="icp_eval_dashboard.html" style="margin-left:10px;">Eric Summary</a>
      <span style="margin-left:10px; font-size:13px; color:#596666;">All comparative scoring is centralized in <code>golden_eval_review.html</code>.</span>
    </section>

    ${evalSection}

    <h2>Coverage Overview</h2>
    <div class="grid-2">
      <section class="card">
        <h3 style="margin:0 0 8px;">By Behavior Bucket (B1-B6)</h3>
        <div id="coverageSegment"></div>
      </section>
      <section class="card">
        <h3 style="margin:0 0 8px;">By Endpoint</h3>
        <div id="coverageEndpoint"></div>
      </section>
    </div>

    <h2>Coverage Heatmap (Persona Type x Product Mode)</h2>
    <div class="heat-wrap"><table id="heatTable"></table></div>

    <h2>Case Catalog</h2>
    <section class="filters">
      <div class="field"><label for="fBucket">Behavior Bucket</label><select id="fBucket"></select></div>
      <div class="field"><label for="fChannel">Channel</label><select id="fChannel"></select></div>
      <div class="field"><label for="fPersona">Persona Type</label><select id="fPersona"></select></div>
      <div class="field"><label for="fMotivation">Motivation</label><select id="fMotivation"></select></div>
      <div class="field"><label for="fProductMode">Product Mode</label><select id="fProductMode"></select></div>
      <div class="field"><label for="fRisk">Risk Class</label><select id="fRisk"></select></div>
      <div class="field"><label for="fStatus">Review Status</label><select id="fStatus"></select></div>
      <div class="field"><label for="fTranscript">Transcript Link</label><select id="fTranscript"></select></div>
      <div class="field"><label for="fSearch">Search</label><input id="fSearch" placeholder="case id, title, notes"/></div>
    </section>

    <section class="main">
      <section class="panel">
        <h3>Case List</h3>
        <div id="caseList" class="case-list"></div>
      </section>
      <section class="panel">
        <h3>Case + Transcript Detail</h3>
        <div id="caseDetail" class="detail"><div class="empty">Select a case to inspect details.</div></div>
      </section>
    </section>

    <h2>Acceptance Criteria Catalog</h2>
    <div class="table-wrap"><table id="checkTable"></table></div>

    <h2>Case Review Board</h2>
    <div class="table-wrap"><table id="signoffTable"></table></div>
  </div>

  <script id="seed" type="application/json">${json}</script>
  <script>
    (function () {
      const data = JSON.parse(document.getElementById("seed").textContent);
      const cases = data.cases || [];
      const checks = data.checks || [];
      const priority = data.priority_list || [];
      const checkMap = Object.fromEntries(checks.map((c) => [c.id, c.title]));
      let currentId = null;

      const caseListEl = document.getElementById("caseList");
      const caseDetailEl = document.getElementById("caseDetail");
      const heroMeta = document.getElementById("heroMeta");
      const fBucket = document.getElementById("fBucket");
      const fChannel = document.getElementById("fChannel");
      const fPersona = document.getElementById("fPersona");
      const fMotivation = document.getElementById("fMotivation");
      const fProductMode = document.getElementById("fProductMode");
      const fRisk = document.getElementById("fRisk");
      const fStatus = document.getElementById("fStatus");
      const fTranscript = document.getElementById("fTranscript");
      const fSearch = document.getElementById("fSearch");

      const BUCKET_LABELS = {
        B1: "B1 - Budget/Qty",
        B2: "B2 - Vague/No Specs",
        B3: "B3 - Qualified",
        B4: "B4 - Restricted",
        B5: "B5 - Branded/IP",
        B6: "B6 - Ghost",
      };

      function uniq(values) {
        return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
      }

      function fillSelect(el, values, allLabel) {
        el.innerHTML = "";
        const all = document.createElement("option");
        all.value = "all";
        all.textContent = allLabel;
        el.appendChild(all);
        values.forEach((v) => {
          const op = document.createElement("option");
          op.value = v;
          op.textContent = v;
          el.appendChild(op);
        });
      }

      function statusClass(status) {
        if (status === "locked") return "locked";
        if (status === "reviewed") return "reviewed";
        return "draft";
      }

      function statusLabel(status) {
        if (status === "locked") return "Ready for eval";
        if (status === "reviewed") return "Needs team decision";
        return "Needs definition";
      }

      function renderCoverage(id, obj) {
        const el = document.getElementById(id);
        el.innerHTML = "";
        Object.keys(obj).sort((a, b) => a.localeCompare(b)).forEach((k) => {
          const span = document.createElement("span");
          span.className = "tag";
          span.textContent = k + ": " + obj[k];
          el.appendChild(span);
        });
      }

      function renderHeatTable() {
        const m = data.matrix;
        const table = document.getElementById("heatTable");
        table.innerHTML = "";
        const thead = document.createElement("thead");
        const trh = document.createElement("tr");
        const th0 = document.createElement("th");
        th0.textContent = "persona_type";
        trh.appendChild(th0);
        m.cols.forEach((c) => {
          const th = document.createElement("th");
          th.textContent = c;
          trh.appendChild(th);
        });
        thead.appendChild(trh);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        m.rows.forEach((r) => {
          const tr = document.createElement("tr");
          const td0 = document.createElement("td");
          td0.textContent = r;
          tr.appendChild(td0);
          m.cols.forEach((c) => {
            const td = document.createElement("td");
            td.textContent = String((m.values[r] && m.values[r][c]) || 0);
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
      }

      function renderChecksTable() {
        const t = document.getElementById("checkTable");
        t.innerHTML = "";
        const thead = document.createElement("thead");
        thead.innerHTML = "<tr><th>ID</th><th>Title</th><th>Severity</th><th>Description</th></tr>";
        t.appendChild(thead);
        const tbody = document.createElement("tbody");
        checks.forEach((ch) => {
          const tr = document.createElement("tr");
          tr.innerHTML =
            "<td>" + ch.id + "</td>" +
            "<td>" + ch.title + "</td>" +
            "<td>" + ch.severity + "</td>" +
            "<td>" + ch.description + "</td>";
          tbody.appendChild(tr);
        });
        t.appendChild(tbody);
      }

      function renderSignoffTable() {
        const t = document.getElementById("signoffTable");
        t.innerHTML = "";
        const thead = document.createElement("thead");
        thead.innerHTML = "<tr><th>Case ID</th><th>Title</th><th>Status</th><th>Expected Endpoint</th><th>Linked Transcripts</th><th>Review Notes</th></tr>";
        t.appendChild(thead);
        const tbody = document.createElement("tbody");
        cases.forEach((c) => {
          const tr = document.createElement("tr");
          tr.innerHTML =
            "<td>" + c.case_id + "</td>" +
            "<td>" + c.title + "</td>" +
            "<td><span class='tag " + statusClass(c.review_status) + "'>" + statusLabel(c.review_status) + "</span></td>" +
            "<td>" + c.expected_endpoint + "</td>" +
            "<td>" + c.linked_transcript_count + "</td>" +
            "<td>" + c.review_notes + "</td>";
          tbody.appendChild(tr);
        });
        t.appendChild(tbody);
      }

      function filteredCases() {
        const q = (fSearch.value || "").toLowerCase().trim();
        return cases.filter((c) => {
          if (fBucket.value !== "all" && c.behavior_bucket !== fBucket.value) return false;
          if (fChannel.value !== "all" && c.channel !== fChannel.value) return false;
          if (fPersona.value !== "all" && c.persona_type !== fPersona.value) return false;
          if (fMotivation.value !== "all" && c.motivation !== fMotivation.value) return false;
          if (fProductMode.value !== "all" && c.product_mode !== fProductMode.value) return false;
          if (fRisk.value !== "all" && c.risk_class !== fRisk.value) return false;
          if (fStatus.value !== "all" && c.review_status !== fStatus.value) return false;
          if (fTranscript.value === "with" && c.linked_transcript_count === 0) return false;
          if (fTranscript.value === "without" && c.linked_transcript_count > 0) return false;
          if (q) {
            const hay = (c.case_id + " " + c.title + " " + c.review_notes + " " + c.expected_endpoint).toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });
      }

      function renderCaseList(rows) {
        caseListEl.innerHTML = "";
        if (!rows.length) {
          caseListEl.innerHTML = "<div class='empty'>No cases match current filters.</div>";
          caseDetailEl.innerHTML = "<div class='empty'>No case selected.</div>";
          currentId = null;
          return;
        }

        if (!currentId || !rows.some((r) => r.case_id === currentId)) currentId = rows[0].case_id;

        rows.forEach((c) => {
          const div = document.createElement("div");
          div.className = "case-item" + (c.case_id === currentId ? " active" : "");
          div.innerHTML =
            "<div class='t'>" + c.case_id + " - " + c.title + "</div>" +
            "<div class='meta'>" + c.persona_type + " | " + c.motivation + " | " + c.expected_endpoint + "</div>" +
            "<span class='tag' style='background:#e0e7ff;color:#3730a3;font-weight:600'>" + (BUCKET_LABELS[c.behavior_bucket] || c.behavior_bucket) + "</span>" +
            "<span class='tag " + statusClass(c.review_status) + "'>" + statusLabel(c.review_status) + "</span>" +
            "<span class='tag'>" + c.risk_class + "</span>" +
            "<span class='tag'>" + c.input_mode + "</span>" +
            "<span class='tag'>transcripts: " + c.linked_transcript_count + "</span>";
          div.addEventListener("click", function () {
            currentId = c.case_id;
            render(rows);
          });
          caseListEl.appendChild(div);
        });
      }

      function renderChecks(ids) {
        if (!ids || !ids.length) return "<span class='tag'>none</span>";
        return ids.map((id) => "<span class='check' title='" + (checkMap[id] || "") + "'>" + id + " - " + (checkMap[id] || "Unknown check") + "</span>").join("");
      }

      function stepBody(s) {
        return s.text || s.input_summary || s.output_summary || s.state_update || "";
      }

      function toolUiHints(s) {
        const tool = s.tool || "";
        const stage = (s.stage || "").toLowerCase();
        if (tool === "productIntelligence") {
          if (stage.startsWith("stage1")) {
            return [
              "Chip selector appears with 3-4 groups (example: Material, Branding, Color).",
              "User can tap chips or type custom preferences."
            ];
          }
          return [
            "Spec card appears with product specs and MOQ guidance.",
            "Sourcy difference summary appears for quick positioning."
          ];
        }
        if (tool === "pricingIntelligence") {
          return [
            "Price comparison card appears: Alibaba FOB, landed, Sourcy DDP.",
            "Cost tips appear with actionable savings ideas.",
            "Reference listing links appear for market anchoring."
          ];
        }
        if (tool === "visualConceptGeneration") {
          return [
            "Visual gallery appears with 3 concepts (image + label + short description).",
            "User picks one concept to continue to Stage 3."
          ];
        }
        if (tool === "feasibilityAssessment") {
          return [
            "Feasibility card appears with status (green/yellow/red) and rationale.",
            "Post-feasibility actions appear: Add another product or Finalize request."
          ];
        }
        return [];
      }

      function messageUiHints(s) {
        const txt = (s.text || "").toLowerCase();
        if (s.actor !== "assistant") return [];
        if (txt.includes("do you have a reference image")) {
          return ["Next user action expected: upload reference image or type skip."];
        }
        if (txt.includes("here are common options for this product")) {
          return [
            "Customization chips are visible for quick selection.",
            "User can continue by confirming customizations."
          ];
        }
        if (txt.includes("pick a visual concept below")) {
          return ["Visual gallery is visible; one concept must be selected before refinement."];
        }
        if (txt.includes("fill in the details below to refine")) {
          return [
            "Structured refinement form appears.",
            "Fields shown: Quantity, Destination, Timeline."
          ];
        }
        if (txt.includes("want to add another product") || txt.includes("ready to finalize")) {
          return ["Two action buttons are shown: Add another product or Finalize request."];
        }
        if (txt.includes("let's finalize") && txt.includes("fill in your details below")) {
          return ["Contact form appears with Name, Email, Company, and Phone."];
        }
        return [];
      }

      function appendHints(parent, title, hints) {
        if (!hints || !hints.length) return;
        const box = document.createElement("div");
        box.className = "ui-preview";
        const head = document.createElement("div");
        head.className = "ui-preview-title";
        head.textContent = title;
        box.appendChild(head);
        const list = document.createElement("ul");
        list.className = "list-tight";
        hints.forEach((h) => {
          const li = document.createElement("li");
          li.textContent = h;
          list.appendChild(li);
        });
        box.appendChild(list);
        parent.appendChild(box);
      }

      function renderTranscriptStep(s) {
        const isUserMessage = s.type === "message" && s.actor === "user";
        const isAssistantMessage = s.type === "message" && s.actor === "assistant";
        const bodyText = stepBody(s);
        const line = document.createElement("div");

        if (isUserMessage || isAssistantMessage) {
          line.className = "chat-line " + (isUserMessage ? "user" : "assistant");
          const bubble = document.createElement("div");
          bubble.className = "chat-bubble " + (isUserMessage ? "user" : "assistant");
          const head = document.createElement("div");
          head.className = "chat-head";
          head.textContent =
            "#" + s.seq + " | " + s.stage + " | " + (isUserMessage ? "User message" : "Assistant message");
          const body = document.createElement("div");
          body.textContent = bodyText;
          bubble.appendChild(head);
          bubble.appendChild(body);
          appendHints(bubble, "UI After This Message", messageUiHints(s));
          line.appendChild(bubble);
          return line;
        }

        line.className = "chat-line internal";
        const card = document.createElement("div");
        card.className = "internal-card";
        if (s.type === "thinking") card.className += " thinking";
        if (s.type === "state_transition") card.className += " transition";

        const head = document.createElement("div");
        head.className = "chat-head";
        if (s.type === "tool_call") {
          head.textContent = "#" + s.seq + " | " + s.stage + " | Bot internal tool call | " + s.tool;
        } else if (s.type === "tool_result") {
          head.textContent = "#" + s.seq + " | " + s.stage + " | Tool result snapshot | " + s.tool;
        } else if (s.type === "thinking") {
          head.textContent = "#" + s.seq + " | " + s.stage + " | Assistant reasoning bridge";
        } else if (s.type === "state_transition") {
          head.textContent = "#" + s.seq + " | " + s.stage + " | System state transition";
        } else {
          head.textContent = "#" + s.seq + " | " + s.stage + " | " + s.actor + " | " + s.type;
        }

        const body = document.createElement("div");
        body.textContent = bodyText;
        card.appendChild(head);
        card.appendChild(body);

        if (s.type === "tool_call" || s.type === "tool_result") {
          appendHints(card, "What User Sees From This Tool", toolUiHints(s));
        }
        if (s.type === "state_transition") {
          appendHints(card, "UI Transition", ["Progress/stage state updates after this transition."]);
        }
        line.appendChild(card);
        return line;
      }

      function renderTranscript(t) {
        const wrap = document.createElement("article");
        wrap.className = "timeline-card";
        wrap.innerHTML =
          "<div class='timeline-title'>" + t.transcript_id + " - " + t.title + "</div>" +
          "<span class='tag'>" + t.profile_band + "</span>" +
          "<span class='tag'>" + t.expected_endpoint + "</span>";

        const goal = document.createElement("div");
        goal.style.margin = "8px 0";
        goal.style.fontSize = "13px";
        goal.style.color = "#4c5959";
        goal.innerHTML = "<strong>Goal:</strong> " + t.goal;
        wrap.appendChild(goal);

        const legend = document.createElement("div");
        legend.className = "transcript-legend";
        legend.innerHTML =
          "<span class='legend-pill user'>User message</span>" +
          "<span class='legend-pill assistant'>Assistant message</span>" +
          "<span class='legend-pill internal'>Bot internal tools</span>" +
          "<span class='legend-pill thinking'>Assistant reasoning</span>";
        wrap.appendChild(legend);

        (t.steps || []).forEach((s) => {
          wrap.appendChild(renderTranscriptStep(s));
        });

        if (t.notes && t.notes.length) {
          const n = document.createElement("div");
          n.style.fontSize = "13px";
          n.style.color = "#4c5959";
          n.innerHTML = "<strong>Transcript notes:</strong><ul class='list-tight'>" + t.notes.map((x) => "<li>" + x + "</li>").join("") + "</ul>";
          wrap.appendChild(n);
        }

        return wrap;
      }

      function renderDetail(c) {
        if (!c) {
          caseDetailEl.innerHTML = "<div class='empty'>Select a case to inspect details.</div>";
          return;
        }
        caseDetailEl.innerHTML = "";

        const head = document.createElement("div");
        head.className = "detail-head";
        var endpointRangeHtml = "";
        if (c.acceptable_endpoints && c.acceptable_endpoints.length) {
          endpointRangeHtml += "<span class='tag' style='background:#dcfce7;color:#166534'>acceptable: " + c.acceptable_endpoints.join(", ") + "</span>";
        }
        if (c.must_not_reach && c.must_not_reach.length) {
          endpointRangeHtml += "<span class='tag' style='background:#fee2e2;color:#991b1b'>must NOT reach: " + c.must_not_reach.join(", ") + "</span>";
        }
        if (c.optimal_endpoint) {
          endpointRangeHtml += "<span class='tag' style='background:#fef9c3;color:#854d0e'>optimal: " + c.optimal_endpoint + "</span>";
        }
        head.innerHTML =
          "<h4>" + c.case_id + " - " + c.title + "</h4>" +
          "<span class='tag' style='background:#e0e7ff;color:#3730a3;font-weight:600'>" + (BUCKET_LABELS[c.behavior_bucket] || c.behavior_bucket) + "</span>" +
          (c.channel ? "<span class='tag' style='background:#f0fdf4;color:#15803d;font-weight:600'>" + c.channel + "</span>" : "") +
          "<span class='tag " + statusClass(c.review_status) + "'>" + statusLabel(c.review_status) + "</span>" +
          "<span class='tag'>" + c.persona_type + "</span>" +
          "<span class='tag'>" + c.product_mode + "</span>" +
          "<span class='tag'>" + c.expected_endpoint + "</span>" +
          endpointRangeHtml +
          "<span class='tag'>" + c.intent_level + " intent</span>" +
          "<span class='tag'>transcripts: " + c.linked_transcript_count + "</span>" +
          "";
        caseDetailEl.appendChild(head);

        const cols = document.createElement("div");
        cols.className = "cols";

        const boxA = document.createElement("section");
        boxA.className = "box";
        boxA.innerHTML =
          "<h5>Persona and Hidden Truth</h5>" +
          "<div class='body'>" +
          "<p><strong>Wants:</strong> " + c.persona_profile.what_they_want + "</p>" +
          "<p><strong>Knows:</strong> " + c.persona_profile.what_they_know + "</p>" +
          "<p><strong>Unknowns:</strong> " + c.persona_profile.what_they_dont_know + "</p>" +
          "<p><strong>Style:</strong> " + c.persona_profile.communication_style + "</p>" +
          "<p><strong>Hidden truth:</strong> quantity=" + c.hidden_truth.quantity + ", budget=" + c.hidden_truth.budget + ", destination=" + c.hidden_truth.destination + ", timeline=" + c.hidden_truth.timeline + "</p>" +
          "<p><strong>Flexibility:</strong> " + c.hidden_truth.flexibility + "</p>" +
          "</div>";
        cols.appendChild(boxA);

        const boxB = document.createElement("section");
        boxB.className = "box";
        boxB.innerHTML =
          "<h5>Expected Bot Flow</h5>" +
          "<div class='body'>" +
          "<p><strong>Stage path:</strong></p>" +
          "<ol class='list-tight'>" + c.expected_stage_path.map((s) => "<li>" + s + "</li>").join("") + "</ol>" +
          "<p><strong>Tool sequence:</strong></p>" +
          "<ol class='list-tight'>" + c.expected_tool_sequence.map((s) => "<li>" + s + "</li>").join("") + "</ol>" +
          "</div>";
        cols.appendChild(boxB);

        const boxC = document.createElement("section");
        boxC.className = "box";
        boxC.innerHTML =
          "<h5>Simulation Guide (Lead Behavior)</h5>" +
          "<div class='body'>" +
          "<p><strong>Turn-by-turn expected behavior (T1 = first lead reply, T2 = second):</strong></p>" +
          "<ol class='list-tight'>" + c.allowed_disclosures_by_turn.map((s) => "<li>" + s + "</li>").join("") + "</ol>" +
          "<p><strong>Disengagement risks if bot misses expectations:</strong></p>" +
          "<ul class='list-tight'>" + c.persona_profile.dropoff_triggers.map((s) => "<li>" + s + "</li>").join("") + "</ul>" +
          "<p><strong>Typical verification questions this lead asks:</strong></p>" +
          "<ul class='list-tight'>" + c.persona_profile.trust_questions.map((s) => "<li>" + s + "</li>").join("") + "</ul>" +
          "</div>";
        cols.appendChild(boxC);

        const boxD = document.createElement("section");
        boxD.className = "box";
        boxD.innerHTML =
          "<h5>Evaluation Checklist (What Good Looks Like)</h5>" +
          "<div class='body'>" +
          "<p><strong>Required checks (must pass):</strong><br/>" + renderChecks(c.must_pass_checks) + "</p>" +
          "<p><strong>Forbidden failures (must NOT happen):</strong><br/>" + renderChecks(c.must_fail_checks) + "</p>" +
          "<p><strong>Notes:</strong> " + c.review_notes + "</p>" +
          "<p><strong>Sources:</strong><br/>" + c.sources.map((s) => "<span class='tag'>" + s + "</span>").join("") + "</p>" +
          "</div>";
        cols.appendChild(boxD);

        caseDetailEl.appendChild(cols);

        const tWrap = document.createElement("section");
        tWrap.className = "timeline-wrap";
        tWrap.innerHTML = "<h5 style='margin:0 0 8px; font-size:15px;'>Linked Transcript(s)</h5>";

        if (!c.linked_transcripts || !c.linked_transcripts.length) {
          tWrap.innerHTML += "<div class='empty' style='padding:10px; border:1px dashed #cdbfa9; border-radius:10px; background:#fffdf8;'>No transcript linked for this case yet.</div>";
        } else {
          c.linked_transcripts.forEach((t) => tWrap.appendChild(renderTranscript(t)));
        }

        caseDetailEl.appendChild(tWrap);
      }

      function render(rows) {
        renderCaseList(rows);
        const current = rows.find((r) => r.case_id === currentId) || rows[0];
        renderDetail(current);
      }

      function initFilters() {
        {
          fBucket.innerHTML = "";
          const allOpt = document.createElement("option");
          allOpt.value = "all";
          allOpt.textContent = "All behavior buckets";
          fBucket.appendChild(allOpt);
          uniq(cases.map((c) => c.behavior_bucket)).forEach((b) => {
            const op = document.createElement("option");
            op.value = b;
            op.textContent = BUCKET_LABELS[b] || b;
            fBucket.appendChild(op);
          });
        }
        fillSelect(fChannel, uniq(cases.map((c) => c.channel || "web")), "All channels");
        fillSelect(fPersona, uniq(cases.map((c) => c.persona_type)), "All persona types");
        fillSelect(fMotivation, uniq(cases.map((c) => c.motivation)), "All motivations");
        fillSelect(fProductMode, uniq(cases.map((c) => c.product_mode)), "All product modes");
        fillSelect(fRisk, uniq(cases.map((c) => c.risk_class)), "All risk classes");
        fStatus.innerHTML = "";
        [
          { v: "all", t: "All review states" },
          { v: "locked", t: "Ready for eval" },
          { v: "reviewed", t: "Needs team decision" },
          { v: "draft", t: "Needs definition" }
        ].forEach((it) => {
          const op = document.createElement("option");
          op.value = it.v;
          op.textContent = it.t;
          fStatus.appendChild(op);
        });
        fTranscript.innerHTML = "";
        [
          { v: "all", t: "All cases" },
          { v: "with", t: "With transcript" },
          { v: "without", t: "Without transcript" }
        ].forEach((it) => {
          const op = document.createElement("option");
          op.value = it.v;
          op.textContent = it.t;
          fTranscript.appendChild(op);
        });
      }

      function wire() {
        [fBucket, fChannel, fPersona, fMotivation, fProductMode, fRisk, fStatus, fTranscript, fSearch].forEach((el) => {
          el.addEventListener("change", () => render(filteredCases()));
          el.addEventListener("input", () => render(filteredCases()));
        });
      }

      function initStatic() {
        heroMeta.textContent =
          data.dataset_name + " v" + data.version +
          " | purpose: " + data.generated_for;

        const locked = cases.filter((c) => c.review_status === "locked").length;
        const draft = cases.filter((c) => c.review_status === "draft").length;
        const linked = cases.filter((c) => c.linked_transcript_count > 0).length;

        document.getElementById("kCases").textContent = String(cases.length);
        document.getElementById("kTranscripts").textContent = String(data.transcripts_count || 0);
        document.getElementById("kLinked").textContent = String(linked);
        document.getElementById("kLocked").textContent = String(locked);
        document.getElementById("kDraft").textContent = String(draft);
        document.getElementById("kToolCalls").textContent = String(data.transcripts_tool_calls || 0);

        renderCoverage("coverageSegment", data.coverage.behavior_bucket || data.coverage.persona_type);
        renderCoverage("coverageEndpoint", data.coverage.expected_endpoint);
        renderHeatTable();
        renderChecksTable();
        renderSignoffTable();
      }

      initFilters();
      wire();
      initStatic();
      render(filteredCases());
    })();
  </script>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(CASES_INPUT)) {
    throw new Error("Missing input file: " + CASES_INPUT);
  }
  if (!fs.existsSync(TRANSCRIPTS_INPUT)) {
    throw new Error("Missing input file: " + TRANSCRIPTS_INPUT);
  }
  const casesData = readJson(CASES_INPUT);
  const transcriptsData = readJson(TRANSCRIPTS_INPUT);
  const evalComparisonData = fs.existsSync(EVAL_COMPARISON_INPUT)
    ? readJson(EVAL_COMPARISON_INPUT)
    : null;
  const payload = buildPayload(casesData, transcriptsData, evalComparisonData);
  const html = buildHtml(payload);
  fs.writeFileSync(OUTPUT, html, "utf8");
  console.log("Generated " + OUTPUT);
}

main();
