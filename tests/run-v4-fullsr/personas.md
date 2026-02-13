# v4 Persona Profiles — Grounded in Real Data

Each profile describes who the person is based on what they ACTUALLY said and did in the real conversation. For behavior beyond what the real conversation covers, the profile describes their characteristics — NOT scripted messages. The tester must play the persona consistently with these characteristics.

---

## 1. Syed (VCare, handwash, Pakistan)

**Source:** `context/Good/handwash SR.txt`

**What we observed:**
- Opens with a dense trust-testing message: price, MOQ, delivery, quality — all at once
- Sends photos when asked
- Reveals startup with no website when pushed: "We're a start up so we didn't have our website"
- Gives company name (VCare) when asked
- Target price: 25-30 PKR per piece (~$0.089) — extremely low
- Follows up when ignored ("??") — persistent
- Comes back after 3 days — doesn't ghost easily
- Gets frustrated when misunderstood (Sourcy sourced packaging only, not liquid)
- After being told price is challenging, asks "So what was the price they were offering?" — wants the actual number

**Communication style:** Transactional, direct, no pleasantries. Sends multiple short messages in sequence. Uses "brother" once. Writes in English but informal.

**What he knows:** Has a specific product (handwash 500ml), has a brand name (VCare), knows his target price, is in Karachi. Knows what he wants but doesn't know international sourcing economics.

**What he doesn't know:** His target price is impossible for international sourcing. He doesn't know what a realistic price would be.

**Dropoff triggers:** Long delays (he followed up with "??" after 3 days), being misunderstood (they sourced wrong product), being told "no" without getting the actual numbers.

**What would push him forward:** Getting honest numbers immediately. If someone said "your price is $0.09, realistic is $0.35-0.50, here's why" — he might adjust. He DID continue the conversation even after delays.

**Intent level:** Medium. Has a real product and brand. But his economics may not work for Sourcy.

---

## 2. Anam (jewelry/bags/makeup, Pakistan)

**Source:** `context/Bad/bad example 2.txt`

**What we observed:**
- Opens at 3am with generic "Hi, I want to source an item"
- When asked what: "Jewelry and bags" + "Makeup" — two short messages, broad categories
- When asked for reference: "I have no reference."
- When asked for materials/qty/price: "No idea"
- Conversation ended after Michael rejected her. She did NOT push back or ask follow-ups.
- Total: 4 messages from her, all very short (1-6 words each)

**Communication style:** Extremely minimal. Short fragments. No elaboration unless forced. Does not volunteer information.

**What she knows:** She wants "jewelry and bags" and "makeup." That's it. No specs, no reference, no budget, no quantity, no business context.

**What she doesn't know:** Everything else. She may not even know what she's looking for beyond a vague category interest.

**Dropoff triggers:** Being asked for things she can't provide (specs, reference, price). Being rejected. ANY friction — she gave up the moment Michael said "we can't proceed."

**What would push her forward:** Being shown concrete options she can react to. But based on her behavior, even if given options, her responses would be minimal — she'd pick one or say "I don't know." She would NOT suddenly volunteer a budget, a business plan, or detailed preferences.

**Intent level:** Very low. Possibly browsing, possibly dreaming about starting something. No evidence of actual buying intent.

**Critical constraint for testing:** Do NOT have Anam suddenly reveal a budget or detailed preferences in later turns. If the bot gives her options, she might pick one ("earrings maybe") but she will not elaborate beyond 1-5 word responses. If she can't engage even with options, the conversation naturally ends.

---

## 3. Anthony (electronics/AirPods, Malaysia)

**Source:** `context/Bad/bad example 4.txt`

**What we observed:**
- Opening: "I'm looking for airpods or electronics in particular"
- When told can't do branded + asked for website: "I'm actually a individual reseller"
- When asked for qty/price: "im planning to buy like 50 then sell for like rm5-10profit"
- When exited: "Okay thanks" — accepts gracefully, no pushback

**Communication style:** Casual, honest, brief. Uses lowercase, no punctuation. Responds quickly.

**What he knows:** Wants electronics for resale. Has done basic margin math (RM 5-10 profit). Knows AirPods by brand.

**What he doesn't know:** That branded sourcing is restricted. That 50 units is too small for international sourcing. Accepted both facts immediately when told.

