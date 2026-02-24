# Golden Dataset (Eugene V1)

This folder defines a review-first golden dataset for Unified Activation.

Purpose:
- Align team on what "good behavior" looks like before running model evals
- Lock expected outcomes per scenario
- Prevent judge drift by constraining persona behavior and expected stage/tool flow

## Files

- `cases.seed.json` — Seed cases for team review (real-grounded + synthetic)
- `transcripts.seed.json` — Exemplar transcripts used for team calibration
- `SCHEMA.md` — Case schema and field definitions

## How to Render Team Review HTML

From repo root:

```bash
node scripts/build-golden-review.js
```

Then open (unified cases + transcripts):

`file:///Users/eugeneclarance/Downloads/activation-icp-eval/golden_dataset_review.html`

Note: `golden_dataset_review.html` is the primary single-page review artifact. It includes linked transcript timelines inside each case detail.

Transcript-only page (`golden_transcripts_review.html`) is deprecated for this workflow.

To render proposed eval-framework review:

```bash
node scripts/build-golden-eval-review.js
```

Then open:

`file:///Users/eugeneclarance/Downloads/activation-icp-eval/golden_eval_review.html`

## Review Workflow

1. Review each case's expected endpoint and tool/stage path
2. Confirm must-pass and hard-fail checks match business logic
3. Mark `review_status` as `locked` only when the team agrees
4. Expand case count only after seed set is stable

Current seed status:
- 27 cases (GD-001 to GD-027)
- Behavior buckets covered: B1-B6
