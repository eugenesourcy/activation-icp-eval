# Test: Anam — Zero-Spec Dreamer (Jewelry, Bags, Makeup)

**Persona:** Individual in Pakistan. No company, no references, no specs, no budget. Wants "jewelry and bags, makeup."
**Based on:** Real lead from `context/Bad/bad example 2.txt` (Feb 3, 2026)
**Session ID:** anam-test

---

## Transcript

**USER:** Hi, I want to source an item

**BOT:** Hey! 👋 What are you looking to source?

---

**USER:** Jewelry and bags. Makeup

**BOT:** Nice — jewelry, bags, and makeup are all solid categories we work with regularly.

To point you in the right direction: are these for your own brand/business, or more of a personal project?

---

**USER:** I have no reference. No idea on price or quantity

**BOT:** No worries at all — let me give you something to work with.

**Jewelry** — most buyers go with either fashion jewelry (zinc alloy/stainless steel, $0.50-3/pc) or semi-fine (925 silver/gold plated, $3-15/pc). Custom designs start around 200-500pcs MOQ.

**Bags** — PU leather totes/crossbodies run $3-8/unit, genuine leather $10-25+. MOQ usually 200-500 for custom.

**Makeup** — private label cosmetics (lipsticks, palettes, foundations) typically $1-5/unit, MOQ 500-1000 per SKU.

Quick question — are you building a brand (your own logo/packaging), or looking for ready-made products to resell? That changes everything about pricing and minimums.

---

## Critical Assessment

**What the lead is doing:**
- Opens with "I want to source an item" — the most generic possible opening. Zero specificity.
- When asked what: "jewelry and bags. Makeup" — has categories but nothing else
- "No reference. No idea" — this is the moment Michael rejected her. She's being honest that she doesn't know the sourcing world.
- She never said she's an individual. She never said she has no budget. Michael (and our AGENTS.md exit criteria) would classify "no idea on everything" as unqualified.

**What the bot did well:**
- Turn 1 was perfect — simple, non-intimidating "What are you looking to source?"
- Turn 2 asked the right qualifying question (brand/business vs personal) — this is the key fork
- Turn 3 is the big win: instead of rejecting like Michael did, gave concrete options with price ranges for ALL THREE categories. Now Anam has something to react to.
- The "are you building a brand or reselling?" question in Turn 3 is smart — it's the qualifying question disguised as a helpful one

**What needs improvement:**
1. **Turn 2 didn't answer her "no idea" yet.** She didn't say "no idea" until Turn 3, but the bot's Turn 2 question ("brand/business or personal project?") was asked BEFORE she revealed she has no specs. The sequencing worked by luck here. If she'd said "no idea" in Turn 2, the bot would need to handle it differently.
2. **The bot ignored her "no idea" framing and just plowed forward.** That's actually good — it didn't treat "no idea" as a rejection signal. But it also didn't acknowledge her uncertainty. A line like "That's totally normal for first-time sourcing" would build trust.
3. **Still no clarity on whether this is a real buyer.** After 3 turns we don't know: is she an individual dreamer? A startup? A reseller? The "brand vs resell" question in Turn 3 should surface this.
4. **The prices are made up** — same issue as all tests. Plausible ranges but not from Sourcy's actual supplier data.

**Compared to real conversation:**
- Real Michael: rejected her in Turn 3 ("we're unable to proceed because we don't yet have enough detail"). Dead conversation.
- Bot: gave her options to react to and asked a qualifying question. Conversation alive.
- This is the clearest improvement over Michael's approach. Whether Anam converts is unknown — but she at least has a chance now.

**Key insight:** "No idea" doesn't mean "not a buyer." It means "I need you to show me what's possible." The bot's approach of giving concrete options with price ranges is exactly right. The question is whether Anam will engage with them or go silent — and we can't know that without the next turn.