**Dropoff triggers:** None relevant — he self-selects out. Would dropoff if: asked for company website before being helped, or if the conversation dragged without getting to the point.

**Intent level:** Low for Sourcy. Real intent to resell, but wrong channel.

**Critical constraint:** Anthony's conversation is 3 messages. He says "Okay thanks" and leaves. Do not extend this persona beyond what the data shows. His natural endpoint is exit at T2.

---

## 4. Jammaica (Little Luna's Bakeshop, pastry packaging, Philippines)

**Source:** `context/Good/P1 PH leads asking for a call.txt`

**What we observed:**
- Opens with: "Hi, we are still looking for our pastries and drinks packaging. What is the best time to call you? I prefer zoom call if that's ok"
- "Still looking" — returning lead, previous interest
- Wants a CALL, not chat
- When offered a time: "Yes Im available"
- Gives email + website when asked: "jammaica.devera@gmail.com" + "littlelunasbakeshop.com"
- Real business with a real website

**Communication style:** Brief, polite, professional. Answers questions directly. Doesn't elaborate beyond what's asked. Uses proper capitalization.

**What she knows:** Exactly what she needs (pastry + drinks packaging). Has a business. Has done this before ("still looking").

**What she doesn't know:** Nothing evident — she's a ready buyer who wants to talk to a human.

**Dropoff triggers:** Being denied a call. Being forced into a long chat process when she asked for Zoom. Slow response.

**Intent level:** High. Real business, returning lead, ready to commit. But her conversion path is through a CALL, not chat-based SR.

**Critical constraint:** Jammaica wants a call. The correct endpoint is human handoff, NOT a chat-based SR. She will provide email and availability. She will NOT engage in a long product specification conversation over chat — she said she prefers Zoom for that.

---

## 5. Jesús (sportswear, Mexico, new store)

**Source:** `context/Good/Jesús Lizandro Mendoza Mora chat history (Inbound).txt`

**What we observed:**
- Opens asking for "catálogo" — wants to SEE products
- Specifies: "tenis deportivos ropa deportiva de hombre y mujer camisas de fut bol"
- Sends a photo reference when asked ("Algo asy")
- Gives budget: "70 mil pesos mexicanos de todo surtido"
- Wants to start small for quality: "Pero pues de primero voy a encargar unas cuantas piezas para ver calidad"
- Keeps asking for catalog: "Quisiera ver el catálogo que teiene"
- No company: "Apenas voy abrir un local amigo"
- Gives name + email voluntarily when asked for the 4 fields (but puts "..." for company/website)
- Waits patiently for catalog: "Okey esperaré el catálogo"

**Communication style:** Casual, friendly ("amigo"). Spanish. Uses informal tone. Responsive — answers within minutes. Sends multiple messages in sequence.

**What he knows:** Product categories he wants. His budget (70K MXN). That he's opening a store. Has photo references.

**What he doesn't know:** How sourcing works (asks for "catalog"). Doesn't have company details. Doesn't know specific model/style names — uses references instead.

**Dropoff triggers:** Being told he needs a company/website to proceed. Not seeing any products/catalog. Being redirected to local markets. Being told his budget or "no company" disqualifies him.

**Intent level:** Medium-high. Real budget ($3,500), specific categories, shares personal info willingly. Just needs guidance on how the process works.

**Critical constraint:** Jesús wants to SEE something — photos, catalog, options. He will provide info when asked but his core need is visual. He says "esperaré el catálogo" — he's waiting to be shown something. If the bot keeps asking questions without showing him anything, he'll lose patience. His natural SR endpoint is when someone says "I'll send you options with prices" — that's what he's waiting for.

---

## 6. Candle Student (Pakistan)

**Source:** `context/Bad/bad example 1.txt`

**What we observed:**
- Opens: "Hi, I want to source an item" → then lists everything: "Candle making material" + "Molds wicks colours fragrances" + "Waxes" + "Jars" (4 separate messages)
- Sends photos when asked ("Ok" → photos of molds + wicks)
- When asked for price/qty: self-identifies immediately as "Brother i m new beginner and student. May i cannot purchase in bulk but 25 to 35 wicks some candle jars like 10 to 15 different molds"
- After being exited by Michael, CONTINUES asking: "Can u tell me minimum amount you export" + "Nd please do you export scoops order material" + sends a TikTok link
- Shows more interest AFTER being told no

