#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const CASES_FILE = path.join(ROOT, "tests", "golden-eugene-v1", "cases.seed.json");
const RUBRIC_FILE = path.join(ROOT, "tests", "ASSESSMENT_RUBRIC.md");
const GPT_PROMPT_FILE = path.join(ROOT, "tests", "golden-eugene-v1", "GPT_JUDGE_PROMPT.md");
const RUN_V7_SUMMARY_FILE = path.join(ROOT, "tests", "run-v7", "run_summary_v7.md");
const RUN_V6_SUMMARY_FILE = path.join(ROOT, "tests", "run-v6", "run_summary_v6.md");
const EVAL_COMPARISON_FILE = path.join(ROOT, "tests", "golden-eugene-v1", "eval_comparison.seed.json");
const OUTPUT_FILE = path.join(ROOT, "golden_eval_review.html");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function countBy(items, key) {
  const out = {};
  for (const item of items) {
    const v = item[key] ?? "unknown";
    out[v] = (out[v] || 0) + 1;
  }
  return out;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseRubric(md) {
  const dims = [];
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/^###\s+(D\d+):\s+(.+)$/);
    if (!m) continue;
    const id = m[1];
    const title = m[2].trim();
    const bullets = [];
    let j = i + 1;
    while (j < lines.length && !lines[j].startsWith("### ") && !lines[j].startsWith("## ")) {
      if (lines[j].trim().startsWith("-")) bullets.push(lines[j].trim().replace(/^-\s*/, ""));
      j += 1;
    }
    dims.push({ id, title, bullets });
  }
  return dims;
}

function parseVersionProgression(md) {
  const out = [];
  const lines = md.split("\n");
  const start = lines.findIndex((line) => line.includes("| Version |"));
  if (start === -1) return out;
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) break;
    if (/^\|\s*-+/.test(line)) continue;
    const cols = line.split("|").map((x) => x.trim()).filter(Boolean);
    if (cols.length < 5) continue;
    if (cols[0].toLowerCase() === "version") continue;
    out.push({
      version: cols[0],
      personas: cols[1],
      pass_rate: cols[2],
      avg_lines: cols[3],
      key_change: cols[4]
    });
  }
  return out;
}

