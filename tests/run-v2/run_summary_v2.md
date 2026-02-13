# Test Run v2 — 2026-02-12

Prompt v2: fixes for call handoff, budget math, "no company" handling, WhatsApp formatting, emoji reduction, catalog requests, sample voucher, restricted products, tone matching. Full diff from v1 in [AGENTS_v2.md](AGENTS_v2.md).

Model: `anthropic/claude-opus-4-6`, thinking: `low`.

## Results

| # | Persona | Turns | v1 Result | v2 Result | Fixed? |
|---|---------|-------|-----------|-----------|--------|
| 1 | Syed (handwash, $0.089) | 1 | Correct (3 turns) | Correct (1 turn) | Improved |
| 2 | Anam (jewelry, "no idea") | 3 | Correct | Correct | Same |
| 3 | Anthony (AirPods, 50 units) | 2 | Correct | Correct | Same |
| 4 | Jammaica (call request) | 1 | **WRONG** (denied calls) | Correct (offered handoff) | **FIXED** |
| 5 | Jesús (Mexico, 70K MXN) | 3 | **WRONG** (exited lead) | Correct (kept lead, voucher) | **FIXED** |
| 6 | Candle Student | 2 | Correct | Correct | Same |
| 7 | femmoraaa (teenager, jewelry) | 3 | n/a | Correct (kept lead, actionable) | NEW |
| 8 | Battery (restricted) | 1 | n/a | **WRONG** (didn't flag restricted) | NEW ISSUE |

**Pass rate: 7/8 (88%)** — up from 4/6 (67%) in v1.

---

## 1. Syed — Handwash, Pakistan, Unrealistic Pricing

> **Lead:** I want handwash, what is the MOQ and price? I need delivery to Pakistan. My budget is 25-30 rupees per piece
>
> **Bot:** Let me be real with you upfront — at 25-30 PKR per piece (~$0.09 USD), international sourcing from China won't work for handwash. Factory prices for liquid handwash typically start around $0.30-1.50/unit depending on size (250ml vs 500ml) and formulation, and that's *before* shipping to Pakistan. At your target price, local Pakistani manufacturers like Lifebuoy, Dettol contract factories, or smaller local producers will be far more competitive. If your budget has flexibility (say $0.50+/unit for a 500ml bottle), we could explore custom-branded handwash with your own logo and formulation. Would that be interesting, or is the 25-30 PKR firm?

**Verdict: CORRECT. Improved from v1.** Resolved in 1 turn instead of 3. No markdown table. Honest answer immediately with a door open at higher price. More professional tone.

**vs Gold Standard:** Answers trust questions directly (price, feasibility). Shows expertise (names real brands as reference). One question at end. No emoji. Good.

---

## 2. Anam — Jewelry/Bags/Makeup, Zero Specs

> **T1 Lead:** Hi, I want to source an item
> **Bot:** Hey! What are you looking to source?

> **T2 Lead:** Jewelry and bags. Makeup
> **Bot:** Nice — those are popular categories! To point you in the right direction, could you tell me a bit more about what you have in mind? For example, are you looking at:
> - *Jewelry:* fashion jewelry (earrings, necklaces, bracelets), fine jewelry, or custom pieces?
> - *Bags:* handbags, tote bags, cosmetic bags, or something else?
> - *Makeup:* specific products (lipstick, foundation, palettes) or a full private-label line?
> A photo or reference link of anything you like would help me find the best match fast.

> **T3 Lead:** I have no reference. No idea on price or quantity
> **Bot:** No worries — let me give you some ranges so you have something to work with:
> *Jewelry (fashion):* Earrings/necklaces: $0.50-3/piece. MOQ: 100-300 per style.
> *Bags:* PU leather handbags: $3-12/piece. Canvas totes: $1-5/piece. MOQ: 100-500 pieces.
> *Makeup (private label):* Lipsticks: $0.80-3/piece. Palettes: $2-8/piece. MOQ: 500-1,000 per SKU.
> Which of the three categories is your top priority? I'll dig deeper into that one first so we're not juggling everything at once.

**Verdict: CORRECT.** Gave options to react to instead of rejecting (Michael rejected here). Smart to narrow to one category in T3.

**vs Gold Standard:** T2 has 3 bullet categories — borderline "wall of questions" but structured as options not questions, so acceptable. T3 gives value before asking. Good expertise signal. Explains WHY narrowing helps ("not juggling everything").

---

## 3. Anthony — Individual Reseller, AirPods, 50 Units

> **T1 Lead:** I'm looking for airpods or electronics in particular
> **Bot:** We can't source branded Apple products like AirPods — that falls under IP-protected goods and could cause issues with your shipment. That said, we work with factories that make *high-quality TWS earbuds* with similar features — ANC, transparency mode, Bluetooth 5.3, wireless charging case. Pricing typically runs $3-15/unit depending on features. Are you looking to put your own brand on them, or unbranded units for resale?

> **T2 Lead:** Individual reseller, 50 units, RM 5-10 profit
> **Bot:** At 50 units, international sourcing from China likely won't make sense for your margins. Shipping alone (sea + customs) would add $2-5/unit, eating most of that RM5-10 profit. Suggests Shopee/Lazada wholesale, 1688 with consolidator, local wholesale in KL. Come back at 200+ units.

**Verdict: CORRECT.** Did flag branded products in T1 (my earlier assessment was wrong — the actual output includes the AirPods/IP warning). Clean 2-turn exit. Geography-aware (KL suggestion from RM currency).

**vs Gold Standard:** T1 gives value (TWS alternative + pricing) before asking. One question. T2 explains WHY (shipping math). Good.

---

## 4. Jammaica — Pastry Packaging, Wants Call

> **Lead:** Hi, we are still looking for our pastries and drinks packaging. What is the best time to call you? I prefer zoom call if that's ok
>
> **Bot:** Hey! Pastries and drinks packaging — great categories, lots of options there. Absolutely, we do Zoom calls! Let me connect you with our sourcing team to set one up. Could you share your email and a couple of time slots that work for you? I'll have someone reach out to schedule it. In the meantime — are you looking at packaging for both pastries *and* drinks, or one product line first? And any idea on quantities? That way whoever hops on the call with you already has relevant pricing ready to go.

**Verdict: FIXED.** v1 denied calls exist. v2 confirms immediately and facilitates handoff. Also asks qualifying questions so the call is productive — matches what real Michael did.

**vs Gold Standard:** Acknowledges the lead's request before anything else. Gives a clear next step (share email + times). Asks a question that makes the CALL better, not just collecting data.

---

## 5. Jesús — Mexico Sportswear, 70K MXN, New Store

> **T1 Lead:** Hola, busco tenis deportivos ropa deportiva camisas de futbol. Catálogo?
> **Bot:** No manejamos un catálogo fijo — trabajamos directo con fábricas en China y el sudeste asiático, lo que significa que te conseguimos mejor precio que un intermediario porque buscamos exactamente lo que necesitas. Tenis deportivos: $5-15 USD/par. Ropa deportiva: $3-10 USD/pieza. Camisas de futbol: $3-8 USD/pieza. ¿Tienes alguna foto o referencia del estilo que buscas?

> **T2 Lead:** 70 mil pesos de presupuesto. Primero unas cuantas piezas para ver calidad. Quisiera ver catálogo.
> **Bot:** ~$3,500 USD de presupuesto es un buen punto de partida — da para un pedido sólido. Entiendo que quieras ver calidad antes de invertir fuerte. Tenemos un *voucher de $100 USD para muestras*. Sobre el catálogo: como trabajamos directo con fábricas, no tenemos uno fijo, pero eso es ventaja para ti — en vez de elegir de un catálogo limitado, te buscamos exactamente lo que necesitas al mejor precio. Lo que sí necesito para arrancarte la búsqueda: ¿me puedes mandar una foto o link del estilo de tenis, ropa o camisas que te gustan?

> **T3 Lead:** Apenas voy a abrir un local amigo. No tengo empresa. [shares name + email]
> **Bot:** ¡Perfecto, Jesús! Abrir un local es buen momento para arrancar con proveedores directos de fábrica — te da mejor margen desde el inicio. Que no tengas empresa aún no es problema, lo importante es el proyecto. Para avanzarte las cotizaciones, solo necesito: ¿qué estilo te interesa? Mándame una foto o link de referencia. ¿En qué ciudad vas a abrir tu local?

**Verdict: FIXED.** v1 sent him to Tepito. v2 kept him — did budget math ($3,500 = solid), mentioned voucher, handled "no company" correctly ("lo importante es el proyecto"), kept asking for reference to move forward. Much better.

**vs Gold Standard:** T1 explains WHY no catalog is an advantage (better pricing). T2 acknowledges his concern (quality first), offers sample voucher. T3 acknowledges his situation warmly. All responses end with clear next step. Strong.

---

## 6. Candle Student — Non-ICP, Hobby

> **T1 Lead:** Candle making materials - molds wicks colours fragrances waxes jars
> **Bot:** Great to hear you're sourcing candle supplies! Quick overview: Silicone molds $0.50-3/pc. Cotton/wood wicks $0.01-0.05/pc. Candle dyes $0.50-2/pack. Fragrance oils $3-8/kg. Soy/paraffin wax $1.50-3.50/kg. Glass jars $0.30-2/pc. To start narrowing down — are you launching a candle brand, or restocking an existing business?

> **T2 Lead:** Student, beginner, 25-35 wicks, 10-15 jars
> **Bot:** Appreciate the honesty, brother! For these quantities, international sourcing from China won't make sense — shipping would cost more than the products. Suggests Alibaba/1688 for small sample packs, local wholesale markets. When you're ready for 100+ units per item, come back — factory-direct pricing beats retail by 40-60%.

**Verdict: CORRECT.** 2-turn clean exit. Matched his "brother" register. Practical alternatives.

**vs Gold Standard:** T1 gives value (all 6 items priced). One qualifying question. T2 explains WHY (shipping > product cost). Good.

---

## 7. femmoraaa — Teenager, Jewelry, Instagram Brand (NEW)

> **T1 Lead:** Teenager, wants bulk jewelry from China, breakdown of investment needed
> **Bot:** Realistic investment by tier: Ready-made $100-300, custom logo $300-800, custom design $800-2000+. Plus shipping $50-150 for small orders. As a teenager, ready-made route at $150-400 total is very doable. What kind of jewelry? Where would we ship to?

> **T2 Lead:** Stainless gold, tarnish-free, minimal aesthetic, pendants/rings/earrings/bracelets/watches. What's the process?
> **Bot:** The process: 1) Share reference photos, 2) We match with suppliers, 3) Quotes in 24-48h, 4) Sample to check quality, 5) Approve → bulk → QC → ships. We have a *$100 sample voucher*. What country are you based in?

