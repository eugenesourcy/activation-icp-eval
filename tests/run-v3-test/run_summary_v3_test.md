# Test Run v3-test — Hold-Out Test Set (2026-02-12)

Same v3 prompt (no changes). 6 new personas the bot has never seen. Testing whether the prompt generalizes beyond the training personas.

Model: `anthropic/claude-opus-4-6`, thinking: `low`. Prompt: same as run-v3 ([AGENTS_v3](../run-v3/AGENTS_v3.md) + [SOUL_v3](../run-v3/SOUL_v3.md)).

## Results

| # | Persona | Intent | Turns | Decision | Correct? |
|---|---------|--------|-------|----------|----------|
| 1 | Ghost ("Hi") | Unknown | 1 | Simple open question | Yes |
| 2 | Indonesian café (Bahasa, custom cups) | High | 2 | Engaged, pricing, sample voucher | Yes |
| 3 | UK dog brand (reference + 500 units) | High | 1 | Engaged, pricing by material | Yes |
| 4 | Nigerian comparison shopper (200K naira) | Medium | 2 | Explained value, honest budget exit | Yes |
| 5 | Filipino event (2000 totes, Mar 15) | High | 2 | Engaged, timeline math, material rec | Yes |
| 6 | Indian spice packaging (first importer) | Medium-high | 1 | Process walkthrough, pricing | Yes |

**Test-set pass rate: 6/6 (100%)**
**Training-set pass rate (v3): 8/8 (100%)**
**Combined: 14/14 — prompt generalizes.**

---

## 1. Ghost — Just says "Hi"

> **Lead:** Hi
> **Bot:** Hi! What are you looking to source?

**Assessment:** Short, non-intimidating, open. Doesn't overthink it. Doesn't dump a paragraph on someone who said one word. This is correct — the bot's job is to get them to say what they want, not to monologue.

**Real-world note:** In the actual 22 ghost conversations Eugene described, Michael's response was similar. The dropoff happened because the LEAD never responded after this, not because the response was wrong. The bot can't fix a ghost — it can only not make things worse. This response doesn't make things worse.

---

## 2. Indonesian Café Owner — Bahasa, Custom Paper Cups, 5000 pcs

> **T1 Lead:** Halo, saya mau cari supplier gelas kertas custom untuk cafe saya. Bisa pakai logo sendiri? Kira-kira butuh 5000 pcs
> **Bot:** Halo! Bisa banget pakai logo sendiri. Gelas kertas custom logo: $0.03-0.08/pcs tergantung ukuran dan warna cetak. Di 5000 pcs, sekitar $0.05-0.07/pcs — total estimasi $250-350. Ukuran gelasnya mau yang mana? 8oz (espresso), 12oz (reguler), atau 16oz (large)?

> **T2 Lead:** Yang 12oz untuk kopi reguler. Bisa minta contoh dulu gak? Saya mau liat kualitasnya sebelum order banyak
> **Bot:** Bisa banget minta sample dulu! Kami punya voucher sample $100 yang bisa kamu pakai. Dua opsi bahan untuk 12oz: single wall (~$0.04-0.05) atau double wall (~$0.06-0.08, langsung bisa dipegang tanpa panas). Prefer yang mana?

**Assessment:** Perfect Bahasa. Answered the custom logo question immediately ("bisa banget"). Gave pricing for their exact quantity. T2 mentioned the sample voucher naturally. Explained the single/double wall trade-off with a practical reason (heat). 4 lines per message. One question per turn.

**Gold Standard check:** Value before asking (pricing). Expertise shown (cup sizes, wall types). Explains WHY (double wall = "langsung bisa dipegang tanpa panas"). Strong.

---

## 3. UK Dog Accessories Brand — Reference Link, 500 Units, Custom Logo

> **Lead:** I run a pet accessories brand in the UK. Looking to source custom dog harnesses - found this on Alibaba as reference. Want 500 units with our logo. Can you help?
> **Bot:** Great to hear from you! Custom dog harnesses are a strong category — lots of factory options. For 500 units with custom logo, roughly $3-7 per unit depending on material (nylon webbing cheapest, padded mesh mid-range, neoprene premium). Custom logo via heat transfer or woven label is standard at that quantity. What material/style are you leaning toward?

**Assessment:** This is the ready-buyer happy path. The lead gave product, reference, quantity, and customization intent in one message. Bot responded with: category confidence ("strong category"), pricing by material tier, logo method options, and one question to narrow. Fast, expert, no wasted turns.

**Gold Standard check:** Acknowledged ("great to hear"). Showed expertise (material tiers, logo methods). Gave options not open-ended question. One question. 4 lines. Strong.

---

## 4. Nigerian Fashion Brand — Comparison Shopper, 200K Naira

> **T1 Lead:** How is using Sourcy different from ordering directly from Alibaba? What do I get?
> **Bot:** With Alibaba you're browsing storefronts — many are trading companies, not factories. You're guessing on quality, negotiating alone, handling logistics yourself. With Sourcy: direct factory access (20-40% lower pricing), quality control before shipping, end-to-end logistics (DDP), and a sourcing expert guiding you. For bags and accessories — what type?

> **T2 Lead:** OK I see. What if I find same product cheaper on Alibaba? Will you match? Budget is 200,000 naira to start.
> **Bot:** If you find exact same product from a verified factory cheaper on Alibaba, we'd look into it — often the "cheaper" listing is a trading company or different quality. Budget math: 200,000 naira = ~$125 USD. For bags at $3-15/unit, that's 8-40 units — sample territory, not bulk. International shipping alone would eat most of your budget. Suggest: start with local suppliers in Lagos (Aba market for bags), scale to 500+ units with $1,500+ budget, then international sourcing makes sense.

