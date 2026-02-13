# Test Run v1 — 2026-02-12

First pass. Model: `anthropic/claude-opus-4-6`, thinking: `low`. Prompts: [AGENTS_v1.md](AGENTS_v1.md) + [SOUL_v1.md](SOUL_v1.md). Full config: [config.json](config.json).

## Results

| # | Persona | Turns | Bot Decision | Correct? |
|---|---------|-------|-------------|----------|
| 1 | Syed | 3 | Honest price rejection + redirect | Yes |
| 2 | Anam | 3 | Gave concrete options to react to | Yes |
| 3 | Anthony | 2 | Clean fast exit + alternatives | Yes |
| 4 | Jammaica | 1 | Denied call, forced chat | **WRONG** |
| 5 | Jesús | 3 | Exited qualified lead | **WRONG** |
| 6 | Candle Student | 2 | Clean fast exit | Yes |

**Pass rate: 4/6 (67%)**

---

## 1. Syed — Startup Founder, Handwash, Unrealistic Pricing

**Who:** VCare, early-stage startup, Karachi Pakistan. No website. Budget: 25-30 PKR/piece (~$0.089).
**Source:** [context/Good/handwash SR.txt](../../context/Good/handwash%20SR.txt) | Persona: [syed.json](personas/syed.json) | Raw: [results/syed-test.jsonl](results/syed-test.jsonl) | Full assessment: [assessments/test_syed_handwash.md](assessments/test_syed_handwash.md)

**Conversation:**

> **Lead:** I want handwash, what is the MOQ and price? I need delivery to Pakistan. My budget is 25-30 rupees per piece
>
> **Bot:** Handwash is a popular category. MOQ typically 1,000-5,000 units. Price $0.30-0.80/unit FOB. Your budget of 25-30 PKR (~$0.09-0.10) is tough from overseas — local Pakistani manufacturers would be more competitive. What quantity are you thinking?
>
> **Lead:** How many pieces to get 25-30 rupees per piece?
>
> **Bot:** Even at 100,000 units, landed cost ~$0.30-0.40 (~85-115 PKR) — 3-4x your budget. Recommend local Pakistani manufacturer. Can help with other products where international sourcing saves money.
>
> **Lead:** I want the whole thing, bottle with liquid. Price with delivery to Karachi doorstep.
>
> **Bot:** [Price table by volume]. Best case 50,000 units = ~85-90 PKR. Still 3x your budget. Recommends local. Offers to help with other products.

