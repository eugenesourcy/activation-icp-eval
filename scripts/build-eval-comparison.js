#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const CASES_FILE = path.join(ROOT, "tests", "golden-eugene-v1", "cases.seed.json");
const AWSAF_TRANSCRIPTS_FILE = path.join(ROOT, "tests", "golden-eugene-v1", "transcripts.seed.json");
const ERIC_RESULTS_DIR = path.join(ROOT, "tests", "run-v7", "results");
const OUTPUT_FILE = path.join(ROOT, "tests", "golden-eugene-v1", "eval_comparison.seed.json");

const BASELINE_AWSAF_V01 = {
  quality_average: 6.9,
  check_average: 8.67,
  composite_average: 7.61,
  pass_rate: 60,
  endpoint_match_rate: 80
};

const ERIC_CASE_MAP = {
  "v7-jesus.jsonl": "GD-017",
  "v7-syed.jsonl": "GD-005",
  "v7-battery.jsonl": "GD-016",
  "v7-candle.jsonl": "GD-024",
  "v7-anthony.jsonl": "GD-023",
  "v7-jammaica.jsonl": "GD-007"
};

function round(n) {
  return Math.round(n * 100) / 100;
}

function mean(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function words(text) {
  const t = String(text || "").trim();
  return t ? t.split(/\s+/).length : 0;
}

function normalizeText(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function lower(s) {
  return String(s || "").toLowerCase();
}

function textOfStep(step) {
  if (!step) return "";
  if (step.text) return String(step.text);
  if (step.input_summary) return String(step.input_summary);
  if (step.output_summary) return String(step.output_summary);
  return "";
}

function firstIndex(arr, fn) {
  for (let i = 0; i < arr.length; i += 1) if (fn(arr[i])) return i;
  return -1;
}

function normalizeAwsafConversation(tr) {
  return {
    conversation_id: tr.transcript_id,
    title: tr.title,
    case_id: tr.case_id,
    source_group: "Awsaf",
    source_file: "tests/golden-eugene-v1/transcripts.seed.json",
    steps: (tr.steps || []).map((s) => ({
      seq: s.seq,
      stage: s.stage || null,
      role: s.actor === "assistant" ? "assistant" : s.actor === "user" ? "user" : "system",
      kind: s.type || "message",
      text: textOfStep(s),
      tool: s.tool || null,
      state_update: s.state_update || null
    }))
  };
}

function normalizeEricConversation(file) {
  const rawLines = fs
    .readFileSync(file, "utf8")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  const steps = [];
  let seq = 1;

  for (const line of rawLines) {
    let obj;
    try {
      obj = JSON.parse(line);
    } catch (_) {
      continue;
    }
    if (obj.type !== "message" || !obj.message) continue;
    const role = obj.message.role;
    if (role !== "assistant" && role !== "user") continue;
    const txt = (obj.message.content || [])
      .filter((p) => p.type === "text")
      .map((p) => normalizeText(p.text))
      .filter(Boolean)
      .join(" ");
    if (!txt) continue;

    steps.push({
      seq: seq++,
      stage: null,
      role,
      kind: "message",
      text: txt,
      tool: null,
      state_update: null
    });
  }

  const base = path.basename(file);
  return {
    conversation_id: base.replace(/\.jsonl$/, ""),
    title: base.replace(/\.jsonl$/, ""),
    case_id: ERIC_CASE_MAP[base] || null,
    source_group: "Eric",
    source_file: file.replace(ROOT + path.sep, ""),
    steps
  };
}

function scoreAssistantMessage(text) {
  const t = normalizeText(text);
  const wc = words(t);
  const qCount = (t.match(/\?/g) || []).length;

  let D1 = 0;
  if (wc <= 25) D1 = 2;
  else if (wc <= 45) D1 = 1;

  const strongValue = /(ddp|moq|factory|material|budget|target|shipping|logistics|custom|quote|range|\$\d+|pkr|usd|rm|peso)/i.test(t);
  const moderateValue = /(great|understood|help|pick|choose|upload|skip|finalize|continue|analysis|close)/i.test(t);
  const D2 = strongValue ? 2 : moderateValue ? 1 : 0;

  const strongQual = qCount > 0 && /(quantity|budget|destination|timeline|logo|design|product|material|size|units|deliver|spec|email|call|zoom)/i.test(t);
  const weakQual = qCount > 0;
  const D3 = strongQual ? 2 : weakQual ? 1 : 0;

  let D4 = 0;
  if (qCount <= 1 && wc <= 40) D4 = 2;
  else if (qCount <= 2 && wc <= 70) D4 = 1;

  let D5 = 0;
  if (/(next|continue|pick|choose|fill|finalize|what product|how many|where|tell me|upload|skip|share|analysis|close|closed|reach out)/i.test(t)) D5 = 2;
  else if (/(help|can source|we can|no worries)/i.test(t)) D5 = 1;

  const score = D1 + D2 + D3 + D4 + D5;
  return { score, dimensions: { D1, D2, D3, D4, D5 } };
}

function conversationText(conv, role) {
  return conv.steps
    .filter((s) => (!role || s.role === role) && s.kind === "message")
    .map((s) => s.text)
    .join("\n");
}

function inferEndpoint(conv) {
  const assistantText = lower(conversationText(conv, "assistant"));

  if (/let's finalize|fill in your details below|contact form|sourcing request confirmed/.test(assistantText)) return "COMPLETE_SR";
  if (/zoom call|schedule|connect you|human|whatsapp expert|call you/.test(assistantText)) return "HUMAN_HANDOFF";
  if (/this chat handles sourcing only|check .*careers|can't source branded|cannot source branded|can't ship internationally|dangerous goods|dangerous-goods|restricted|restrictions|decline this request|request stays closed|must decline|can't support battery|cannot support battery|buying from a local craft supplier|not worth risking/.test(assistantText)) return "EXIT_POLITE";
  if (/when you're ready to scale|research|start with|rough budget/.test(assistantText)) return "EDUCATE_AND_NURTURE";
  return "QUALIFY_AND_ADVANCE";
}

function evaluateCheck(checkId, conv, expectedEndpoint) {
  const userText = lower(conversationText(conv, "user"));
  const assistantText = lower(conversationText(conv, "assistant"));
  const messageSteps = conv.steps.filter((s) => s.kind === "message");
  const assistantMessages = messageSteps.filter((s) => s.role === "assistant");
  const toolCalls = conv.steps.filter((s) => s.kind === "tool_call");

  if (checkId === "CK-001") {
    if (!toolCalls.length) return null;
    const firstAssistant = assistantMessages[0] ? lower(assistantMessages[0].text) : "";
    const firstToolIdx = firstIndex(conv.steps, (s) => s.kind === "tool_call");
    const firstAssistantIdx = firstIndex(conv.steps, (s) => s.kind === "message" && s.role === "assistant");
    return /reference image|upload one|say skip/.test(firstAssistant) && (firstToolIdx === -1 || firstToolIdx > firstAssistantIdx);
  }

  if (checkId === "CK-002") {
    if (!toolCalls.length) return null;
    const imageOrSkip = conv.steps.some((s) => s.role === "user" && s.kind === "message" && /\[reference image uploaded\]|skip|no image|i don't have/i.test(s.text));
    if (!imageOrSkip) return null;
    const idxUser = firstIndex(conv.steps, (s) => s.role === "user" && s.kind === "message" && /\[reference image uploaded\]|skip|no image|i don't have/i.test(s.text));
    const idxPi = firstIndex(conv.steps, (s) => s.kind === "tool_call" && s.tool === "productIntelligence");
    return idxPi !== -1 && idxPi > idxUser;
  }

  if (checkId === "CK-003") {
    if (!toolCalls.length) return null;
    const seq = toolCalls.map((t) => t.tool).filter(Boolean);
    const a = seq.indexOf("productIntelligence");
    const b = seq.indexOf("pricingIntelligence");
    const c = seq.indexOf("visualConceptGeneration");
    return a !== -1 && b !== -1 && c !== -1 && a < b && b < c;
  }

  if (checkId === "CK-004") {
    if (!toolCalls.length) return null;
    const step1DoneIdx = firstIndex(
      conv.steps,
      (s) =>
        (s.kind === "state_transition" && /step1Complete\s*=\s*true/i.test(String(s.state_update || ""))) ||
        (s.kind === "message" && s.role === "user" && /confirmed customizations/i.test(s.text))
    );
    if (step1DoneIdx === -1) return null;
    return !conv.steps.some(
      (s, i) => i < step1DoneIdx && s.kind === "tool_call" && (s.tool === "pricingIntelligence" || s.tool === "visualConceptGeneration")
    );
  }

  if (checkId === "CK-005") {
    if (!/catalog|what is sourcy|who is sourcy|trust|qc|proof/i.test(userText)) return null;
    return /(no tenemos cat|we don't have.*catalog|work direct|quality|qc)/i.test(assistantText) && /\?/.test(assistantText);
  }

  if (checkId === "CK-006") {
    if (!/battery|batteries|lithium|dangerous goods|iata/.test(userText)) return null;
    const decline = /can't ship|cannot ship|dangerous goods|dangerous-goods|restricted|restrictions|seizure risk|we'd rather not risk|must decline|request closed|can't support battery|cannot support battery/.test(assistantText);
    const pushback = /no problem|importing|allowed/.test(userText);
    if (!pushback) return decline;
    const afterPushback = conv.steps
      .filter((s) => s.role === "assistant" && s.kind === "message")
      .slice(-1)
      .map((s) => lower(s.text))
      .join(" ");
    return decline && /can't|cannot|risk|dangerous|restrictions|decline|closed|can't support battery|cannot support battery/.test(afterPushback);
  }

  if (checkId === "CK-007") {
    if (!/airpods|apple|branded|brand(ed)? product/.test(userText)) return null;
    return /can't source branded|cannot source branded|ip|apple/.test(assistantText) && /similar|tws|alternative|ready-stock/.test(assistantText);
  }

  if (checkId === "CK-008") {
    if (!/budget|target price|target|price|moq|profit|pesos|pkr|rm/.test(userText)) return null;
    return /below|tight margin|lowest realistic|cannot|can't|raw material cost|~\$\d+|usd/.test(assistantText);
  }

  if (checkId === "CK-009") {
    if (!/pesos|pkr|rm|rupee|rupees/.test(userText)) return null;
    return /usd|~\$|dollar|which currency/.test(assistantText);
  }

  if (checkId === "CK-010") {
    if (!/zoom|call|human/.test(userText)) return null;
    return /zoom|connect|call|schedule|email/.test(assistantText);
  }

  if (checkId === "CK-011") {
    const asksContact = /name|email|company|phone/.test(assistantText);
    const hasStage4 = conv.steps.some((s) => /stage4/i.test(String(s.stage || "")) || /let's finalize/.test(lower(s.text)));
    if (!asksContact) return true;
    return hasStage4;
  }

  if (checkId === "CK-012") {
    if (!assistantMessages.length) return false;
    const avgWords = mean(assistantMessages.map((m) => words(m.text)));
    const maxWords = Math.max(...assistantMessages.map((m) => words(m.text)));
    return avgWords <= 40 && maxWords <= 80;
  }

  if (checkId === "CK-013") {
    const hasCards = conv.steps.some((s) => s.kind === "tool_result");
    if (!hasCards) return null;
    return !assistantMessages.some((m) => (m.text.match(/\$\d/g) || []).length >= 3);
  }

  if (checkId === "CK-014") {
    const formIdx = firstIndex(conv.steps, (s) => s.role === "user" && s.kind === "message" && /quantity:.*destination:.*timeline:/i.test(s.text));
    if (formIdx === -1) return null;
    const later = conv.steps.slice(formIdx + 1, formIdx + 5);
    return later.some((s) => s.kind === "tool_call" && s.tool === "feasibilityAssessment");
  }

  if (checkId === "CK-015") {
    const actual = inferEndpoint(conv);
    return actual === expectedEndpoint;
  }

  if (checkId === "CK-016") {
    const addIdx = firstIndex(conv.steps, (s) => s.role === "user" && s.kind === "message" && /add another product/i.test(s.text));
    if (addIdx === -1) return null;
    const nextAssistant = conv.steps.slice(addIdx + 1).find((s) => s.role === "assistant" && s.kind === "message");
    return !!nextAssistant && /next product|tell me about your next product/i.test(nextAssistant.text);
  }

  if (checkId === "CK-017") {
    const finalizeIdx = firstIndex(conv.steps, (s) => s.role === "user" && s.kind === "message" && /finalize|ready/i.test(s.text));
    if (finalizeIdx === -1) return null;
    const laterAssistant = conv.steps.slice(finalizeIdx + 1).find((s) => s.role === "assistant" && s.kind === "message");
    return !!laterAssistant && /let's finalize|fill in your details below|contact/i.test(lower(laterAssistant.text));
  }

  if (checkId === "CK-018") {
    return !/100% guaranteed|always works|zero risk|official apple airpods from factory/i.test(assistantText);
  }

  if (checkId === "CK-019") {
    const correctionIdx = firstIndex(conv.steps, (s) => s.role === "user" && s.kind === "message" && /(not|instead|correction)/i.test(s.text));
    if (correctionIdx === -1) return null;
    return conv.steps.slice(correctionIdx + 1).some((s) => s.kind === "tool_call" && s.tool === "productIntelligence");
  }

  if (checkId === "CK-020") {
    const lowIntentCue = /job|hiring|spam|crypto|top-up|not sourcing|no product/.test(userText);
    if (!lowIntentCue) return null;
    return /sourcing only|check .*careers|can't help with that|if you need product sourcing/.test(assistantText);
  }

  if (checkId === "CK-021") {
    const directionless = /you tell me|i am open|hi\b/.test(userText);
    if (!directionless) return null;
    const qualifiers = assistantMessages.filter((t) => /\?/.test(t.text)).length;
    return qualifiers <= 2;
  }

  if (checkId === "CK-022") {
    const scopeJump = /packaging|logistics|shipping/.test(userText) && /product|goods|handwash|item/.test(userText);
    if (!scopeJump) return null;
    return /start with|first.*(product|packaging)|let's focus/.test(assistantText);
  }

  if (checkId === "CK-023") {
    if (!/beginner|just starting|new|haven't started|no website/.test(userText)) return null;
    return !/can't help.*no website|need registered company/.test(assistantText);
  }

  if (checkId === "CK-024") {
    if (!/abuse|idiot|stupid|fuck|pubg|top-up/.test(userText)) return null;
    return !/abuse|insult/.test(assistantText);
  }

  return null;
}

function checkImprovementHint(checkId) {
  const map = {
    "CK-001": "Start stage 1 by asking for reference image before any tool call.",
    "CK-002": "After image/skip response, call productIntelligence immediately.",
    "CK-003": "Keep strict stage-2 tool order: PI -> Pricing -> Visual.",
    "CK-004": "Never call pricing/visual before step1Complete=true.",
    "CK-005": "Answer trust question directly, then ask one qualifier.",
    "CK-006": "Hold restricted request firm under pushback and keep closed ending.",
    "CK-007": "Decline branded/IP products and offer compliant alternatives.",
    "CK-008": "Show honest budget math with realistic floor.",
    "CK-009": "Clarify ambiguous currencies before conclusions.",
    "CK-010": "Provide direct call/human handoff when requested.",
    "CK-011": "Avoid asking contact details before stage 4.",
    "CK-012": "Shorten messages to concise transition style.",
    "CK-013": "Avoid repeating card numbers in assistant text.",
    "CK-014": "Call feasibility immediately after structured form submit.",
    "CK-015": "Align ending behavior with expected endpoint.",
    "CK-016": "Use clean add-another-product reset to stage 1.",
    "CK-017": "Use exact stage-4 finalize transition and stop.",
    "CK-018": "Remove fabricated guarantees/capabilities.",
    "CK-019": "On correction, re-run productIntelligence.",
    "CK-020": "Use polite scope exit for non-buyer/low-intent.",
    "CK-021": "Use one concise qualifier for directionless users.",
    "CK-022": "Anchor one scope when user jumps across layers.",
    "CK-023": "Do not reject early-stage but cooperative founders.",
    "CK-024": "Keep professional safe exit on hostile irrelevant chats."
  };
  return map[checkId] || "Address this required check explicitly.";
}

function generateImprovementSuggestions(row) {
  const out = [];

  if (row.endpoint_match === false) {
    out.push(`Endpoint mismatch: expected ${row.expected_endpoint}, got ${row.actual_endpoint}. End with explicit ${row.expected_endpoint} behavior.`);
  }

  for (const chk of row.required_checks || []) {
    if (chk.result === false) out.push(`Fix ${chk.id}: ${checkImprovementHint(chk.id)}`);
  }

  const dimAvg = {
    D1: round(mean((row.turn_scores || []).map((t) => t.dimensions.D1))),
    D2: round(mean((row.turn_scores || []).map((t) => t.dimensions.D2))),
    D3: round(mean((row.turn_scores || []).map((t) => t.dimensions.D3))),
    D4: round(mean((row.turn_scores || []).map((t) => t.dimensions.D4))),
    D5: round(mean((row.turn_scores || []).map((t) => t.dimensions.D5)))
  };

  if ((row.quality_average || 0) < 7) {
    if (dimAvg.D1 < 1.6) out.push("Shorten longer assistant turns; keep under transition-length target.");
    if (dimAvg.D2 < 1.6) out.push("Increase concrete value per turn (constraint, range, or rationale).");
    if (dimAvg.D3 < 1.2) out.push("Add one qualification/routing question where flow allows.");
    if (dimAvg.D4 < 1.6) out.push("Reduce multi-branch wording; keep one move per turn.");
    if (dimAvg.D5 < 1.6) out.push("End each assistant turn with clear next-step language.");
  }

  if ((row.required_checks_fail || 0) === 0 && row.pass === false) {
    out.push("Required checks are passing; focus on per-turn quality lift above 7.0.");
  }

  const dedup = [];
  for (const s of out) if (!dedup.includes(s)) dedup.push(s);
  if (!dedup.length) {
    dedup.push("Maintain this pattern as golden. Keep concise transition messages with explicit next-step cues.");
  }
  return dedup.slice(0, 5);
}

function evaluateConversation(conv, caseMeta) {
  const assistantTurns = conv.steps.filter((s) => s.role === "assistant" && s.kind === "message");
  const turnScores = assistantTurns.map((t) => ({ seq: t.seq, ...scoreAssistantMessage(t.text) }));
  const qualityAverage = round(mean(turnScores.map((t) => t.score)));

  const requiredChecks = caseMeta ? caseMeta.must_pass_checks || [] : [];
  const checkResults = requiredChecks.map((id) => ({
    id,
    result: evaluateCheck(id, conv, caseMeta ? caseMeta.expected_endpoint : null)
  }));

  const passCount = checkResults.filter((c) => c.result === true).length;
  const failCount = checkResults.filter((c) => c.result === false).length;
  const naCount = checkResults.filter((c) => c.result === null).length;
  const denom = passCount + failCount;
  const requiredCheckPassRate = denom ? round((passCount / denom) * 100) : 0;
  const checkScore = denom ? round((passCount / denom) * 10) : 0;

  const actualEndpoint = inferEndpoint(conv);
  const expectedEndpoint = caseMeta ? caseMeta.expected_endpoint : null;
  const endpointMatch = expectedEndpoint ? actualEndpoint === expectedEndpoint : null;

  const composite = round(qualityAverage * 0.6 + checkScore * 0.4);
  const pass = qualityAverage >= 7 && failCount === 0 && (endpointMatch !== false);

  const row = {
    conversation_id: conv.conversation_id,
    title: conv.title,
    source_group: conv.source_group,
    source_file: conv.source_file,
    case_id: conv.case_id,
    expected_endpoint: expectedEndpoint,
    actual_endpoint: actualEndpoint,
    endpoint_match: endpointMatch,
    assistant_turns: assistantTurns.length,
    quality_average: qualityAverage,
    required_checks: checkResults,
    required_checks_pass: passCount,
    required_checks_fail: failCount,
    required_checks_na: naCount,
    required_check_pass_rate: requiredCheckPassRate,
    check_score: checkScore,
    composite_score: composite,
    pass,
    score_mode: "same-definition-heuristic-v1",
    turn_scores: turnScores
  };

  row.improvement_suggestions = generateImprovementSuggestions(row);
  return row;
}

function summarizeGroup(label, source, rows) {
  return {
    label,
    source,
    count: rows.length,
    quality_average: round(mean(rows.map((r) => r.quality_average))),
    check_average: round(mean(rows.map((r) => r.check_score))),
    composite_average: round(mean(rows.map((r) => r.composite_score))),
    pass_rate: round((rows.filter((r) => r.pass).length / Math.max(1, rows.length)) * 100),
    endpoint_match_rate: round(
      (rows.filter((r) => r.endpoint_match === true).length /
        Math.max(1, rows.filter((r) => r.endpoint_match !== null).length)) *
        100
    ),
    items: rows
  };
}

function main() {
  const casesData = readJson(CASES_FILE);
  const casesById = Object.fromEntries((casesData.cases || []).map((c) => [c.case_id, c]));
  const checksById = Object.fromEntries((casesData.check_definitions || []).map((c) => [c.id, c]));
  const awsafSeed = readJson(AWSAF_TRANSCRIPTS_FILE);

  const awsafConversations = (awsafSeed.transcripts || []).map(normalizeAwsafConversation);
  const awsafRows = awsafConversations
    .map((conv) => evaluateConversation(conv, casesById[conv.case_id] || null))
    .slice(0, 5);

  const ericFiles = Object.keys(ERIC_CASE_MAP)
    .map((name) => path.join(ERIC_RESULTS_DIR, name))
    .filter((f) => fs.existsSync(f));

  const ericConversations = ericFiles.map(normalizeEricConversation);
  const ericRows = ericConversations.map((conv) => evaluateConversation(conv, casesById[conv.case_id] || null));

  const awsafGroup = summarizeGroup("Awsaf Golden Transcripts", "tests/golden-eugene-v1/transcripts.seed.json", awsafRows);
  const ericGroup = summarizeGroup("Eric Chat Examples (v7)", "tests/run-v7/results/*.jsonl", ericRows);

  const awsafDelta = {
    quality_average: round(awsafGroup.quality_average - BASELINE_AWSAF_V01.quality_average),
    check_average: round(awsafGroup.check_average - BASELINE_AWSAF_V01.check_average),
    composite_average: round(awsafGroup.composite_average - BASELINE_AWSAF_V01.composite_average),
    pass_rate: round(awsafGroup.pass_rate - BASELINE_AWSAF_V01.pass_rate),
    endpoint_match_rate: round(awsafGroup.endpoint_match_rate - BASELINE_AWSAF_V01.endpoint_match_rate)
  };

  const payload = {
    dataset_name: "golden-eugene-v1-eval-comparison",
    version: "0.3.0",
    generated_at: new Date().toISOString(),
    threshold: {
      quality_average_min: 7,
      required_check_fail_max: 0,
      endpoint_match_required: true
    },
    judge_mode: "same-definition-heuristic-v1 (shared evaluator for Awsaf and Eric)",
    notes: [
      "Both sets are scored with the same turn-quality rubric and the same required-check logic.",
      "Required checks come from each mapped case's must_pass_checks in cases.seed.json.",
      "Eric examples are mapped to GD cases to enforce endpoint and policy alignment under one definition.",
      "Awsaf baseline reference (v0.1) is included to show post-improvement transcript lift after rerun."
    ],
    framework: {
      source_checks_file: "tests/golden-eugene-v1/cases.seed.json",
      check_ids: Object.keys(checksById),
      scoring_formula: "composite = 0.6 * quality_average + 0.4 * check_score"
    },
    mappings: {
      eric_case_map: ERIC_CASE_MAP
    },
    awsaf_baseline_v01: BASELINE_AWSAF_V01,
    awsaf_delta_vs_v01: awsafDelta,
    groups: [awsafGroup, ericGroup]
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log("Generated " + OUTPUT_FILE);
}

main();
