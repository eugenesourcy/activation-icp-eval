# Test Run v3 — 2026-02-12

Prompt v3: de-overfitted budget math examples, strengthened restricted product detection, enforced "explain WHY" and message length. Full prompts: [AGENTS_v3.md](AGENTS_v3.md) + [SOUL_v3.md](SOUL_v3.md). Persona framework: [personas.md](personas.md).

Model: `anthropic/claude-opus-4-6`, thinking: `low`.

## Results

| # | Persona | Intent | Turns | Decision | Dropoff Triggers Hit | Correct? |
|---|---------|--------|-------|----------|---------------------|----------|
| 1 | Syed | Medium | 1 | Honest exit, door open | None wrongly hit | Yes |
| 2 | Anam | Low-med | 3 | Gave options | None wrongly hit | Yes |
| 3 | Anthony | Low | 2 | Clean exit | None wrongly hit | Yes |
| 4 | Jammaica | High | 1 | Call handoff | None wrongly hit | Yes |
| 5 | Jesús | Med-high | 3 | Kept lead, voucher | None wrongly hit | Yes |
| 6 | Candle | Very low | 2 | Clean exit | None wrongly hit | Yes |
| 7 | femmoraaa | Medium | 3 | Kept lead, actionable | None wrongly hit | Yes |
| 8 | Battery | Medium | 1 | Flagged restricted + pivoted to fuses | None wrongly hit | Yes |

**Pass rate: 8/8 (100%)**
**v1: 4/6 (67%) → v2: 7/8 (88%) → v3: 8/8 (100%)**

---

## Dropoff Trigger Analysis

| Trigger | Description | Personas at risk | Times triggered wrongly |
|---------|-------------|-----------------|----------------------|
| D1 | Slow response | All (bot is instant) | 0 — inherent advantage |
| D2 | Form-like data collection | Jammaica, Jesús | 0 — no "required by system" language |
| D3 | Company info before value | Anthony, Jesús, femmoraaa | 0 — never asked for website/company first |
| D4 | No value in first response | Anam | 0 — always gave price ranges or expertise |
| D5 | Told to provide info they don't have | Anam, femmoraaa | 0 — offered options when "no idea" |
| D6 | Price shock without empathy | Syed | 0 — framed honestly with alternative |
| D7 | Feeling judged | Candle, Anthony, femmoraaa | 0 — no condescension detected |
| D8 | Redirected away (correct exits) | Syed, Candle, Anthony | 3 — all intentional, correct exits |
| D9 | Too many questions | All | 0 — one question per turn maintained |
| D10 | No progress after 3+ turns | Anam, femmoraaa | 0 — concrete outcomes by turn 3 |

**Zero wrong dropoff triggers fired across all 8 personas.**

---

## 1. Syed — Handwash, Pakistan, $0.089 budget

> **Lead:** I want handwash, what is the MOQ and price? I need delivery to Pakistan. My budget is 25-30 rupees per piece
>
> **Bot:** Let me be upfront — at 25-30 PKR per piece (~$0.09-0.11 USD), international sourcing from China won't work. Factory price alone starts around $0.30-0.50/unit *before* shipping and customs to Pakistan. At your target price, local Pakistani manufacturers (Karachi/Lahore industrial zones) will be a much better fit — they can hit that range without import costs. If your budget can stretch to 80-150 PKR/unit ($0.30-0.50), we could explore Chinese suppliers. Would that work, or is local sourcing the better path for you?

**Dropoff check:** D6 (price shock) — handled with empathy ("let me be upfront"), suggested alternatives, left door open at higher price. D1 — instant response. No wrong triggers.
**vs Gold Standard:** Answers trust questions directly. Shows expertise (names industrial zones). One question at end. Professional tone — no emoji. 5 lines — slightly over target but acceptable for a price-rejection message.

---

## 2. Anam — Jewelry/Bags/Makeup, Zero Specs

> **T1:** Hi, I want to source an item → Hey! What are you looking to source?
> **T2:** Jewelry and bags. Makeup → Nice — those are popular categories! Let's start with one to keep things focused. Which one's the priority right now — jewelry, bags, or makeup?
> **T3:** I have no reference. No idea on price or quantity → No worries, let me give you something to work with! Jewelry $0.50-3/piece, sterling silver $2-8. Bags PU leather $3-10, canvas $1-5. Makeup private label $1-5. Are you looking to sell these in a store, online, or something else? (Helps me narrow down the right price tier for you)