**Verdict: CORRECT.** Answered trust questions immediately. Honest about price gap from Turn 1. Resolved in 3 turns vs Michael's 6 days + wrong product. 
**Issues:** Markdown table (won't render in WhatsApp). Emoji overuse. Turn 3 redundant — conclusion was clear by Turn 2. Prices are LLM-generated, not from Sourcy supplier data.

---

## 2. Anam — Zero-Spec Dreamer (Jewelry, Bags, Makeup)

**Who:** Individual in Pakistan. No company, no reference, no specs, no budget.
**Source:** [context/Bad/bad example 2.txt](../../context/Bad/bad%20example%202.txt) | Persona: [anam.json](personas/anam.json) | Raw: [results/anam-test.jsonl](results/anam-test.jsonl) | Full assessment: [assessments/test_anam_jewelry.md](assessments/test_anam_jewelry.md)

**Conversation:**

> **Lead:** Hi, I want to source an item
>
> **Bot:** Hey! What are you looking to source?
>
> **Lead:** Jewelry and bags. Makeup
>
> **Bot:** Nice — solid categories. Are these for your own brand/business, or more of a personal project?
>
> **Lead:** I have no reference. No idea on price or quantity
>
> **Bot:** No worries — let me give you something to work with. Jewelry: fashion $0.50-3/pc, semi-fine $3-15/pc. Bags: PU leather $3-8, genuine leather $10-25+. Makeup: private label $1-5/unit. Are you building a brand or looking for ready-made to resell?

**Verdict: CORRECT.** Michael rejected Anam here ("unable to proceed"). Bot gave her options to react to — keeps the conversation alive. The "brand vs resell" question is the right qualifying fork.
**Issues:** We don't know if Anam would engage further — conversation ended at 3 turns. No acknowledgment of her uncertainty ("that's normal for first-time sourcing" would build trust).

---

## 3. Anthony — Individual Reseller, Branded Electronics, 50 Units

**Who:** Individual reseller, Malaysia. Wants AirPods. 50 units, RM 5-10 profit/piece.
**Source:** [context/Bad/bad example 4.txt](../../context/Bad/bad%20example%204.txt) | Persona: [anthony.json](personas/anthony.json) | Raw: [results/anthony-test.jsonl](results/anthony-test.jsonl) | Full assessment: [assessments/test_anthony_airpods.md](assessments/test_anthony_airpods.md)

**Conversation:**

> **Lead:** I'm looking for airpods or electronics in particular
>
> **Bot:** Can't source branded products like AirPods, but CAN find TWS earbuds from manufacturers. $3-15/unit depending on features. Are you looking to put your own brand on them, or unbranded for resale?
>
> **Lead:** I'm actually an individual reseller. Planning to buy like 50 then sell for RM 5-10 profit
>
> **Bot:** At 50 units, shipping costs eat into margins. Suggests Alibaba, 1688, Shopee wholesale. Welcome back when ready for larger orders.

**Verdict: CORRECT.** 2-turn exit. Addressed branded product immediately (Michael asked for company website first). Gave concrete alternatives.
**Issues:** Turn 1 too long for a lead that was never going to convert. "Appreciate the honesty!" slightly patronizing.

---

## 4. Jammaica — P1 Lead, Wants Call (Little Luna's Bakeshop)

**Who:** littlelunasbakeshop.com, Philippines. Pastry + drinks packaging. Returning interest. Prefers Zoom.
**Source:** [context/Good/P1 PH leads asking for a call.txt](../../context/Good/P1%20PH%20leads%20asking%20for%20a%20call.txt) | Persona: [jammaica.json](personas/jammaica.json) | Raw: [results/jammaica-test.jsonl](results/jammaica-test.jsonl) | Full assessment: [assessments/test_jammaica_call.md](assessments/test_jammaica_call.md)

**Conversation:**

> **Lead:** Hi, we are still looking for our pastries and drinks packaging. What is the best time to call you? I prefer zoom call if that's ok
>
> **Bot:** I'm Sourcy's sourcing assistant and I handle everything through chat. We don't do Zoom calls, but I can get you moving faster this way! Pastry packaging $0.10-0.80/unit, drink packaging $0.15-1.50/unit. Are these for a bakery/café brand, or retail-ready packaged goods?

**Verdict: WRONG.** The bot lied — Sourcy absolutely does calls. Michael scheduled a Google Meet with this exact lead and it converted. The bot denied a P1 lead's explicit request and tried to force her into chat. This is a regression from Michael's handling.
**Fix needed:** When a lead requests a call, facilitate handoff to human team. Never deny that Sourcy does calls.

---

## 5. Jesús — New Store Owner, Mexico, Sportswear

**Who:** Opening a retail store in Mexico. No company yet. 70,000 MXN budget (~$3,500 USD). Wants sportswear catalog.
**Source:** [context/Good/Jesús Lizandro Mendoza Mora chat history (Inbound).txt](../../context/Good/Jes%C3%BAs%20Lizandro%20Mendoza%20Mora%20chat%20history%20%28Inbound%29.txt) | Persona: [jesus.json](personas/jesus.json) | Raw: [results/jesus-test.jsonl](results/jesus-test.jsonl) | Full assessment: [assessments/test_jesus_sportswear.md](assessments/test_jesus_sportswear.md)

**Conversation:**

> **Lead:** Hola, busco tenis deportivos ropa deportiva camisas de futbol. Me puede mandar su catálogo?
>
> **Bot:** [In Spanish] Tenis $5-15/par, ropa deportiva $3-10/pieza, camisas de futbol $3-8/pieza. No catalog — we find factory suppliers for you. Are you looking for your own brand or generic ready-to-sell?
>
> **Lead:** Tengo 70 mil pesos de presupuesto. Primero unas cuantas piezas para ver calidad. Quisiera ver el catálogo.
>
> **Bot:** 70K MXN (~$3,500) is a good initial order. But for "a few test pieces," shipping costs don't work — our strength is 100+ pieces per product. How many pieces are you thinking?
>
> **Lead:** Apenas voy a abrir un local amigo. No tengo empresa todavia. [Shares name + email]
>
> **Bot:** Sourcy focuses on volume sourcing (100+ pieces). For starting out, recommends Tepito, La Lagunilla, Alibaba/1688. Come back when you're doing larger orders.

**Verdict: WRONG.** The bot exited a qualified lead. 70K MXN at $5-15/pair = 230-700 pairs of sneakers — well above MOQ. The real Michael kept this lead and generated an SR. The bot over-indexed on "no company" + "unas cuantas piezas" without doing the budget math. Also ignored the catalog request twice — never offered an alternative.
**Fixes needed:** Convert local currency to units before exit decisions. "No company yet" for someone opening a store ≠ non-ICP. Offer to show supplier options when asked for catalog. Mention $100 sample voucher.

---

## 6. Candle Student — Non-ICP, Hobby Quantities

**Who:** Student in Pakistan. Beginner candle maker. 25-35 wicks, 10-15 jars.
**Source:** [context/Bad/bad example 1.txt](../../context/Bad/bad%20example%201.txt) | Persona: [candle_student.json](personas/candle_student.json) | Raw: [results/candle-test.jsonl](results/candle-test.jsonl) | Full assessment: [assessments/test_candle_student.md](assessments/test_candle_student.md)

**Conversation:**

> **Lead:** I want candle making material - molds wicks colours fragrances waxes jars
>
> **Bot:** Candle supplies — popular category. Are you making for a brand/business, or personal project? Business orders (100+ units) = great factory pricing. Smaller hobby quantities = local suppliers make more sense.
>
> **Lead:** I'm a new beginner and student. 25-35 wicks, 10-15 jars.
>
> **Bot:** For those quantities, sourcing from China doesn't make sense — shipping > product cost. Suggests local craft stores, Amazon/Shopee/Daraz, starter kits $20-40. Welcome back when ready for bulk.

**Verdict: CORRECT.** 2-turn exit. Pre-framed the qualifying question so the exit felt logical. Gave concrete alternatives. Michael took 5 messages; bot took 2.
**Issues:** Minor — "candle journey" is saccharine, emoji (💪) on a student exit feels off, platform suggestions should be geography-aware.

---

## Issues Found (to fix in v2)

**Critical (wrong decisions):**
1. **Call requests need human handoff** — bot denied that Sourcy does calls (Jammaica)
2. **Budget math before exit** — bot must convert local currency to unit volume before deciding to exit (Jesús)
3. **"No company" ≠ non-ICP** — new businesses opening stores are qualified buyers (Jesús)

**Quality (right decisions, rough execution):**
4. **WhatsApp formatting** — markdown tables won't render, use bullet points only
5. **Emoji overuse** — too casual for business sourcing context
6. **Catalog requests** — offer to show supplier options for their category, not "we don't do catalogs"
7. **$100 sample voucher** — never mentioned across 6 tests, should be used as trust-builder for qualified leads
8. **Redundant turns** — Syed conclusion was clear by Turn 2, Turn 3 repeated the same answer

## Missing Personas (to add in v2)

- **femmoraaa.co teenager** — engaged unclear buyer with reference photos but no pricing experience (new from Eugene's data, not in context files until now)
- **Happy-path qualified buyer** — full SR flow to completion (no real example exists — construct from gold standard)
- **Battery/restricted product** — quick exit for unsupported categories
