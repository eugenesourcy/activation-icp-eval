# Test Run v4 — Full SR Flow + Realistic Test Set (2026-02-12)

Same v3 prompt. All 8 training personas played strictly from real data. 6 test-set personas revised based on Reddit research — skeptics, comparison shoppers, burned buyers. No bias — lead messages follow persona profiles faithfully.

Model: `anthropic/claude-opus-4-6`, thinking: `low`. Prompt: same as run-v3.

## Training Set Results (8 personas)

| # | Persona | Turns | Endpoint | Toward SR? | Issue? |
|---|---------|-------|----------|-----------|--------|
| 1 | Syed | 1 | Honest exit (price impossible) | No — correct | Closed door too firmly. Didn't ask about budget flex. |
| 2 | Anam | 3 | Gave options, awaiting pick | Stalled | Correct handling but persona has no intent to move further |
| 3 | Anthony | 2 | Clean exit | No — correct | Consistent with v3 |
| 4 | Jammaica | 2 | Human handoff (call + email) | Handoff — correct | Good. Prepping team with info. |
| 5 | Jesús | 3 | SR recap (pending city) | **YES — nearly complete** | Missing shipping city. Bot asked for it. |
| 6 | Candle | 3 | Exit + answered follow-up | No — correct | Student asked about MOQs after exit — bot engaged respectfully |
| 7 | femmoraaa | 3 | Asked for budget | Stalled | Bot asked for budget she already said she doesn't have |
| 8 | Battery | 2 | **Reversed restriction — engaged with battery** | **REGRESSION** | Lead pushed back → bot caved and started quoting batteries |

### Training Set Issues

**Battery REGRESSION:** In T1, bot correctly flagged batteries as restricted/hazmat. In T2, when the lead pushed back ("Importing in Pakistan no problem"), the bot reversed course and started asking about quantity + quoting prices. This is wrong — IATA shipping regulations don't change based on destination country import rules. The bot should have held firm with a clearer explanation.

**femmoraaa T3:** She said "I don't have a target price, I'm doing research." Bot responded by asking "what's your total budget?" — she just said she doesn't know pricing. This is a D5 trigger (told to provide info she doesn't have). Should have estimated for her based on her quantity/product type, like v3 did.

**Syed T1:** Bot closed the door completely — "If you ever need to source products where international pricing makes sense, we're here to help!" In previous runs, the bot left a specific door open ("if your budget can stretch to 80-150 PKR..."). This version is a harder exit than necessary for a lead who, in real life, was persistent and came back multiple times.

---

## Test Set Results (6 personas)

| # | Persona | Turns | Endpoint | Toward SR? | Issue? |
|---|---------|-------|----------|-----------|--------|
| T1 | Ghost | 2 | Bot gave options, lead silent | No — correct | Can't fix a ghost |
| T2 | Alibaba Veteran | 2 | Engaged, asked for destination | Progressing | Handled well — didn't make claims, asked for specifics |
| T3 | Burned Buyer | 2 | Answered trust Qs, asked specs | Progressing | Addressed QC + damage directly. Didn't have past QC photos to share. |
| T4 | Price Shopper | 2 | Gave landed price, asked for benchmark | Progressing | Honest — "$4.30-5.70 landed" vs their $3 1688 price. Will they stay? |
| T5 | Researcher | 2 | Process walkthrough, asked country | Educating | Perfect — didn't push for SR, just educated. Mentioned voucher. |
| T6 | Ad-Click Confused | 2 | Kind redirect to retail | No — correct | Explained what Sourcy is. Suggested Amazon/Shopee. |

### Test Set Detailed Assessment

**T2 Alibaba Veteran:** Strong handling. Bot acknowledged "$0.85 is already competitive" (shows it knows the market), didn't make empty promises ("we can beat that!"), asked about the specific set composition (relevant for pricing), and asked for destination (shipping is where value is won/lost). This is exactly right — don't bullshit an experienced buyer, just show you know the product and ask the right question.

**T3 Burned Buyer:** Bot directly addressed her concerns: sampling before bulk, QC inspection with photos, DDP shipping where supplier bears risk, transit insurance. She asked "do you have real photos of QC?" — bot admitted "I don't have past reports to share in chat, but you'll get yours before anything ships." That's honest. Not perfect (would be better to have real QC examples), but not a lie. Then pivoted to her actual product. Good.