function parseRunHeadline(md, label) {
  const m = md.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n]+)`));
  return m ? m[1].trim() : "";
}

function parseV6Overall(md) {
  const m = md.match(/\*\*Overall:\s*([^*]+)\*\*/);
  return m ? m[1].trim() : "";
}

function computeCheckRows(comp, checkById) {
  const rows = {};
  for (const group of comp.groups || []) {
    const keyPrefix = /awsaf/i.test(group.label) ? "awsaf" : "eric";
    for (const item of group.items || []) {
      for (const chk of item.required_checks || []) {
        if (!rows[chk.id]) {
          rows[chk.id] = {
            id: chk.id,
            title: checkById[chk.id] ? checkById[chk.id].title : "",
            awsaf_pass: 0,
            awsaf_fail: 0,
            awsaf_na: 0,
            eric_pass: 0,
            eric_fail: 0,
            eric_na: 0
          };
        }
        if (chk.result === true) rows[chk.id][`${keyPrefix}_pass`] += 1;
        else if (chk.result === false) rows[chk.id][`${keyPrefix}_fail`] += 1;
        else rows[chk.id][`${keyPrefix}_na`] += 1;
      }
    }
  }

  return Object.values(rows)
    .map((r) => {
      const awsafDen = r.awsaf_pass + r.awsaf_fail;
      const ericDen = r.eric_pass + r.eric_fail;
      return {
        ...r,
        awsaf_rate: awsafDen ? round((r.awsaf_pass / awsafDen) * 100) : null,
        eric_rate: ericDen ? round((r.eric_pass / ericDen) * 100) : null
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

function passTag(pass) {
  if (pass === true) return "<span class='tag ok'>PASS</span>";
  if (pass === false) return "<span class='tag bad'>FAIL</span>";
  return "<span class='tag na'>NA</span>";
}

function endpointTag(match) {
  if (match === true) return "<span class='tag ok'>match</span>";
  if (match === false) return "<span class='tag bad'>mismatch</span>";
  return "<span class='tag na'>n/a</span>";
}

function buildPayload() {
  const casesData = readJson(CASES_FILE);
  const cases = casesData.cases || [];
  const checkDefs = casesData.check_definitions || [];
  const checkById = Object.fromEntries(checkDefs.map((c) => [c.id, c]));

  const rubricMd = fs.existsSync(RUBRIC_FILE) ? fs.readFileSync(RUBRIC_FILE, "utf8") : "";
  const promptMd = fs.existsSync(GPT_PROMPT_FILE) ? fs.readFileSync(GPT_PROMPT_FILE, "utf8") : "";
  const v7SummaryMd = fs.existsSync(RUN_V7_SUMMARY_FILE) ? fs.readFileSync(RUN_V7_SUMMARY_FILE, "utf8") : "";
  const v6SummaryMd = fs.existsSync(RUN_V6_SUMMARY_FILE) ? fs.readFileSync(RUN_V6_SUMMARY_FILE, "utf8") : "";
  const comp = fs.existsSync(EVAL_COMPARISON_FILE) ? readJson(EVAL_COMPARISON_FILE) : null;

  const rubricDims = parseRubric(rubricMd);
  const v7Headline = parseRunHeadline(v7SummaryMd, "Result");
  const v6Headline = parseV6Overall(v6SummaryMd);
  const progression = parseVersionProgression(v7SummaryMd);

  const comparison = comp
    ? {
        judge_mode: comp.judge_mode,
        scoring_formula: comp.framework ? comp.framework.scoring_formula : "",
        threshold: comp.threshold || null,
        notes: comp.notes || [],
        mappings: comp.mappings || null,
        awsaf_baseline_v01: comp.awsaf_baseline_v01 || null,
        awsaf_delta_vs_v01: comp.awsaf_delta_vs_v01 || null,
        groups: comp.groups || [],
        all_items: (comp.groups || []).flatMap((g) =>
          (g.items || []).map((i) => ({
            ...i,
            group_label: g.label
          }))
        ),
        check_rows: computeCheckRows(comp, checkById)
      }
    : null;

  return {
    dataset_name: casesData.dataset_name,
    version: casesData.version,
    total_cases: cases.length,
    checks_count: checkDefs.length,
    byBucket: countBy(cases, "behavior_bucket"),
    byEndpoint: countBy(cases, "expected_endpoint"),
    rubric_dims: rubricDims,
    prompt_template: promptMd,
    comparison,
    eric_results: {
      v7_headline: v7Headline,
      v6_headline: v6Headline,
      progression
    },
    runs: [
      {
        run_id: "run-gd-v1-core",
        purpose: "Core release gate set (locked cases only).",
        rule: "review_status = locked",
        count: cases.filter((c) => c.review_status === "locked").length
      },
      {
        run_id: "run-gd-v1-generalization",
        purpose: "Generalization check on reviewed but not locked cases.",
        rule: "review_status = reviewed",
        count: cases.filter((c) => c.review_status === "reviewed").length
      },
      {
        run_id: "run-gd-v1-draft-probe",
        purpose: "Draft-case probe to find schema/scenario gaps before locking.",
        rule: "review_status = draft",
        count: cases.filter((c) => c.review_status === "draft").length
      },
      {
        run_id: "run-gd-v1-stress",
        purpose: "Adversarial mismatch/spam/resistance stress test.",
        rule: "B5 + B6",
        count: cases.filter((c) => ["B5", "B6"].includes(c.behavior_bucket)).length
      }
    ]
  };
}

function buildHtml(payload) {
  const comp = payload.comparison;
  const groups = comp ? comp.groups || [] : [];
  const awsaf = groups.find((g) => /awsaf/i.test(g.label)) || null;
  const eric = groups.find((g) => /eric/i.test(g.label)) || null;

  const deltaComposite = awsaf && eric ? round((awsaf.composite_average || 0) - (eric.composite_average || 0)) : null;
  const deltaQuality = awsaf && eric ? round((awsaf.quality_average || 0) - (eric.quality_average || 0)) : null;

  const baselinePanel =
    comp && comp.awsaf_baseline_v01 && comp.awsaf_delta_vs_v01
      ? `<section class="card" style="margin-top:10px;">
      <strong>Awsaf transcript rerun delta vs previous baseline (v0.1)</strong>
      <div class="meta">Quality: ${comp.awsaf_baseline_v01.quality_average} -> ${(awsaf && awsaf.quality_average) || 0} (${comp.awsaf_delta_vs_v01.quality_average >= 0 ? "+" : ""}${comp.awsaf_delta_vs_v01.quality_average})</div>
      <div class="meta">Composite: ${comp.awsaf_baseline_v01.composite_average} -> ${(awsaf && awsaf.composite_average) || 0} (${comp.awsaf_delta_vs_v01.composite_average >= 0 ? "+" : ""}${comp.awsaf_delta_vs_v01.composite_average})</div>
      <div class="meta">Pass rate: ${comp.awsaf_baseline_v01.pass_rate}% -> ${(awsaf && awsaf.pass_rate) || 0}% (${comp.awsaf_delta_vs_v01.pass_rate >= 0 ? "+" : ""}${comp.awsaf_delta_vs_v01.pass_rate} pp)</div>
    </section>`
      : "";

  const comparisonCards = comp
    ? `<h2>Unified Results (Same Definition)</h2>
    <section class="grid2">
      <article class="card">
        <strong>Awsaf 5 transcripts</strong>
        <p class="meta"><strong>Count:</strong> ${awsaf ? awsaf.count : 0}</p>
        <p class="meta"><strong>Quality avg:</strong> ${awsaf ? awsaf.quality_average : 0}/10</p>
        <p class="meta"><strong>Check avg:</strong> ${awsaf ? awsaf.check_average : 0}/10</p>
        <p class="meta"><strong>Composite avg:</strong> ${awsaf ? awsaf.composite_average : 0}/10</p>
        <p class="meta"><strong>Pass rate:</strong> ${awsaf ? awsaf.pass_rate : 0}%</p>
        <p class="meta"><strong>Endpoint match:</strong> ${awsaf ? awsaf.endpoint_match_rate : 0}%</p>
      </article>
      <article class="card">
        <strong>Eric 6 chats (v7 logs)</strong>
        <p class="meta"><strong>Count:</strong> ${eric ? eric.count : 0}</p>
        <p class="meta"><strong>Quality avg:</strong> ${eric ? eric.quality_average : 0}/10</p>
        <p class="meta"><strong>Check avg:</strong> ${eric ? eric.check_average : 0}/10</p>
        <p class="meta"><strong>Composite avg:</strong> ${eric ? eric.composite_average : 0}/10</p>
        <p class="meta"><strong>Pass rate:</strong> ${eric ? eric.pass_rate : 0}%</p>
        <p class="meta"><strong>Endpoint match:</strong> ${eric ? eric.endpoint_match_rate : 0}%</p>
      </article>
    </section>
    <section class="card" style="margin-top:10px;">
      <strong>Delta (Awsaf - Eric):</strong>
      <span class="tag ${deltaComposite !== null && deltaComposite >= 0 ? "ok" : "bad"}">Composite ${deltaComposite !== null ? deltaComposite : "n/a"}</span>
      <span class="tag ${deltaQuality !== null && deltaQuality >= 0 ? "ok" : "bad"}">Quality ${deltaQuality !== null ? deltaQuality : "n/a"}</span>
      <div class="small" style="margin-top:8px;">Judge mode: ${escapeHtml(comp.judge_mode || "")}</div>
      <div class="small">Formula: ${escapeHtml(comp.scoring_formula || "")}</div>
      <div class="small">Threshold: quality >= 7, no required-check fail, endpoint match required.</div>
    </section>
    ${baselinePanel}`
    : `<section class="card"><strong>Missing eval comparison.</strong> Run <code>node scripts/build-eval-comparison.js</code>.</section>`;

  const conversationTable = comp
    ? `<h2>Conversation Results + Improvement Suggestions</h2>
    <section class="card table-wrap">
      <table>
        <thead>
          <tr>
            <th>Set</th><th>ID</th><th>Case</th><th>Expected Endpoint</th><th>Actual Endpoint</th><th>Endpoint</th>
            <th>Quality</th><th>Check</th><th>Composite</th><th>Req P/F/NA</th><th>Result</th><th>Improvements</th>
          </tr>
        </thead>
        <tbody>
          ${comp.all_items
            .map(
              (r) => `<tr>
            <td>${escapeHtml(r.group_label.replace(" Golden Transcripts", "").replace(" Chat Examples (v7)", ""))}${r.golden_type ? " <span class=\"tag na\">" + (r.golden_type === "wa" ? "WA golden" : "Web golden") + "</span>" : ""}</td>
            <td>${escapeHtml(r.conversation_id)}</td>
            <td>${escapeHtml(r.case_id || "-")}</td>
            <td>${escapeHtml(r.expected_endpoint || "-")}${(r.acceptable_endpoints && r.acceptable_endpoints.length > 1) ? " <span class=\"small\">(ok: " + escapeHtml(r.acceptable_endpoints.join(", ")) + (r.must_not_reach && r.must_not_reach.length ? "; must not: " + escapeHtml(r.must_not_reach.join(", ")) : "") + ")</span>" : ""}</td>
            <td>${escapeHtml(r.actual_endpoint || "-")}${r.endpoint_optimal ? " <span class=\"tag ok\">optimal</span>" : ""}</td>
            <td>${endpointTag(r.endpoint_match)}</td>
            <td>${r.quality_average}</td>
            <td>${r.check_score}</td>
            <td>${r.composite_score}</td>
            <td>${r.required_checks_pass}/${r.required_checks_fail}/${r.required_checks_na}</td>
            <td>${passTag(r.pass)}</td>
            <td><ul>${(r.improvement_suggestions || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul></td>
          </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </section>`
    : "";

  const checkCoverage = comp
    ? `<h2>Required Check Performance</h2>
    <section class="card table-wrap">
      <table>
        <thead><tr><th>Check</th><th>Definition</th><th>Awsaf (P/F/NA)</th><th>Awsaf Pass%</th><th>Eric (P/F/NA)</th><th>Eric Pass%</th></tr></thead>
        <tbody>
          ${comp.check_rows
            .map(
              (r) => `<tr><td>${escapeHtml(r.id)}</td><td>${escapeHtml(r.title || "")}</td><td>${r.awsaf_pass}/${r.awsaf_fail}/${r.awsaf_na}</td><td>${r.awsaf_rate == null ? "-" : r.awsaf_rate + "%"}</td><td>${r.eric_pass}/${r.eric_fail}/${r.eric_na}</td><td>${r.eric_rate == null ? "-" : r.eric_rate + "%"}</td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </section>`
    : "";

  const mappingTable =
    comp && comp.mappings && comp.mappings.eric_case_map
      ? `<h2>Eric-to-GD Mapping Used by Shared Judge</h2>
    <section class="card table-wrap">
      <table>
        <thead><tr><th>Eric File</th><th>Mapped GD Case</th></tr></thead>
        <tbody>
          ${Object.entries(comp.mappings.eric_case_map)
            .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
            .join("")}
        </tbody>
      </table>
    </section>`
      : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Golden Eval Framework + Unified Comparison</title>
  <style>
    :root { --bg:#f3efe5; --panel:#fffaf0; --line:#d7ccba; --ink:#1f2b2b; --muted:#5f6d6d; --brand:#126d60; --shadow:0 10px 30px rgba(20,25,27,.08); --ok:#2f8e45; --bad:#9f3b2f; --na:#6b7680; }
    * { box-sizing:border-box; }
    body { margin:0; color:var(--ink); font-family:"Avenir Next","Segoe UI","Helvetica Neue",sans-serif; background:radial-gradient(860px 300px at 90% -15%, #ffd9b2 0%, transparent 70%),radial-gradient(1000px 450px at -10% 0%, #bfe5dd 0%, transparent 65%),var(--bg); }
    .wrap { max-width:1360px; margin:0 auto; padding:16px; }
    .hero { border-radius:14px; background:linear-gradient(135deg,#143534 0%,#126d60 50%,#28a38c 100%); color:#f3fffc; box-shadow:var(--shadow); padding:16px; }
    .hero h1 { margin:0 0 6px; font-size:clamp(22px,3vw,33px); }
    .hero p { margin:0; color:#ddf9f3; font-size:14px; }
    .kpis { margin-top:12px; display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:8px; }
    .card { background:var(--panel); border:1px solid var(--line); border-radius:10px; box-shadow:var(--shadow); padding:10px; }
    .num { font-size:24px; font-weight:700; color:var(--brand); line-height:1; }
    .label { font-size:12px; color:var(--muted); text-transform:uppercase; letter-spacing:.7px; font-weight:700; margin-top:4px; }
    h2 { margin:18px 0 8px; font-size:18px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .meta { margin:4px 0; color:#344242; }
    .small { font-size:12px; color:#596666; }
    .tag { display:inline-block; font-size:11px; border-radius:999px; border:1px solid #d6dede; background:#edf1f1; color:#4c5959; padding:2px 8px; margin-right:4px; margin-bottom:4px; }
    .tag.ok { background:#e8f7eb; border-color:#bde3c5; color:var(--ok); }
    .tag.bad { background:#fff0ec; border-color:#efc8be; color:var(--bad); }
    .tag.na { background:#eff2f4; border-color:#d5dde3; color:var(--na); }
    .table-wrap { overflow:auto; }
    table { width:100%; border-collapse:collapse; min-width:1080px; }
    th, td { border-bottom:1px solid var(--line); border-right:1px solid var(--line); padding:8px 10px; font-size:13px; text-align:left; vertical-align:top; }
    th { background:#ecf8f5; font-weight:700; color:#173635; }
    tr:last-child td { border-bottom:0; }
    tr td:last-child, tr th:last-child { border-right:0; }
    ul { margin:0; padding-left:18px; }
    li + li { margin-top:4px; }
    pre { margin:0; white-space:pre-wrap; background:#fbf5e8; border:1px solid #e6dccb; border-radius:8px; padding:10px; font-size:12px; }
    code { background:#f3efe6; border:1px solid #e0d7c6; border-radius:6px; padding:1px 6px; }
    @media (max-width: 1000px) { .kpis, .grid2 { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <h1>Golden Eval Framework + Unified Comparison</h1>
      <p>${escapeHtml(payload.dataset_name)} v${escapeHtml(payload.version)} | Rubric + judge prompt first, then shared Awsaf/Eric results</p>
    </section>

    <section class="kpis">
      <article class="card"><div class="num">${payload.total_cases}</div><div class="label">Golden Cases</div></article>
      <article class="card"><div class="num">${payload.checks_count}</div><div class="label">Checks</div></article>
      <article class="card"><div class="num">${payload.byBucket.B4 || 0}</div><div class="label">B4 ICP Cases</div></article>
      <article class="card"><div class="num">${payload.byBucket.B5 || 0} / ${payload.byBucket.B6 || 0}</div><div class="label">B5/B6 Stress</div></article>
      <article class="card"><div class="num">${comp ? comp.all_items.length : 0}</div><div class="label">Conversations Scored</div></article>
    </section>

    <h2>Eval Prompt Logic (Used for Scoring)</h2>
    <section class="card">
      <ul>
        <li>Judge scores assistant turns on D1-D5 (0-2 each), then averages per conversation.</li>
        <li>Conversation pass requires: quality average >= 7, zero required-check fails, and endpoint match.</li>
        <li>Required checks are taken from each mapped GD case in <code>cases.seed.json</code>.</li>
      </ul>
      <p class="small" style="margin-top:8px;"><strong>Prompt template file:</strong> <code>tests/golden-eugene-v1/GPT_JUDGE_PROMPT.md</code></p>
      <pre>${escapeHtml(payload.prompt_template || "")}</pre>
    </section>

    <h2>Rubric Dimensions (Displayed Before Results)</h2>
    <section class="card table-wrap">
      <table>
        <thead><tr><th>Dimension</th><th>Definition</th><th>0-2 behavior</th></tr></thead>
        <tbody>
          ${payload.rubric_dims
            .map(
              (d) => `<tr><td><strong>${escapeHtml(d.id)}</strong></td><td>${escapeHtml(d.title)}</td><td><ul>${(d.bullets || []).slice(0, 3).map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul></td></tr>`
            )
            .join("")}
        </tbody>
      </table>
    </section>

    ${comparisonCards}
    ${conversationTable}
    ${checkCoverage}

    <h2>Judge Notes</h2>
    <section class="card">
      <ul>${(comp && comp.notes ? comp.notes : []).map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>
      <p class="small" style="margin-top:8px;">All case-level improvement suggestions above are generated from failed checks + low dimension averages per conversation.</p>
    </section>

    ${mappingTable}

    <h2>Eric Historical Pass/Fail (Reference)</h2>
    <section class="grid2">
      <article class="card">
        <strong>Historical run headlines</strong>
        <ul>
          <li><strong>v7:</strong> ${escapeHtml(payload.eric_results.v7_headline || "Not found")}</li>
          <li><strong>v6b:</strong> ${escapeHtml(payload.eric_results.v6_headline || "Not found")}</li>
        </ul>
      </article>
      <article class="card">
        <strong>Source files</strong>
        <ul>
          <li><code>tests/run-v7/run_summary_v7.md</code></li>
          <li><code>tests/run-v6/run_summary_v6.md</code></li>
        </ul>
      </article>
    </section>
    <section class="card table-wrap" style="margin-top:10px;">
      <table>
        <thead><tr><th>Version</th><th>Personas</th><th>Pass Rate</th><th>Avg Lines</th><th>Key Change</th></tr></thead>
        <tbody>
          ${payload.eric_results.progression
            .map((r) => `<tr><td>${escapeHtml(r.version)}</td><td>${escapeHtml(r.personas)}</td><td>${escapeHtml(r.pass_rate)}</td><td>${escapeHtml(r.avg_lines)}</td><td>${escapeHtml(r.key_change)}</td></tr>`)
            .join("")}
        </tbody>
      </table>
    </section>

    <h2>Proposed GD Run Stack</h2>
    <section class="grid2">
      ${payload.runs
        .map((r) => `<article class="card"><strong>${escapeHtml(r.run_id)}</strong><p class="meta">${escapeHtml(r.purpose)}</p><p class="meta"><strong>Rule:</strong> <code>${escapeHtml(r.rule)}</code></p><p class="meta"><strong>Count:</strong> ${r.count}</p></article>`)
        .join("")}
    </section>
  </div>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(CASES_FILE)) throw new Error("Missing " + CASES_FILE);
  const payload = buildPayload();
  fs.writeFileSync(OUTPUT_FILE, buildHtml(payload), "utf8");
  console.log("Generated " + OUTPUT_FILE);
}

main();
