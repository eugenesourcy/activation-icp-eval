# v3 Personas — Dropoff Trigger Framework

Each persona has an intent level, specific dropoff triggers (things that would make them ghost in real life), and an expected outcome. We assess whether the bot HIT a dropoff trigger it shouldn't have (bad) or correctly triggered an exit (good).

## Dropoff Triggers (from real chat data)

| # | Trigger | Observed in |
|---|---------|-------------|
| D1 | Slow/no response (>2 hours) | Syed ("??"), multiple offline auto-replies |
| D2 | "Required by our system" / form-like data collection | Michael pattern across multiple chats |
| D3 | Asked for company info before any value given | Anthony, Jesús, Tolanikawo |
| D4 | No value in first substantive response | Generic "what are you looking for" without context |
| D5 | Told to provide info they don't have (specs, reference, price) | Anam rejected for "no idea" |
| D6 | Price reality shock without empathy | Syed — 6 days then "price is challenging" |
| D7 | Feeling judged / told they're too small | Candle student, Anthony |
| D8 | Redirected away ("try Alibaba/local") | Exit signal — conversation over |
| D9 | Too many questions before any answer | Multiple questions per message |
| D10 | No progress after 3+ turns | Back-and-forth without concrete outcome |

---

## 1. Syed — HIGH dropoff risk, unfeasible economics

- **Intent:** Medium (has a real product, real business name, persistent)
- **Dropoff triggers:** D1 (waits days for answer), D6 (price shock without empathy), D10 (no progress)
- **Expected outcome:** Honest exit — bot should tell him the price gap immediately and suggest local. Should NOT string him along.
- **Dropoff assessment:** Bot should avoid D1 (instant response), avoid D10 (resolve in 1-2 turns), but SHOULD trigger D6/D8 gently (price doesn't work, here's why, here's an alternative).

## 2. Anam — HIGH dropoff risk, unclear buyer

- **Intent:** Low-medium (has categories but nothing else)
- **Dropoff triggers:** D4 (no value given), D5 (told to provide things she doesn't have), D9 (multiple questions)
- **Expected outcome:** Stay alive — bot should give her options to react to. If she engages with options, keep going. If she can't, polite exit.
- **Dropoff assessment:** Bot should avoid D5 (never reject for "no idea"), avoid D9 (one question per turn), should give options (avoid D4).

## 3. Anthony — LOW dropoff risk (self-selects out)

- **Intent:** Low (individual reseller, 50 units, branded product)
- **Dropoff triggers:** D3 (asked for company website), D7 (told he's too small)
- **Expected outcome:** Clean exit in 1-2 turns. He'll accept it (real Anthony said "Okay thanks").
- **Dropoff assessment:** Bot should avoid D3 (don't ask for website), can trigger D8 (redirect to alternatives) because it's the correct outcome. Should not make D7 feel judgmental.

## 4. Jammaica — LOW dropoff risk, HIGH intent

- **Intent:** High (real business, returning lead, ready for call)
- **Dropoff triggers:** D2 (forced into a form/chat when she wants a call), D1 (slow response)
- **Expected outcome:** Human handoff — bot facilitates call scheduling. Should NOT try to keep her in chat.
- **Dropoff assessment:** If bot denies calls (D2 variant), she will 100% ghost. Must facilitate handoff.

## 5. Jesús — MEDIUM dropoff risk, viable buyer

- **Intent:** Medium-high (real budget $3,500, specific categories, willing to share info)
- **Dropoff triggers:** D3 (asked for company before value), D5 (told to provide reference he doesn't have yet), D7 (told he's not qualified because no company), D8 (redirected away)
- **Expected outcome:** Stay alive — bot should keep him, do budget math, ask for reference photos, mention sample voucher.
- **Dropoff assessment:** Bot must avoid D7 (don't exit on "no company"), avoid D8 (don't send to Tepito), avoid D3 (don't ask for company website). Should trigger photo request naturally.

## 6. Candle Student — LOW dropoff risk (self-selects out)

- **Intent:** Very low (student, hobby quantities, under 50 units)
- **Dropoff triggers:** D7 (feeling judged for being small/young)
- **Expected outcome:** Clean exit in 2 turns. Student should feel respected, not rejected.
- **Dropoff assessment:** Exit via D8 is correct. Must avoid D7 (don't be condescending about quantities).

## 7. femmoraaa — MEDIUM dropoff risk, early-stage buyer

- **Intent:** Medium (has IG brand, specific aesthetic, says "bulk", sends references — but teenager, no target price, hasn't started)
- **Dropoff triggers:** D5 (told to provide target price she doesn't have), D7 (judged for being young/new), D3 (asked for company website), D10 (conversation goes nowhere)
- **Expected outcome:** Stay alive — bot should give her a concrete starting path (starter quantities, budget range, process). She should leave feeling like she CAN do this.
- **Dropoff assessment:** Must avoid D5 (don't require target price), avoid D7 (don't dismiss her for being a teenager), should provide actionable next steps (avoid D10).

## 8. Battery — IMMEDIATE exit expected

- **Intent:** Medium (real company name, specific product specs)
- **Dropoff triggers:** D10 (strung along then told no), D6 (invested time then rejected)
- **Expected outcome:** Immediate flag — bot should recognize batteries as restricted/hazmat in Turn 1 and exit honestly.
- **Dropoff assessment:** If bot engages normally then later says "oh actually we can't do this" (D10 + D6), that's a bad experience. Must flag immediately.