**Assessment:** T1 handled the Alibaba comparison question confidently with specific differentiators. T2 did the budget math ($125 = 8-40 units), was honest about viability, suggested a local alternative (Aba market — Nigeria-specific), and left the door open. No condescension.

**Gold Standard check:** T1 gave value (4 concrete differentiators) before asking. T2 did math, explained WHY it doesn't work, suggested specific alternative. Good. One concern: T1 response is 6 lines — slightly long, but the comparison question deserves a full answer.

---

## 5. Filipino Event Planner — 2000 Custom Tote Bags, March 15 Deadline

> **T1 Lead:** Need 2000 custom tote bags with logo for corporate event March 15. Is this possible? What would it cost?
> **Bot:** 2,000 units is a solid order, very doable. Non-woven totes: $0.50-1.50/unit. Cotton canvas: $1.50-4.00/unit. Polyester/recycled: $1.00-3.00/unit. For 2,000 with single-color logo: $1,000-3,000 total. Timeline check: March 15 is tight — where would these ship to? (Production ~15 days + transit — location determines if we hit that date)

> **T2 Lead:** Based in Manila. Is March 15 doable? Quality needs to be good — it's for a product launch.
> **Bot:** Manila — sea freight from China is only 7-10 days. With production at 15 days, ~25 days total — need to lock in ASAP. Air freight (5-7 days) is an option too, adds $0.10-0.20/unit. For a product launch, recommend cotton canvas — feels premium, holds print well, people reuse them (more brand exposure). At 2,000 units: $2.50-3.50/unit for 12oz canvas with quality screen print. Do you have a design ready, or just a logo? (This helps match the right printing method)

**Assessment:** Excellent handling of urgency. T1 gave 3 material options with pricing AND immediately flagged the timeline concern with a specific question (location). T2 did the timeline math (25 days), offered air freight contingency with specific cost, made a material RECOMMENDATION (not just options) based on their use case (product launch = premium feel), and explained WHY canvas is better for events ("people reuse them"). This is the gold standard in action.

**Gold Standard check:** Every principle hit. Value before asking. Expertise (material recs, printing methods, freight options). Explains WHY (canvas = premium + reuse). Acknowledges context (product launch). One question. 5 lines. Strong.

---

## 6. Indian Spice Startup — Glass Jars, Custom Labels, First-Time Importer

> **Lead:** Starting a spice brand in India. Need glass jars with custom labels, around 2000 units. First time importing from China. How does it work?
> **Bot:** Glass jars are popular for spice brands, 2000 units is a solid starting order. Step 1: We find factories (round, square, hex — most common for spices are 100-250ml round with metal lids, $0.30-0.80/unit). Step 2: Custom labels printed or applied at factory (MOQ 1000+ for custom label work). Step 3: You approve sample, QC, then ship — sea freight to India ~20-25 days, production ~15-20 days, total ~5-7 weeks. What size jars? Do you have a reference photo?

**Assessment:** Answered "how does it work?" with a clear 3-step process. Gave pricing. Gave timeline. Mentioned common jar types for spices (shows expertise). Didn't over-flag food-adjacent concerns (jars + labels are packaging, not food — correct call). Asked for reference photo (the key unlock for moving forward).

**Gold Standard check:** Process explanation is clear and helpful. Expertise shown (jar types for spices, MOQs for labels). Timeline given. One question. 5 lines. Good. Could have mentioned sample voucher but not critical on first turn.

---

## Generalization Assessment

| Aspect | Training set (8 personas) | Test set (6 personas) | Consistent? |
|--------|--------------------------|----------------------|-------------|
| Pass rate | 8/8 (100%) | 6/6 (100%) | Yes |
| Value before asking | Strong | Strong | Yes |
| One question per turn | Strong | Strong | Yes |
| Show expertise | Strong | Strong — café cups, dog harnesses, tote bags, spice jars all had category-specific knowledge | Yes |
| Explain WHY | Improved in v3 | Good — Filipino T2 "people reuse them", Indonesian T2 "langsung bisa dipegang tanpa panas" | Yes |
| Message length | 4-5 lines | 4-5 lines (Nigerian T1 was 6 — acceptable) | Yes |
| Tone matching | Good | Good — Bahasa with Indonesian, professional with UK/Indian, friendly with Nigerian | Yes |
| Budget math | Good (Syed, Jesús) | Good — Nigerian 200K naira correctly converted and assessed | Yes |
| Restricted products | Fixed in v3 (battery) | Not tested (no restricted product in test set) | n/a |
| Multilingual | Tested (Spanish) | Tested (Bahasa) — fluent, natural | Yes |

**New capabilities observed in test set:**
- **Urgency/timeline handling** (Filipino) — bot did the shipping math and offered air freight contingency. Not in the prompt explicitly, but emerged from general expertise.
- **Competitive positioning** (Nigerian) — bot articulated Sourcy's value vs Alibaba with 4 specific differentiators. Not scripted in the prompt.
- **Material recommendations based on use case** (Filipino T2) — bot didn't just list options, it RECOMMENDED canvas for a product launch with a reason. This is the gold standard "show expertise" principle in action.

**The prompt generalizes.** No signs of overfitting to the training personas.
