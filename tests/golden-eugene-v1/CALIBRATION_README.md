# Judge Calibration (Tier 1 + Tier 2)

The GPT judge uses D1–D5 dimension definitions plus **calibration examples** (see `GPT_JUDGE_PROMPT.md`) to set the scoring bar. For higher consistency, use a two-tier approach:

## Tier 1: Full-context agent (calibration reference)

- **Who:** A full-context agent (e.g. Claude Opus 4 in Cursor) with access to the full business context, rubric, channel awareness, and lead behavior patterns.
- **What:** Scores the **top 10** golden cases deeply, with reasoning per turn.
- **Output:** A JSON file (e.g. `calibration_tier1_top10.json`) containing turn-level scores, dimension breakdowns, and short reasons. This becomes the calibration reference.
- **When:** Run once per prompt version or when the rubric changes.

## Tier 2: Lightweight prompt judge (scale)

- **What:** The current GPT judge prompt in `GPT_JUDGE_PROMPT.md`, optionally seeded with scored examples taken from Tier 1 output.
- **When:** Runs on all golden cases (e.g. 27) on every commit or prompt change.
- **Calibration:** The prompt already includes concrete scored examples (D1, D2, D4) in the "Calibration examples" section. When Tier 1 output exists, you can add 1–2 full-turn examples from it into the prompt to further align Tier 2 with Tier 1.

## Optional: Tier 2 vs Tier 1 comparison

If `calibration_tier1_top10.json` exists, a small script or manual step can compare Tier 2 scores to Tier 1 on those 10 cases. If the average dimension delta exceeds a threshold (e.g. 0.5), flag for human review. This does not block builds; it is for quality assurance.

## Collaborative workflow

- **Eric (or rubric owner):** Runs Tier 1 on the top 10 golden cases and shares the scored output.
- **Eugene (or eval owner):** Integrates Tier 1 examples into the judge prompt and runs Tier 2 at scale. If divergence is high, review and adjust.

## Files

- `GPT_JUDGE_PROMPT.md` — Tier 2 prompt with rubric + calibration examples.
- `calibration_tier1_top10.json` — (optional) Tier 1 output for the top 10 cases.
- This file — process and roles.