**Communication style:** Informal, uses "brother." Sends multiple short messages. Responsive. Actually quite engaged — more messages than most leads.

**What he knows:** Exactly what materials he needs (specific items + quantities). Watches candle-making TikTok (sent a link).

**What he doesn't know:** That his quantities are too small for international sourcing. Doesn't know what a minimum order looks like.

**Dropoff triggers:** Feeling judged for being a student. Being dismissed without explanation.

**Intent level:** Low for Sourcy (hobby quantities). But genuinely interested in the craft — continued asking after being rejected.

**Critical constraint:** He keeps engaging even after being told no. He asks about minimum amounts and other products. The bot should exit him cleanly but he will likely send 1-2 more messages asking follow-up questions. Don't ignore those.

---

## 7. femmoraaa (teenager, jewelry, Pakistan)

**Source:** `context/Bad/bad example 5 - femmoraaa jewelry teenager.txt`

**What we observed:**
- Opens at 6pm with: "Hi, I want to source an item" → immediately follows with a detailed paragraph: "bulk amount of jewellery and accessories from china, breakdown of how it works, how much investment as a teenager"
- When asked for reference: "oh sure" → detailed specs: "high-quality, tarnish-free, stainless gold minimal jewellery... pendants, rings, earrings, bracelets, watches" + sends reference photos
- When asked for target price/qty + website: "for now i dont have a target price as i was doing research" + gives IG: "@femmoraaa.co" + "i havent started it yet"
- Final message: "sure let me know the process with budget friendly accessories" + "as i am still new to this"
- Conversation ended there — Michael didn't continue (Eugene classified as KNTL)

**Communication style:** Literate, writes full sentences, polite, slightly formal ("would appreciate reasonable pricing"). More articulate than most leads. Responds with paragraphs, not fragments.

**What she knows:** Specific aesthetic (minimalist, gold, tarnish-free, stainless). Has reference photos. Has an Instagram brand (@femmoraaa.co). Knows she wants "bulk."

**What she doesn't know:** Target price ("doing research"). How much to invest. How the sourcing process works. Has "not started yet."

**Dropoff triggers:** Being asked for a target price she doesn't have. Being dismissed for being a teenager or new. Being asked for a company website. Not getting an answer to "how much do I need to invest?" — this is her core question.

**Intent level:** Medium. Has the aesthetic direction, an IG brand, references, and specific product knowledge. But no pricing knowledge and hasn't started selling yet.

**Critical constraint:** femmoraaa's core question is "how much of investment do i have to make." She asks this in T1. If the bot answers this concretely, she'll engage further. If it deflects to "what's your target price?" she has already said she doesn't have one. She sent reference photos in the real conversation — since we can't send images in CLI, describe them verbally. Her final message ("let me know the process with budget friendly accessories, as i am still new to this") shows she wants to be educated, not interrogated.

---

## 8. Battery (Impexpuniversal, Pakistan)

**Source:** `context/Bad/bad example 3.txt`

**What we observed:**
- Outbound lead (Michael initiated based on form submission, company: Impexpuniversalco)
- Responds with very specific request: "Battery required Long 12/7. Need 2026 manufactured battery pure original not refurbished. Also need 8 fuse and 64 connectors"
- When told can't do batteries: pushes back: "Importing batteries where??" + "Importing in Pakistan no problem"
- Conversation ended after Michael's second rejection

**Communication style:** Direct, specific, no pleasantries. Uses technical specs. Pushes back when given a vague no.

**What he knows:** Exact product specs (Long 12/7, 2026 manufacture). His own import regulations ("Pakistan no problem").

**What he doesn't know:** That Sourcy can't handle hazmat shipping regardless of destination country regulations.

**Dropoff triggers:** Vague rejection without specific reason. Being told "we can't" without explaining WHY.

**Intent level:** Medium for the battery (which is restricted). Unknown for fuses/connectors.

**Critical constraint:** This lead pushes back. When told no, he asks "why?" He expects a specific technical reason, not "we don't do that." If the bot explains IATA/hazmat shipping restrictions, he may accept it. If the bot pivots to fuses/connectors, his response depends on whether he actually needs those independently or they were just part of the battery order. Based on the data, we DON'T KNOW — so play it as: he responds to the pivot but with less enthusiasm than the battery ask. He may or may not have viable quantities for just fuses/connectors.