> **T3 Lead:** No target price, just opened @femmoraaa.co on IG, hasn't started yet, new to this
> **Bot:** Pick 5-10 bestselling styles (gold hoops, dainty chain, stacking rings) rather than stocking everything. Realistic first order: 10 styles x 20-50 pcs each. Product cost $300-800. Samples $30-80 (covered by voucher). Shipping $50-150. Total to launch: ~$400-1,000. Could you send reference photos of the exact style?

**Verdict: CORRECT.** Eugene classified her as "KNTL" (bad lead). Bot treated her as an early-stage buyer and gave genuinely practical startup advice. She has an IG page, clear aesthetic direction, and said "bulk." The "pick 5-10 styles" advice is actually good business strategy.

**vs Gold Standard:** Every turn gives value before asking. Process explanation is clear. Budget breakdown is practical and actionable. Asks for photo (the key unlock). Mentions voucher at the right moment. Strong.

---

## 8. Battery — Restricted Product (NEW)

> **Lead:** Battery required Long 12/7. 2026 manufactured, pure original not refurbished. Also 8 fuse and 64 connectors.
>
> **Bot:** So you're looking for a *Long 12V 7Ah sealed lead-acid battery* — brand new, 2026 production date, original Long brand. Plus 8 fuses and 64 connectors. How many batteries do you need? Factory-direct Long 12/7s typically run $8-15/unit depending on quantity. Also, for fuses and connectors — what specs?