**Dropoff check:** D5 (told to provide what she doesn't have) — avoided, gave options. D4 (no value) — avoided, gave price ranges. D9 (too many questions) — one per turn. No wrong triggers.
**vs Gold Standard:** T2 is better than v2 — narrowed to one category first ("let's start with one"). T3 gave ranges AND asked a qualifying question with WHY parenthetical. The WHY ("helps me narrow down the right price tier") is the v3 improvement. Good.

---

## 3. Anthony — AirPods, Individual Reseller, 50 Units

> **T1:** I'm looking for airpods or electronics → We can't source *AirPods* specifically since they're Apple-branded — importing from third-party factories risks customs seizure and IP issues. However, we can source *unbranded TWS earbuds* with similar features. $3-15/unit depending on features, MOQs 200-500 for custom logo. Interested in unbranded wireless earbuds, or another type of electronics?
> **T2:** Individual reseller, 50 units, RM 5-10 profit → Let me do some quick math. RM 5-10 profit x 50 units = RM 250-500 total. At 50 units, shipping from China adds RM 5-15+ per unit — eating most of that margin. For quantities under 100, Shopee Wholesale, 1688 with a shipping agent, or local Malaysian suppliers give better pricing. When you're ready for 200+ units, we can get factory-direct pricing that beats local wholesale.

**Dropoff check:** D3 (company info first) — not asked. D7 (judged) — "let me do some quick math" is respectful, explaining the economics not judging the person. No wrong triggers.
**vs Gold Standard:** T1 flagged branded product AND offered alternative with pricing — good. T2 showed the math (explains WHY), clean exit. Stronger "explain WHY" than v2 — the RM math is the reason, not just "we focus on brands."

---

## 4. Jammaica — Pastry Packaging, Wants Zoom Call

> **Lead:** We are still looking for pastries and drinks packaging. What is the best time to call you? I prefer zoom call
>
> **Bot:** Great to hear you're moving forward with packaging for pastries and drinks! We absolutely do Zoom calls — let me connect you with our sourcing team. Could you share your email and preferred time/timezone? I'll have someone reach out to schedule. In the meantime — are you looking at boxes, pouches, cups, or a mix? A quick idea of quantities and any branding needs helps our team prep before the call so you get the most out of it.

**Dropoff check:** D2 (forced into chat) — avoided, confirmed calls immediately. No wrong triggers.
**vs Gold Standard:** Acknowledges ("great to hear"). Confirms call. Asks qualifying question that serves HER interest ("so you get the most out of it" — explains WHY). 4 lines. Good.

---

## 5. Jesús — Mexico, Sportswear, 70K MXN, New Store

> **T1:** Busco tenis deportivos, ropa deportiva, camisas de futbol. Catálogo? → No catalog — works direct with factories. Price ranges: tenis $4-12/par, ropa $3-8, camisas $3-7. ¿Qué cantidad por producto? (esto define el precio — a mayor volumen, mejor precio por pieza)
> **T2:** 70K MXN budget. Small first order. Catálogo? → ¡Perfecto! 70 mil pesos (~$4,000 USD) es buen presupuesto. Voucher de $100 USD para samples. En lugar de un catálogo genérico te busco opciones específicas. ¿Me puedes mandar fotos o links del estilo?
> **T3:** No company yet. [shares name + email] → ¡Excelente, Jesús! No necesitas empresa — lo importante es el pedido. Mándame una foto o link. ¿Por cuál producto quieres empezar?

**Dropoff check:** D7 (judged for no company) — "no necesitas empresa, lo importante es el pedido." D3 (company info first) — never asked. D5 (told to provide what he doesn't have) — asked for photos naturally. D8 (redirected) — kept him. No wrong triggers.
**vs Gold Standard:** T1 explains WHY quantity matters (parenthetical). T2 does budget math, mentions voucher, reframes "no catalog" as advantage. T3 handles "no company" warmly. Messages are shorter than v2 — 4-5 lines each. Strong improvement on "explain WHY."

---

## 6. Candle Student — Hobby Quantities

> **T1:** Candle making materials → Price overview for all items. Are you starting a brand or restocking existing business?
> **T2:** Student, 25-35 wicks, 10-15 jars → For these quantities, shipping costs > product costs. Suggests Amazon/Daraz/Shopee/local craft stores. When you scale to 500+ wicks, 50+ jars, or wax by the ton — come back.

**Dropoff check:** D7 (judged) — "no worries" tone, practical alternatives. No condescension. Correct D8 (redirect). No wrong triggers.
**vs Gold Standard:** T1 gives value (prices all items). One question. T2 explains WHY (shipping > product). Clean. Shorter than v2.

---

## 7. femmoraaa — Teenager, Jewelry, Instagram Brand

> **T1:** Teenager, wants bulk jewelry, how much investment? → Investment breakdown: ready-stock $200-500, custom logo $500-1,500. Unit prices $0.50-5 depending on material. Realistically start with $300-500. What type of jewelry?
> **T2:** Stainless gold, tarnish-free, minimal. Pendants, rings, earrings, bracelets, watches. Process? → 5-step process (references → quotes → samples → approve → bulk → QC → ship). $100 sample voucher. How many pieces for first order? (MOQs for custom gold PVD start around 50-100/design, 200+ drops price significantly)
> **T3:** No target price, just opened @femmoraaa.co on IG, new to this → "That's a solid start — Instagram jewelry brands do really well with the minimal gold aesthetic." Suggests 10-15 bestselling designs, 20-50 each = $300-700 total. "No rush — you grow orders as your page grows." Asks for reference photos.

**Dropoff check:** D5 (told to provide target price) — never required it, gave ranges instead. D7 (judged for being young) — "that's a solid start" is encouraging. D3 (company info) — never asked. D10 (no progress) — concrete plan by T3 ($300-700 to launch). No wrong triggers.
**vs Gold Standard:** T1 gives investment ranges (value first). T2 explains the process clearly + mentions voucher + explains WHY quantity matters (parenthetical about MOQs). T3 gives practical startup advice. The "no rush — grow orders as your page grows" is particularly good — it's patient, not pushy. All messages 4-5 lines. Strong.

---

## 8. Battery — Restricted Product

> **Lead:** Battery Long 12/7, 2026 manufactured, original not refurbished. Also 8 fuse and 64 connectors.
>
> **Bot:** Unfortunately, *batteries are a category we can't reliably source* through international shipping. Lead-acid batteries fall under IATA dangerous goods regulations — they require special packaging, certified carriers, and hazardous materials documentation. This makes international sourcing risky with frequent customs holds and damage issues. For batteries, *local suppliers or authorized distributors* in your country will give you better pricing, faster delivery, and proper warranty coverage. That said — the *fuses and connectors* are absolutely something we can help with! Could you share a photo or reference link for the specific fuse and connector types?

**Dropoff check:** D10 (strung along then rejected) — avoided, flagged immediately. D6 (price shock) — n/a, rejected before pricing. Correct handling: immediate flag with specific WHY (IATA regs, customs holds), then pivoted to what we CAN help with (fuses/connectors). Smart — doesn't lose the entire lead.
**vs Gold Standard:** Explains WHY honestly (IATA, customs). Pivots to what's possible. One question. Professional tone. This is exactly right — v2 completely missed the restricted flag, v3 nailed it AND saved part of the order.

---

## v2 → v3 Comparison

| Issue | v2 | v3 | Status |
|-------|----|----|--------|
| Battery (restricted) | Engaged normally | Flagged immediately, pivoted to fuses | **Fixed** |
| Anthony (branded flag) | Flagged in T1 | Flagged in T1 | Same (v2 was correct, my assessment was wrong) |
| "Explain WHY" | Weak | Parentheticals in Jesús, Anthony, Anam, femmoraaa | **Improved** |
| Message length | 8-10 lines some messages | 4-5 lines most messages | **Improved** |
| Overfitted examples | 70K MXN, 80K naira in prompt | Removed — general principle only | **Fixed** |

## Remaining Issues (beyond v3)

1. **Price hallucination** — all numbers still LLM-generated. Need real Sourcy data to fix. Not a prompt problem — needs external data source.
2. **No real multi-turn stress test.** Our longest conversations are 3 turns. Real leads go 5-10+ turns. Need longer scenarios.
3. **No image handling test.** Many real leads send photos. CLI can't test this. Need WhatsApp/webchat to test properly.
4. **No concurrent conversation test.** In production, bot handles multiple leads simultaneously.
5. **No follow-up/re-engagement test.** Real leads go silent and come back days later.

## Gold Standard Assessment (v3)

| Principle | v3 Score | Evidence |
|-----------|----------|----------|
| One question per turn | Strong | All 8 personas — 0-1 questions per message |
| Acknowledge before pivoting | Good | Jesús T3, Jammaica T1, femmoraaa T3 — acknowledged context. Syed could acknowledge "handwash" more explicitly. |
| Explain WHY | Improved | Jesús T1 parenthetical, Anthony T2 margin math, Anam T3 "helps narrow price tier", femmoraaa T2 MOQ explanation. Not perfect — still missing in some turns. |
| Show expertise | Strong | Every first substantive response has category-specific price ranges and trade-offs |
| Concrete options | Strong | Anam, femmoraaa, candle — all got options to react to |
| Short messages | Improved | Most 4-5 lines. Syed and Battery are 5-6 (acceptable for complex rejection). v2 had 8-10 line messages. |
| Clear next step | Good | Most messages end with a question or action. Some could be more explicit about "what happens next." |
