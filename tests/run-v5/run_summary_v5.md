# Test Run v5 — Fix Verification (2026-02-12)

Targeted rerun of the 4 personas that failed in v4. Prompt fixes: absolute restricted product rule, estimate budget for unclear buyers, specific price door on exits, SR closing drive.

## v4 Issues → v5 Results

| Issue | v4 | v5 | Fixed? |
|-------|----|----|--------|
| Battery reversed restriction under pushback | Bot caved, started quoting batteries | Bot held firm both turns. T2: "You may be right about Pakistan — the issue is getting them there safely through international shipping." Pivoted to fuses/connectors. | **FIXED** |
| femmoraaa — asked for budget she doesn't have | "What's your total budget?" after she said no target price | T1: Estimated for her ("$300-800 gets you 200-500 pieces"). T3: Didn't ask for budget at all — just asked for reference photos + location to move forward. | **FIXED** |
| Syed — exit too firm, no specific door | "If you ever need to source..." (generic) | "If your budget can reach $0.50-0.80/unit (140-220 PKR), we could source custom branded 500ml at MOQs of 3,000-5,000" (specific) | **FIXED** |
| Jesús — SR not closing | Kept asking one more question | T3: Full SR recap with all available fields, defaults for missing ones ("Timeline: flexible"), said "quotes in 24-48 hours to your email" | **FIXED** |

## Key Conversations

### Battery — Held Firm Under Pushback

> **T1 Lead:** Battery Long 12/7, 2026, original. Also 8 fuse and 64 connectors
> **Bot:** Can't source batteries — IATA dangerous goods, special packaging, customs seizure risk. Local distributor better. Fuses and connectors though — we can help! What specs?
> **T2 Lead:** Importing batteries where?? Importing in Pakistan no problem
> **Bot:** For the Long 12V/7Ah, you'll get a better deal sourcing locally — faster, no shipping risk, local warranty. *But let's get moving on the fuses and connectors!* What type/rating?

No reversal. Acknowledged his point about Pakistan but held firm on shipping. Redirected energy to fuses/connectors.

### femmoraaa — Estimated Budget Instead of Asking

> **T1:** How much investment as a teenager? → Bot: "$300-800 gets you 200-500 mixed pieces + shipping. With ~$500 you could start a small collection."
> **T3:** No target price, doing research, @femmoraaa.co, new to this → Bot: "PVD gold stainless steel matches your brand. To get started I need: where are you based? + 3-5 reference photos." No budget question.

Bot estimated the investment at T1 (answering her actual question) and at T3 didn't ask for budget — just asked for the two things that would move to quotes: location + reference photos.

### Jesús — SR Closed

> **T3:** [gives name, email, city León Guanajuato] → Bot: [Full SR recap as bullet list: product, budget, delivery location, contact, email, timeline "flexible"]. "Siguiente paso: cotizaciones en 24-48 horas a tu correo."

SR complete with defaults filled in. Didn't block on missing fields.

### Syed — Specific Door Open

> **T1:** Budget 25-30 PKR → Bot: "If your budget can reach $0.50-0.80/unit (around 140-220 PKR), we could source 500ml handwash with custom branding at MOQs of 3,000-5,000. Would either direction work?"

Named the exact price tier that would make it viable. Not a generic "come back sometime."

## Progression v1→v5

| Run | Pass Rate | Key Fix |
|-----|-----------|---------|
| v1 | 4/6 (67%) | Baseline |
| v2 | 7/8 (88%) | Call handoff, budget math, catalog handling |
| v3 | 8/8 (100%) | Restricted products, WHY enforcement, message length |
| v3-test | 6/6 (100%) | Generalization confirmed |
| v4 | Issues found: battery regression, D5 trigger, weak exit, slow closing | Strict persona testing exposed prompt gaps |
| v5 | All 4 issues fixed | Absolute restrictions, estimate budgets, specific exits, drive to close |