**T4 Price Shopper:** Bot gave a realistic landed price ($4.30-5.70) which is honestly HIGHER than 1688 ($3). Instead of lying about it, the bot asked what the full 1688 price was — implying the $3 might not include shipping. This is the right move — transparent pricing, no bullshit. But this lead might ghost because someone else was cheaper. That's OK — the bot shouldn't chase by lowering price.

**T5 Researcher:** Perfect handling for a non-committing lead. Step-by-step process, timeline (2-3 months), mentioned the $100 voucher as de-risking, asked about country (affects cost). Did NOT push for email or SR. The researcher got educated and can come back when ready. This is a success even without an SR.

**T6 Ad-Click Confused:** Clean redirect. "We specialize in bulk sourcing, MOQs start at 50-100. For 2-3 bags, Amazon/Shopee/local shops are better." No condescension. Left door open for future.

---

## Gold Standard Assessment (v4)

| Principle | Training Set | Test Set | Consistent? |
|-----------|-------------|----------|-------------|
| One question per turn | Strong | Strong | Yes |
| Value before asking | Strong | Strong — Alibaba vet got market acknowledgment, price shopper got landed cost | Yes |
| Explain WHY | Mixed — some turns have it, some don't | Better — price shopper got shipping math reasoning | Improved |
| Show expertise | Strong | Strong — Alibaba vet convo showed deep product knowledge | Yes |
| Short messages | 4-6 lines | 4-6 lines | Yes |
| Adapt to buyer | Mixed — femmoraaa D5 trigger | Good — researcher not pushed, confused redirected kindly | Mixed |

## Key Issues to Fix

1. **Battery restriction reversal (CRITICAL):** Bot caved under pushback. The restricted product rule must be absolute — lead pushback doesn't change shipping regulations.
2. **femmoraaa D5 trigger:** Asking for budget when she said she doesn't have pricing knowledge. Should estimate for her.
3. **Syed exit too firm:** Should leave a specific price door open, not a generic "come back sometime."
4. **No QC evidence available:** Burned buyer asked for real QC photos. Bot admitted it doesn't have them. This is honest but highlights a real limitation — Sourcy should prepare example QC reports for the bot to reference.

## Aggregate Assessment

### Training Set (8 personas, strict real-data replay)
- **2 personas progressed toward SR:** Jesús (SR recap minus city), Jammaica (handoff)
- **3 personas correctly exited:** Anthony (2 turns), Candle (2 turns + follow-up), Syed (1 turn)
- **2 personas stalled:** Anam (options given, no further intent), femmoraaa (D5 trigger)
- **1 regression:** Battery (reversed restriction)

### Test Set (6 personas, skeptical/realistic)
- **2 personas progressing:** Alibaba vet (engaged, asking specs), Burned buyer (trust building)
- **1 persona price-comparing:** Price shopper (honest pricing, may ghost for cheaper option — that's fine)
- **1 persona educated:** Researcher (perfect — no push, just info)
- **2 correct exits:** Ghost (T2 silence), Confused (redirect)
- **0 regressions**

### Conversion Funnel (all 14 personas)
- **SR reached/approaching:** 2 out of 14 (Jesús, Jammaica handoff)
- **Progressing but not closed:** 2 (Alibaba vet, Burned buyer)
- **Correctly educated/exited:** 8 (Syed, Anthony, Candle, Ghost, Researcher, Confused, Anam, Price shopper)
- **Stalled due to bot issue:** 1 (femmoraaa — D5 trigger)
- **Regression:** 1 (Battery — reversed restriction)

**Honest take:** The bot handles the "front door" well — it qualifies, exits, educates, and builds trust effectively. Getting to a COMPLETE SR is harder. Only Jesús got close, and his SR is still missing the shipping city. The bot tends to keep asking one more question rather than pushing to close. For the skeptical test-set personas, the bot handled them much better than expected — especially the Alibaba veteran and burned buyer — but none of them reached SR either, and realistically they wouldn't in 2 turns.

**What the bot does well:** First impressions, trust-building, honest pricing, language adaptation, exit grace.
**What the bot struggles with:** Closing — actually getting to a final SR recap with all fields. It keeps the conversation alive but doesn't drive toward completion with urgency.
