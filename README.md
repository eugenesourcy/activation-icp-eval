# Sourcy Activation Bot

WhatsApp conversational agent that qualifies sourcing leads and collects Sourcing Requests (SRs) through natural conversation instead of forms.

## Why This Exists

WhatsApp direct is Sourcy's strongest channel for quality SRs (4.6% CVR vs 0.5% for forms). But ~76% of WA leads ghost after 1-2 messages — usually because the first response doesn't give them enough value to continue.

The bot fixes this by leading with **category expertise** (price ranges, MOQ guidance, material trade-offs) before asking for anything. SR collection happens conversationally, not as an interrogation.

## How It Works

1. **Trust first** — answers the lead's commercial questions (price, MOQ, delivery, quality) immediately
2. **Conversational SR** — collects product specs, quantity, budget, destination through natural dialogue (3 turns to complete SR)
3. **Smart exits** — filters unqualified leads with a specific re-entry door (exact price/MOQ they'd need to come back)
4. **Call handoff** — routes leads who want a call to the human team instead of forcing chat

## Key Design Decisions

- **Give value before asking** — every bot message provides information (price ranges, material options, trade-offs) then asks ONE question
- **Estimate, don't ask** — if a lead doesn't have a budget, the bot estimates for them based on context
- **Restricted products are absolute** — batteries, hazmat, etc. are never reversed even under pushback
- **Defaults for missing fields** — SR closes with sensible defaults (e.g. "Timeline: flexible") rather than blocking on incomplete info

## Prototype Testing

Tested over 5 rounds using 14 lead personas drawn from real WhatsApp chat data. Each round: test against personas, identify failures, fix the prompt, re-test.

| Run | Pass Rate | Key Fix |
|-----|-----------|---------|
| v1 | 4/6 (67%) | Baseline |
| v2 | 7/8 (88%) | Call handoff, budget math, catalog handling |
| v3 | 8/8 (100%) | Restricted products, WHY enforcement, message length |
| v3-test | 6/6 (100%) | Generalization confirmed with new personas |
| v4 | Regressions found | Strict persona testing exposed prompt gaps |
| v5 | 4/4 fixes verified | Absolute restrictions, estimate budgets, specific exits, drive to close |

## Repo Structure

```
context/          # Real WhatsApp chat data (good + bad examples) and strategy docs
tests/
  run-v1/         # Each run has: config, personas, results (.jsonl), assessments, summary
  run-v2/
  run-v3/
  run-v3-test/
  run-v4-fullsr/
  run-v5/
sourcy_wa_bot_prototype_report.html   # Full prototype report (deployable)
```

## Report

The prototype report with full conversation replays, bounce analysis, and before/after comparisons is in `sourcy_wa_bot_prototype_report.html`.