**Verdict: WRONG.** Bot engaged with a restricted product (batteries = hazmat, shipping restrictions, IATA regulations) as if normal. Real Michael correctly flagged this: "we are unable to proceed due to restrictions on importing battery items." The bot should recognize hazmat categories.

**vs Gold Standard:** Technically good conversation mechanics (acknowledged product, gave pricing, one question). But factually wrong — shouldn't have engaged at all.

---

## v1 to v2 Comparison

| Issue | v1 | v2 | Status |
|-------|----|----|--------|
| Call handoff | Denied calls | Facilitated handoff | **Fixed** |
| Budget math | Didn't convert | Converted 70K MXN to $3,500 | **Fixed** |
| "No company" = exit | Exited Jesús | Kept Jesús | **Fixed** |
| WhatsApp tables | Markdown tables | Bullet points | **Fixed** |
| Emoji overuse | 2-3 per message | 0-1 per message | **Fixed** |
| Catalog handling | "We don't do catalogs" | Explained + asked for reference | **Fixed** |
| Sample voucher | Never mentioned | Used with Jesús + femmoraaa | **Fixed** |
| Tone matching | Same for all | Professional with Syed, matched "brother" | **Improved** |
| Restricted products | Not tested | Failed to detect battery | **New issue** |

## Issues for v3

1. **Restricted product detection** — battery was not flagged
2. **Price hallucination** — all numbers LLM-generated, not from Sourcy data (deferred)
3. **Message length** — some responses still 8-10 lines (should be 2-4 for WhatsApp)
4. **"Explain WHY" principle** — weakly applied. Most questions don't explain downstream impact.
