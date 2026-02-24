#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const CASES_FILE = path.join(ROOT, "tests", "golden-eugene-v1", "cases.seed.json");
const TRANSCRIPTS_FILE = path.join(ROOT, "tests", "golden-eugene-v1", "transcripts.seed.json");
const OUTPUT_FILE = path.join(ROOT, "golden_transcripts_review.html");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(payload) {
  const dataJson = JSON.stringify(payload).replace(/<\/script/gi, "<\\/script");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Golden Transcript Review - Eugene V1</title>
  <style>
    :root {
      --bg: #f3efe5;
      --panel: #fffaf0;
      --ink: #1f2b2b;
      --muted: #5f6d6d;
      --line: #d7ccba;
      --brand: #126d60;
      --accent: #cf7b31;
      --shadow: 0 10px 30px rgba(20, 25, 27, 0.08);
      --user: #ecf5ff;
      --assistant: #ebfff5;
      --system: #fff7e9;
      --thinking: #f2f4f6;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif;
      color: var(--ink);
      background:
        radial-gradient(860px 300px at 90% -15%, #ffd9b2 0%, transparent 70%),
        radial-gradient(1000px 450px at -10% 0%, #bfe5dd 0%, transparent 65%),
        var(--bg);
    }
    .wrap {
      max-width: 1320px;
      margin: 0 auto;
      padding: 16px;
    }
    .hero {
      background: linear-gradient(135deg, #143534 0%, #126d60 50%, #28a38c 100%);
      color: #f3fffd;
      border-radius: 14px;
      box-shadow: var(--shadow);
      padding: 16px;
    }
    .hero h1 { margin: 0 0 6px; font-size: clamp(22px, 3vw, 33px); }
    .hero p { margin: 0; color: #dcf8f2; font-size: 14px; }
    .kpis {
      margin-top: 10px;
      display: grid;
      grid-template-columns: repeat(4, minmax(0,1fr));
      gap: 8px;
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 10px;
      box-shadow: var(--shadow);
      padding: 10px;
    }
    .kpi .v { font-size: 24px; font-weight: 700; color: var(--brand); line-height: 1; margin-bottom: 4px; }
    .kpi .k { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.7px; font-weight: 700; }
    .filters {
      margin-top: 10px;
      display: grid;
      grid-template-columns: repeat(4, minmax(0,1fr));
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
      font: inherit;
      background: #fffdf8;
    }
    .main {
      margin-top: 10px;
      display: grid;
      grid-template-columns: 390px 1fr;
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
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      background: #f8f2e5;
      font-size: 16px;
    }
    .list {
      overflow: auto;
      padding: 8px;
    }
    .item {
      border: 1px solid #e3d8c8;
      border-radius: 10px;
      padding: 9px;
      background: #fffdf8;
      cursor: pointer;
    }
    .item + .item { margin-top: 8px; }
    .item.active {
      border-color: #8dcbbf;
      box-shadow: inset 0 0 0 1px #8dcbbf;
      background: #eefbf7;
    }
    .item .title { font-size: 14px; font-weight: 700; margin-bottom: 5px; }
    .meta { font-size: 12px; color: var(--muted); }
    .tag {
      display: inline-block;
      font-size: 11px;
      border: 1px solid #d9e1df;
      border-radius: 999px;
      padding: 2px 7px;
      margin-right: 4px;
      margin-top: 4px;
      background: #edf3f2;
      color: #445050;
    }
    .detail {
      overflow: auto;
      padding: 10px;
    }
    .detail-head {
      border: 1px solid #e3d8c8;
      border-radius: 10px;
      background: #fffdf8;
      padding: 10px;
      margin-bottom: 10px;
    }
    .detail-head h3 { margin: 0 0 6px; font-size: 20px; }
    .timeline {
      border: 1px solid #e3d8c8;
      border-radius: 10px;
      background: #fffdf8;
      padding: 10px;
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
    .notes {
      margin-top: 10px;
      border: 1px solid #e3d8c8;
      border-radius: 10px;
      background: #fffdf8;
      padding: 10px;
      font-size: 13px;
    }
    .notes ul { margin: 0; padding-left: 18px; }
    .notes li + li { margin-top: 4px; }
    .empty {
      padding: 20px;
      color: var(--muted);
      text-align: center;
      font-size: 14px;
    }
    @media (max-width: 1080px) {
      .main { grid-template-columns: 1fr; }
    }
    @media (max-width: 860px) {
      .filters, .kpis { grid-template-columns: repeat(2, minmax(0,1fr)); }
    }
    @media (max-width: 560px) {
      .filters, .kpis { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <h1>Golden Transcript Review</h1>
      <p id="heroMeta"></p>
    </section>

    <section class="kpis">
      <article class="card kpi"><div class="v" id="kTranscripts">0</div><div class="k">Transcripts</div></article>
      <article class="card kpi"><div class="v" id="kCases">0</div><div class="k">Linked Cases</div></article>
      <article class="card kpi"><div class="v" id="kToolCalls">0</div><div class="k">Tool Calls</div></article>
      <article class="card kpi"><div class="v" id="kFlows">0</div><div class="k">Endpoint Types</div></article>
    </section>

    <section class="filters">
      <div class="field">
        <label for="fBand">Profile Band</label>
        <select id="fBand"></select>
      </div>
      <div class="field">
        <label for="fEndpoint">Expected Endpoint</label>
        <select id="fEndpoint"></select>
      </div>
      <div class="field">
        <label for="fCase">Case ID</label>
        <select id="fCase"></select>
      </div>
      <div class="field">
        <label for="fSearch">Search</label>
        <input id="fSearch" placeholder="title, case id, note" />
      </div>
    </section>

    <section class="main">
      <section class="panel">
        <h2>Transcript List</h2>
        <div id="list" class="list"></div>
      </section>
      <section class="panel">
        <h2>Transcript Detail</h2>
        <div id="detail" class="detail"><div class="empty">Select a transcript.</div></div>
      </section>
    </section>
  </div>

  <script id="seed" type="application/json">${dataJson}</script>
  <script>
    (function () {
      const data = JSON.parse(document.getElementById("seed").textContent);
      const transcripts = data.transcripts || [];
      const casesById = data.casesById || {};
      let currentId = null;

      const listEl = document.getElementById("list");
      const detailEl = document.getElementById("detail");

      const fBand = document.getElementById("fBand");
      const fEndpoint = document.getElementById("fEndpoint");
      const fCase = document.getElementById("fCase");
      const fSearch = document.getElementById("fSearch");

      function uniq(arr) {
        return Array.from(new Set(arr)).sort((a,b) => a.localeCompare(b));
      }
      function fillSelect(el, values, allLabel) {
        el.innerHTML = "";
        const a = document.createElement("option");
        a.value = "all";
        a.textContent = allLabel;
        el.appendChild(a);
        values.forEach(v => {
          const op = document.createElement("option");
          op.value = v;
          op.textContent = v;
          el.appendChild(op);
        });
      }

      function filtered() {
        const q = (fSearch.value || "").toLowerCase().trim();
        return transcripts.filter(t => {
          if (fBand.value !== "all" && t.profile_band !== fBand.value) return false;
          if (fEndpoint.value !== "all" && t.expected_endpoint !== fEndpoint.value) return false;
          if (fCase.value !== "all" && t.case_id !== fCase.value) return false;
          if (q) {
            const hay = (t.title + " " + t.case_id + " " + (t.notes || []).join(" ")).toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });
      }

      function renderList(rows) {
        listEl.innerHTML = "";
        if (!rows.length) {
          listEl.innerHTML = "<div class='empty'>No transcripts match filters.</div>";
          detailEl.innerHTML = "<div class='empty'>No transcript selected.</div>";
          currentId = null;
          return;
        }
        if (!currentId || !rows.some(r => r.transcript_id === currentId)) currentId = rows[0].transcript_id;

        rows.forEach(t => {
          const div = document.createElement("div");
          div.className = "item" + (t.transcript_id === currentId ? " active" : "");
          div.innerHTML =
            "<div class='title'>" + t.transcript_id + " - " + t.title + "</div>" +
            "<div class='meta'>case: " + t.case_id + " | " + t.profile_band + "</div>" +
            "<span class='tag'>" + t.expected_endpoint + "</span>" +
            "<span class='tag'>" + t.steps.length + " steps</span>";
          div.addEventListener("click", () => {
            currentId = t.transcript_id;
            render(rows);
          });
          listEl.appendChild(div);
        });
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
              "Chip selector appears with groups like Material, Branding, and Color.",
              "User can tap chips or type custom preferences."
            ];
          }
          return [
            "Spec card appears with product specs and MOQ guidance.",
            "Sourcy difference summary appears."
          ];
        }
        if (tool === "pricingIntelligence") {
          return [
            "Price comparison card appears (FOB, landed, Sourcy DDP).",
            "Cost tips and reference links appear."
          ];
        }
        if (tool === "visualConceptGeneration") {
          return [
            "Visual gallery appears with 3 concepts.",
            "User selects one concept to continue to refinement."
          ];
        }
        if (tool === "feasibilityAssessment") {
          return [
            "Feasibility card appears with status and suggestions.",
            "Actions appear: Add another product / Finalize request."
          ];
        }
        return [];
      }

      function messageUiHints(s) {
        const txt = (s.text || "").toLowerCase();
        if (s.actor !== "assistant") return [];
        if (txt.includes("do you have a reference image")) return ["Next user action: upload reference image or type skip."];
        if (txt.includes("here are common options for this product")) return ["Customization chips are visible for selection."];
        if (txt.includes("pick a visual concept below")) return ["Visual gallery is visible and requires concept selection."];
        if (txt.includes("fill in the details below to refine")) return ["Refinement form appears: Quantity, Destination, Timeline."];
        if (txt.includes("want to add another product") || txt.includes("ready to finalize")) return ["Action buttons appear: Add another product / Finalize request."];
        if (txt.includes("let's finalize") && txt.includes("fill in your details below")) return ["Contact form appears: Name, Email, Company, Phone."];
        return [];
      }

      function appendHints(parent, title, hints) {
        if (!hints || !hints.length) return;
        const box = document.createElement("div");
        box.className = "ui-preview";
        const h = document.createElement("div");
        h.className = "ui-preview-title";
        h.textContent = title;
        box.appendChild(h);
        const ul = document.createElement("ul");
        ul.style.margin = "0";
        ul.style.paddingLeft = "16px";
        hints.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = item;
          ul.appendChild(li);
        });
        box.appendChild(ul);
        parent.appendChild(box);
      }

      function renderStep(s) {
        const isUser = s.type === "message" && s.actor === "user";
        const isAssistant = s.type === "message" && s.actor === "assistant";
        const line = document.createElement("div");

        if (isUser || isAssistant) {
          line.className = "chat-line " + (isUser ? "user" : "assistant");
          const bubble = document.createElement("div");
          bubble.className = "chat-bubble " + (isUser ? "user" : "assistant");

          const head = document.createElement("div");
          head.className = "chat-head";
          head.textContent = "#" + s.seq + " | " + s.stage + " | " + (isUser ? "User message" : "Assistant message");
          const body = document.createElement("div");
          body.textContent = stepBody(s);
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
        body.textContent = stepBody(s);
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

      function renderDetail(item) {
        if (!item) {
          detailEl.innerHTML = "<div class='empty'>Select a transcript.</div>";
          return;
        }
        detailEl.innerHTML = "";

        const c = casesById[item.case_id] || null;
        const head = document.createElement("div");
        head.className = "detail-head";
        head.innerHTML =
          "<h3>" + item.transcript_id + " - " + item.title + "</h3>" +
          "<span class='tag'>case: " + item.case_id + "</span>" +
          "<span class='tag'>" + item.profile_band + "</span>" +
          "<span class='tag'>" + item.expected_endpoint + "</span>" +
          "<p style='margin:8px 0 0; font-size:13px; color:#475555;'><strong>Goal:</strong> " + item.goal + "</p>" +
          (c ? "<p style='margin:6px 0 0; font-size:13px; color:#475555;'><strong>Linked case endpoint:</strong> " + c.expected_endpoint + "</p>" : "");
        detailEl.appendChild(head);

        const timeline = document.createElement("div");
        timeline.className = "timeline";
        const legend = document.createElement("div");
        legend.className = "transcript-legend";
        legend.innerHTML =
          "<span class='legend-pill user'>User message</span>" +
          "<span class='legend-pill assistant'>Assistant message</span>" +
          "<span class='legend-pill internal'>Bot internal tools</span>" +
          "<span class='legend-pill thinking'>Assistant reasoning</span>";
        timeline.appendChild(legend);
        item.steps.forEach(s => {
          timeline.appendChild(renderStep(s));
        });
        detailEl.appendChild(timeline);

        const notes = document.createElement("div");
        notes.className = "notes";
        notes.innerHTML = "<strong>Review Notes</strong><ul>" + (item.notes || []).map(n => "<li>" + n + "</li>").join("") + "</ul>";
        detailEl.appendChild(notes);
      }

      function render(rows) {
        renderList(rows);
        const current = rows.find(r => r.transcript_id === currentId) || rows[0];
        renderDetail(current);
      }

      function init() {
        document.getElementById("heroMeta").textContent =
          data.dataset_name + " v" + data.version + " | " + data.purpose;

        const toolCalls = transcripts.reduce((acc, t) => acc + t.steps.filter(s => s.type === "tool_call").length, 0);
        const flows = uniq(transcripts.map(t => t.expected_endpoint)).length;

        document.getElementById("kTranscripts").textContent = String(transcripts.length);
        document.getElementById("kCases").textContent = String(uniq(transcripts.map(t => t.case_id)).length);
        document.getElementById("kToolCalls").textContent = String(toolCalls);
        document.getElementById("kFlows").textContent = String(flows);

        fillSelect(fBand, uniq(transcripts.map(t => t.profile_band)), "All profile bands");
        fillSelect(fEndpoint, uniq(transcripts.map(t => t.expected_endpoint)), "All endpoints");
        fillSelect(fCase, uniq(transcripts.map(t => t.case_id)), "All case IDs");

        [fBand, fEndpoint, fCase, fSearch].forEach(el => {
          el.addEventListener("change", () => render(filtered()));
          el.addEventListener("input", () => render(filtered()));
        });

        render(filtered());
      }

      init();
    })();
  </script>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(CASES_FILE) || !fs.existsSync(TRANSCRIPTS_FILE)) {
    throw new Error("Missing required input files.");
  }
  const cases = readJson(CASES_FILE).cases || [];
  const transcriptsDataset = readJson(TRANSCRIPTS_FILE);
  const casesById = Object.fromEntries(cases.map((c) => [c.case_id, c]));
  const payload = {
    dataset_name: transcriptsDataset.dataset_name,
    version: transcriptsDataset.version,
    owner: transcriptsDataset.owner,
    purpose: transcriptsDataset.purpose,
    transcripts: transcriptsDataset.transcripts || [],
    casesById
  };

  fs.writeFileSync(OUTPUT_FILE, buildHtml(payload), "utf8");
  console.log("Generated " + OUTPUT_FILE);
}

main();
