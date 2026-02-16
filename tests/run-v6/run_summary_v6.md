# Test Run v6b - Per-Turn Priority + Hard Message Cap (2026-02-16)

Prompt version: v6b (SOUL.md + AGENTS.md in sourcy/workspace/)
Assessment rubric: sourcy/tests/ASSESSMENT_RUBRIC.md (5 dimensions x 0-2, max 10/turn)
Passing threshold: average >= 7.0 across all turns + all binary checks pass.

## Changes from v5

1. New "One Rule": "If this is the last message the lead reads, did we hook them or learn if they're worth chasing?"
2. Per-Turn Priority: wow > qualify > advance SR. Process/logistics/reframing = filler.
3. Hard Cap: 2-3 lines per message, overrides all other principles.
4. Embedded WHY: natural sentences, not formulaic parentheticals.
5. "One fact per turn" replaces "show expertise immediately" (which caused info dumps).

## Aggregate Scores

| Persona | Turns | Avg Score | Pass? | Weakest Turn | Strongest Turn |
|---------|-------|-----------|-------|--------------|----------------|
| Anam | 5 | 4.8 | FAIL | T2 (1/10) | T4 (9/10) |
| femmoraaa | 3 | 7.3 | PASS | T3 (4/10) | T1-T2 (9/10) |
| Jesus | 3 | 6.3 | FAIL | T1 (4/10) | T2 (8/10) |
| Syed | 2 | 8.0 | PASS | - | Both (8/10) |
| Battery | 2 | 8.0 | PASS | - | T1 (9/10) |

**Overall: 3/5 PASS, 2/5 FAIL. Average across all 15 turns: 6.5/10.**

## Binary Checks

| Check | Anam | femmoraaa | Jesus | Syed | Battery |
|-------|------|-----------|-------|------|---------|
| RESTRICTED_HOLD | N/A | N/A | N/A | N/A | Y |
| BUDGET_MATH | N/A | Y | Y | Y | N/A |
| EXIT_DOOR | N/A | N/A | N/A | Y | N/A |
| LANGUAGE_MATCH | Y | Y | Y | Y | Y |
| FORMAT_OK | Y | N (T3) | N (T3) | N (length) | N (T2 length) |

## Dimension Breakdown (averaged across all 15 turns)

| Dimension | Avg Score | Notes |
|-----------|-----------|-------|
| D1 Length | 1.3/2 | 9/15 turns meet 3-line cap. 6 turns at 4-6 lines. |
| D2 Value | 1.3/2 | Most turns deliver value. Anam T2-T3 and Jesus T1 are the gaps. |
| D3 Qualify | 1.1/2 | Qualification happens but often delayed by narrowing turns. |
| D4 Discipline | 1.5/2 | Generally good. Double questions still appear occasionally. |
| D5 Last Msg | 1.3/2 | Most turns pass the test. Anam T2-T3 are clear fails. |

## Pattern Analysis

### What v6b fixed (vs v5)
- Messages dramatically shorter (2-5 lines vs 8-15 in v5)
- Bot leads with prices instead of process explanations in most turns
- Budget estimation happens naturally (femmoraaa, Syed)
- Qualification is faster (Syed price math in T1, Anam budget in T5)
- Restricted products held firm (Battery, unchanged from v5)

### What v6b did NOT fix
1. **Narrowing without value** (Anam T2-T3): When lead names a category, bot asks "fashion or fine?" instead of giving price ranges. Fix: always give prices first, then refine.
2. **Catalog reframe** (Jesus T1): Bot still leads with "we don't have a catalog" instead of leading with prices. Fix: prices first, model explanation second.
3. **Process dumps** (femmoraaa T3): When lead asks "what's the process?", bot takes the bait. Fix: one-line process summary max, then redirect to action.
4. **Length cap at ~70% compliance**: The 30% that break the cap tend to be responses to dense or multi-part leads (Syed, Jesus T3). Fix: need stronger enforcement or structural change.

## Comparison v1 through v6b

| Version | Pass Rate | Avg Lines | Key Achievement |
|---------|-----------|-----------|-----------------|
| v1 | 4/6 (67%) | 12-18 | Baseline |
| v2 | 7/8 (88%) | 10-15 | Call handoff, budget math |
| v3 | 8/8 (100%) | 8-12 | WHY enforcement, restricted products |
| v5 | 4/4 fixes verified | 8-10 | Absolute restrictions, estimate budgets, specific exits |
| v6b | 3/5 (60%) | 2-5 | Per-turn priority, hard cap (but stricter rubric) |

Note: v6b pass rate appears lower because the rubric is stricter. v1-v5 used qualitative pass/fail; v6 uses scored dimensions. Syed and Battery would have been "PASS" in all prior versions. Anam and Jesus expose issues that existed but were unscored in prior runs.

## Recommended v7 Fixes

1. Add explicit rule: "When lead names a category, your FIRST response must include a price range for that category. Never ask a refining question without giving prices first."
2. Add explicit rule: "When lead asks for catalog or process, answer in ONE line then redirect to collecting info."
3. Tighten the hard cap wording or add examples of 2-3 line responses the bot should emulate.
