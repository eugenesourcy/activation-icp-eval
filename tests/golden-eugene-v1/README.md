# Golden Dataset (Eugene V1)

This folder defines a review-first golden dataset for Unified Activation.

Purpose:
- Align team on what "good behavior" looks like before running model evals
- Lock expected outcomes per scenario
- Prevent judge drift by constraining persona behavior and expected stage/tool flow

Golden references exist for **both** architectures. **Golden WA** = text-based, handoff-to-team conversations (Eric v7 style). **Golden Web** = cards, in-bot SR completion (Awsaf style). Both can score 10/10 on D1–D5; the eval recognizes both as valid. Transcripts in `transcripts.seed.json` use `golden_type`: `"web"` or `"wa"`.

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

## Eval Layers (Outcome vs Process)

Conversation eval uses **outcome-based** checks only (Layer 1). Pipeline/tool-order checks are **integration** (Layer 2) and are not used for conversation pass/fail.

- **Conversation layer:** CK-005, CK-006, CK-007, CK-008, CK-009, CK-010, CK-015, CK-018, CK-019, CK-020, CK-021, CK-022, CK-023, CK-024. These measure value delivery, policy compliance, endpoint correctness, and exit/handoff behavior.
- **Integration layer:** CK-001, CK-002, CK-003, CK-004, CK-011, CK-012, CK-013, CK-014, CK-016, CK-017. These validate Awsaf's staged pipeline (image-before-tools, tool order, cards, stage-4 flow). Run separately for pipeline verification; not part of conversation rubric.

Each case's `must_pass_checks` in `cases.seed.json` contains only conversation-layer IDs for the conversation eval. Integration checks can be run in a separate report (e.g. `build-integration-report.js`) if needed.

## Adding completed-SR conversations

The golden dataset should include **completed-SR** conversations (lead provided specs, got pricing, committed). The current set is skewed toward exit/qualify outcomes. To improve coverage:

1. **Export** completed-SR conversations from Sourcy's live operations (where leads went through the full journey and committed).
2. **Add** transcripts to `context/Good/` or a dedicated folder; add new cases in `cases.seed.json` with `expected_endpoint: "COMPLETE_SR"` (or `acceptable_endpoints` including `COMPLETE_SR`) and link to those transcripts.
3. **Balance** coverage: aim for a mix of SR-complete, qualify-and-advance, and exit-polite cases so the eval can measure "did the bot drive to SR completion?" reliably.
