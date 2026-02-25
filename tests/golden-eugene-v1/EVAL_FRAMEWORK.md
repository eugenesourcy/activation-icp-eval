# Eval Framework — Handover Reference

Single-page guide for anyone picking up this eval framework (Ziya, new team members).

## File Map

```
tests/
  ASSESSMENT_RUBRIC.md         — D1-D5 scoring definitions (the rubric)
  golden-eugene-v1/
    cases.seed.json            — 27 golden cases (personas, hidden truths, checks)
    transcripts.seed.json      — Exemplar transcripts linked to cases
    SCHEMA.md                  — Case JSON schema + field definitions
    GPT_JUDGE_PROMPT.md        — Prompt template for the automated GPT judge
    CALIBRATION_README.md      — Two-tier calibration strategy (agent vs prompt judge)
    README.md                  — Dataset overview, gaps, and workflow
    EVAL_FRAMEWORK.md          — This file

scripts/
  build-eval-comparison.js     — Scores Awsaf + Eric transcripts → eval_comparison.seed.json
  build-golden-eval-review.js  — Generates golden_eval_review.html (comparison dashboard)
  build-golden-review.js       — Generates golden_dataset_review.html (case catalog + detail)
  build-deep-dive.js           — Generates icp_eval_deep_dive.html
  migrate-cases-layer.js       — One-time: added layer/channel fields to cases
  migrate-buckets.js           — One-time: remapped B1-B6 to Eric's taxonomy

workspace/
  AGENTS.md                    — Bot operational rules (v7 prompt)
  SOUL.md                      — Bot identity and knowledge (v7 prompt)
```

## How to Run Evals

1. **Regenerate all reports** (from repo root):

```bash
node scripts/build-eval-comparison.js
node scripts/build-golden-eval-review.js
node scripts/build-golden-review.js
```

2. **View results:**
   - `golden_dataset_review.html` — Case catalog with filters (bucket, persona, etc.)
   - `golden_eval_review.html` — Side-by-side Awsaf vs Eric transcript scoring
   - `icp_eval_dashboard.html` — Version-over-version score progression

3. **Deploy** (if Vercel is connected): push to `main` branch or run `npx vercel --prod`.

## How to Add a New Case

1. Open `cases.seed.json`.
2. Copy an existing case object as a template.
3. Fill in required fields (see `SCHEMA.md` for the full schema):
   - `case_id`: next sequential ID (e.g. `GD-028`)
   - `title`: short human-readable description
   - `behavior_bucket`: one of B1-B6 (see taxonomy below)
   - `channel`: `"web"` or `"WA"`
   - `persona_profile`: what they want/know/don't know, communication style
   - `hidden_truth`: quantity, budget, destination, timeline, flexibility
   - `allowed_disclosures_by_turn`: what the persona reveals at each turn (T1, T2, T3+)
   - `must_pass_checks`: array of conversation-layer check IDs
   - `expected_endpoint`: primary expected outcome
   - `acceptable_endpoints` (optional): array if multiple outcomes are valid
4. Set `review_status: "draft"` until team reviews.
5. Re-run the build scripts to see the case in the HTML dashboard.

## Behavior Buckets (Eric's Taxonomy)

| Bucket | Name | Description |
|--------|------|-------------|
| B1 | Budget / Quantity Challenge | Lead has a product but budget or MOQ is unrealistic |
| B2 | Vague / No Specs | Lead has not specified a product; bot should draw out specs |
| B3 | Qualified / Defined Product | Lead has real product, specs, and/or budget; drive toward SR |
| B4 | Restricted / Impossible Product | Product is restricted, not sourceable, or non-physical |
| B5 | Branded / IP Products | Lead asking for a branded product; clarify sourcing limitations |
| B6 | Ghost / Non-responsive | Lead stopped responding; follow up once, then exit |

Current distribution: B1=5, B2=4, B3=12, B4=3, B5=0, B6=3.

## How to Modify the Rubric

The rubric lives in `tests/ASSESSMENT_RUBRIC.md` (D1-D5 definitions). The GPT judge prompt is in `GPT_JUDGE_PROMPT.md`.

To change scoring:
1. Edit the dimension definition in `ASSESSMENT_RUBRIC.md`.
2. Update the matching calibration example in `GPT_JUDGE_PROMPT.md`.
3. Re-run `build-eval-comparison.js` to regenerate scores.

To add a new binary check:
1. Add the check definition in the `check_definitions` array at the top of `cases.seed.json`.
2. Set `layer: "conversation"` or `"integration"`.
3. Add the check ID to relevant cases' `must_pass_checks`.
4. Update the `evaluateCheck` function in `build-eval-comparison.js` with the check logic.

## Eval Layers

- **Conversation layer** (used by GPT judge): D1-D5 scoring + conversation-layer checks (CK-005 through CK-024 subset). Measures chat quality and outcomes.
- **Integration layer** (future runner): CK-001 through CK-017 subset. Validates tool order, stage transitions, card rendering. Not part of conversation pass/fail.

## Common Pitfalls

1. **Don't mix layers.** The conversation eval should only use conversation-layer checks. Integration checks (tool order, image-before-PI) are a separate concern.
2. **Endpoint ranges.** Use `acceptable_endpoints` + `must_not_reach` for cases where multiple outcomes are valid. Don't force a single `expected_endpoint` when the scenario legitimately has two paths.
3. **Channel matters.** WA cases skip CK-012 (card display) and CK-013 (concise-web format) because those are web-UI specific. Set `channel: "WA"` to enable this.
4. **Calibration drift.** The GPT judge prompt has calibration examples for D1-D5. If scoring seems off, check that the examples still match the rubric definitions. Update them together.
5. **Missing transcripts.** Cases without linked transcripts can't be scored. Check `linked_transcript_count` in the dashboard to find gaps.
6. **B5 gap.** There are currently no B5 (Branded/IP) cases. When adding one, use the Foxmont Owala conversation as a reference.
