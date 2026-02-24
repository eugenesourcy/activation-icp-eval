# Sourcy Bot v7 — Test Run Summary

**Date:** 2026-02-16
**Prompt version:** v7 (AGENTS.md + SOUL.md in workspace/)
**Model:** anthropic/claude-opus-4-6, thinking: low
**Assessment rubric:** tests/ASSESSMENT_RUBRIC.md (5 dimensions x 0-2, max 10/turn)
**Threshold:** avg >= 7.0/10 per conversation + all binary checks pass
**Result:** 8/8 PASS — overall avg 8.8/10

---

## Aggregate Scores


| Persona                      | Type | Turns  | Avg Score | Pass?   | v6b Score | Delta |
| ---------------------------- | ---- | ------ | --------- | ------- | --------- | ----- |
| Anam (zero-spec dreamer)     | Core | 5      | 7.8       | PASS    | 4.8 FAIL  | +3.0  |
| femmoraaa (IG jewelry teen)  | Core | 3      | 9.0       | PASS    | 7.3 PASS  | +1.7  |
| Jesus (sportswear Mexico)    | Core | 3      | 8.0       | PASS    | 6.3 FAIL  | +1.7  |
| Syed (handwash Karachi)      | Core | 2      | 8.5       | PASS    | 8.0 PASS  | +0.5  |
| Battery (restricted + fuses) | Core | 2      | 8.5       | PASS    | 8.0 PASS  | +0.5  |
| Anthony (AirPods reseller)   | Core | 2      | 9.0       | PASS    | -         | new   |
| Jammaica (call handoff)      | Core | 1      | 10.0      | PASS    | -         | new   |
| Candle (hobby student)       | Core | 2      | 8.5       | PASS    | -         | new   |
| **Overall**                  |      | **20** | **8.8**   | **8/8** |           |       |


## Binary Checks


| Check       | Anam | femmo | Jesus | Syed | Battery | Anthony | Jammaica | Candle |
| ----------- | ---- | ----- | ----- | ---- | ------- | ------- | -------- | ------ |
| RESTRICTED  | N/A  | N/A   | N/A   | N/A  | Y       | Y       | N/A      | N/A    |
| BUDGET_MATH | N/A  | Y     | Y     | Y    | N/A     | Y       | N/A      | Y      |
| EXIT_DOOR   | N/A  | N/A   | N/A   | Y    | N/A     | N/A     | N/A      | Y      |
| LANGUAGE    | Y    | Y     | Y     | Y    | Y       | Y       | Y        | Y      |
| FORMAT_OK   | Y    | Y     | Y     | Y    | Y       | Y       | Y        | Y      |


All binary checks pass.

## Key Wins in v7

1. **Prices-first rule** (highest-leverage single change in the series): Anam T2 went from 1/10 to 9/10. Jesus T2 went from generic to gold standard. Every time a lead names a category, they now get a price range in the first response.
2. **Catalog/process one-liners**: Jesus T1 went from a multi-line reframe to "No catalog - we source to your specs. What product?" femmoraaa T3 eliminated the process dump entirely.
3. **Message length**: 17/20 turns at 1-3 lines. 3 turns at 4 lines (pushback responses from Syed T2, Battery T2, Candle T2). Zero turns at 5+ lines.
4. **New personas confirmed no regressions**: Anthony (branded + exit), Jammaica (call handoff), Candle (hobby exit) all gold standard.

## Remaining Gaps

1. **Jesus T1 catalog response** (5/10): One-liner is correct but still delivers zero prices. Could lead with the product category price if detectable.
2. **Syed double-question** on both turns: Minor discipline violation. "Would that work? How many units?"
3. **No test-set coverage**: The 6 adversarial personas from v4 (Ghost, Alibaba Veteran, Burned Buyer, Price Shopper, Researcher, Ad-Click Confused) were not re-run. Recommend adding in next round.

## Version Progression


| Version | Personas  | Pass Rate    | Avg Lines | Key Change                                     |
| ------- | --------- | ------------ | --------- | ---------------------------------------------- |
| v1      | 6         | 4/6 (67%)    | 12-18     | Baseline                                       |
| v2      | 8         | 7/8 (88%)    | 10-15     | Call handoff, budget math                      |
| v3      | 8         | 8/8 (100%)   | 8-12      | WHY enforcement, restricted products           |
| v3-test | 6 (new)   | 6/6 (100%)   | 8-12      | Generalization confirmed                       |
| v4      | 14        | Issues found | 6-10      | Strict persona testing exposed gaps            |
| v5      | 4 (fixes) | 4/4 fixes    | 6-10      | Absolute restrictions, estimate budgets, exits |
| v6b     | 5         | 3/5 (60%)    | 2-5       | Per-turn priority, hard cap (stricter rubric)  |
| v7      | 8         | 8/8 (100%)   | 1-4       | Prices-first, one-liner rules, examples        |


## Prompt Changes (v6 -> v7)

1. Added "Prices First" section: when lead names a category, FIRST response must include price range.
2. Added "One-Line Answers" section: catalog and process questions get one-line answers.
3. Added concrete examples of correct 2-3 line messages to the Hard Cap section.
4. Simplified Catalog Requests section to match one-liner rule.

