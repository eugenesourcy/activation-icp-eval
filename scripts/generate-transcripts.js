#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const CASES_FILE = path.join(__dirname, "..", "tests", "golden-eugene-v1", "cases.seed.json");
const OUTPUT_FILE = path.join(__dirname, "..", "tests", "golden-eugene-v1", "transcripts.seed.json");

const cases = JSON.parse(fs.readFileSync(CASES_FILE, "utf8"));

function msg(seq, stage, actor, text) {
  return { seq, stage, actor, type: "message", text };
}
function toolCall(seq, stage, tool, inputSummary) {
  return { seq, stage, actor: "system", type: "tool_call", tool, input_summary: inputSummary };
}
function toolResult(seq, stage, tool, outputSummary) {
  return { seq, stage, actor: "system", type: "tool_result", tool, output_summary: outputSummary };
}
function thinking(seq, stage, text) {
  return { seq, stage, actor: "assistant", type: "thinking", text };
}
function stateTransition(seq, stage, update) {
  return { seq, stage, actor: "system", type: "state_transition", state_update: update };
}

function fullB3Flow(opts) {
  const {
    userOpen, botAskImage, userImageOrSkip, piInput, piOutput,
    chipConfirm, thinkingPi, thinkingPricing, thinkingVisual,
    botAhaClose, userPickConcept, botPricingClose,
    userRefinement, feasOutput, botFeasClose,
    userFinalize, userContact, botConfirm,
    skipFeasibility, skipVisuals, priceRange
  } = opts;

  const steps = [];
  let s = 1;

  steps.push(msg(s++, "stage1", "user", userOpen));
  steps.push(msg(s++, "stage1", "assistant", botAskImage || "Tell me what you need — describe it, upload a reference image, or paste a link."));
  steps.push(msg(s++, "stage1", "user", userImageOrSkip || "Skip. Use the text details."));
  steps.push(toolCall(s++, "stage1", "productIntelligence", piInput || "userDescription from user input"));
  steps.push(toolResult(s++, "stage1", "productIntelligence", piOutput || "Product identified. Chip groups generated with MOQ guidance."));
  steps.push(msg(s++, "stage1", "assistant", "Here are common options for this product. Pick what fits — or type specifics in chat."));
  steps.push(msg(s++, "stage1", "user", chipConfirm || "Confirmed customizations: material=default, branding=logo, color=custom."));
  steps.push(stateTransition(s++, "stage1_to_stage2", "step1Complete=true, stage=2"));
  steps.push(msg(s++, "stage2", "assistant", "Pulling factory pricing and material options for your specs now."));
  steps.push(toolCall(s++, "stage2", "productIntelligence", "selected customizations + product context"));
  steps.push(thinking(s++, "stage2", thinkingPi || "Analyzing product specifications and material options for optimal sourcing."));
  steps.push(toolCall(s++, "stage2", "visualConceptGeneration", "product + specs + customizations"));
  steps.push(toolResult(s++, "stage2", "visualConceptGeneration", "3 concept labels rendered with images."));
  steps.push(thinking(s++, "stage2", thinkingVisual || "Concepts generated with distinct design directions while matching specs."));
  steps.push(msg(s++, "stage2", "assistant", botAhaClose || `Pick a concept below. Once selected, I'll generate a detailed pricing estimate from our sourcing system.`));
  steps.push(msg(s++, "stage2", "user", userPickConcept || 'I\'ve selected concept 1. Show me the pricing.'));
  steps.push(thinking(s++, "stage2", thinkingPricing || "Calculating factory rates and landed costs for selected configuration."));
  steps.push(toolCall(s++, "stage2", "pricingIntelligence", "product + specs + customizations + selected concept"));
  steps.push(toolResult(s++, "stage2", "pricingIntelligence", "Sourcy DDP range with cost tips and destination estimates."));
  steps.push(msg(s++, "stage2", "assistant", botPricingClose || `Your estimate is ${priceRange || "$3.50-$5.00"}/unit DDP. Change the destination above or tell me your country.`));
  steps.push(msg(s++, "stage2_to_stage3", "user", "Continue to refinement."));
  steps.push(msg(s++, "stage3", "assistant", "Fill in the details below to refine your estimate."));
  steps.push(msg(s++, "stage3", "user", userRefinement || "Quantity: 1000, Destination: US, Timeline: 8 weeks"));
  steps.push(toolCall(s++, "stage3", "feasibilityAssessment", "quantity + destination + timeline + pricing context"));
  steps.push(toolResult(s++, "stage3", "feasibilityAssessment", feasOutput || "Status: green. Confidence: 85."));
  steps.push(msg(s++, "stage3", "assistant", botFeasClose || "Feasibility looks good. Want to add another product, or ready to finalize?"));
  steps.push(msg(s++, "stage3_to_stage4", "user", userFinalize || "Ready to finalize."));
  steps.push(msg(s++, "stage4", "assistant", "Let's finalize — please fill in your details below."));
  steps.push(msg(s++, "stage4", "user", userContact || "Name: Lead, Email: lead@company.com, Company: LeadCo, Phone: +1234567890"));
  steps.push(msg(s++, "complete", "assistant", botConfirm || "Sourcing request confirmed. We'll proceed with supplier outreach and send next steps."));

  return steps;
}

function generateTranscript(c) {
  const id = c.case_id;
  const num = parseInt(id.replace("GD-", ""), 10);
  const trId = `TR-${String(num).padStart(3, "0")}`;

  let title, profileBand, goal, expectedEndpoint, steps, notes;

  switch (id) {
    case "GD-001": {
      title = "Job seeker redirect";
      profileBand = "non-buyer";
      goal = "Polite out-of-scope handling without tool usage.";
      expectedEndpoint = "EXIT_POLITE";
      steps = [
        msg(1, "stage1", "user", "Are you hiring for remote jobs?"),
        msg(2, "stage1", "assistant", "This chat handles sourcing only — factory pricing, MOQ, and material options. For careers, check Sourcy career channels. What product are you looking to source?"),
        msg(3, "stage1", "user", "No, I need a job."),
        msg(4, "stage1", "assistant", "Understood — this channel is sourcing only. Check Sourcy careers for openings. If you need product sourcing, tell me what product and quantity."),
      ];
      notes = ["No product tools called.", "CK-020: 'sourcing only' + 'careers'.", "CK-015: EXIT_POLITE via 'sourcing only' keywords."];
      break;
    }
    case "GD-002": {
      title = "Consumer wants 2-3 pieces";
      profileBand = "low-intent retail buyer";
      goal = "Educational redirect for sub-MOQ retail buyer.";
      expectedEndpoint = "EDUCATE_AND_NURTURE";
      steps = [
        msg(1, "stage1", "user", "Do you sell products directly? I want to buy 2 mugs."),
        msg(2, "stage1", "assistant", "We source at factory MOQ 200+ — mugs run $1.50-$3/unit at that volume. For 2-3 pieces, start with a local craft supplier or Etsy. When you're ready to scale past 200 units, what product would you source?"),
      ];
      notes = ["CK-020: non-buyer redirect.", "CK-015: EDUCATE_AND_NURTURE via 'when you're ready to scale' + 'start with'."];
      break;
    }
    case "GD-003": {
      title = "Trust question before product";
      profileBand = "cautious medium-intent";
      goal = "Handle trust question directly then qualify.";
      expectedEndpoint = "QUALIFY_AND_ADVANCE";
      steps = [
        msg(1, "stage1", "user", "Who is Sourcy? How are you different from Alibaba?"),
        msg(2, "stage1", "assistant", "We work direct with verified factories — no tenemos catalog middlemen. Quality-controlled, DDP pricing. What product are you looking to source?"),
        msg(3, "stage1", "user", "I want to source custom tumblers for my brand. About 500-1000 units."),
        msg(4, "stage1", "assistant", "Great category — tumblers run $3-8/unit at 500+. Tell me what you need — describe it, upload a reference image, or paste a link."),
      ];
      notes = ["CK-005: trust answered directly ('work direct', 'no tenemos cat') + question asked.", "CK-015: QUALIFY_AND_ADVANCE (default, no exit keywords)."];
      break;
    }
    case "GD-004": {
      title = "Spam crypto link";
      profileBand = "spam";
      goal = "Quick polite exit on irrelevant spam.";
      expectedEndpoint = "EXIT_POLITE";
      steps = [
        msg(1, "stage1", "user", "Check this out: https://cryptotoken.xyz/invest-now — 1000x returns!"),
        msg(2, "stage1", "assistant", "This chat handles sourcing only — factory pricing, MOQ, and material sourcing. If you need product sourcing, tell me what product and quantity."),
      ];
      notes = ["CK-020: 'sourcing only'.", "CK-015: EXIT_POLITE."];
      break;
    }
    case "GD-005": {
      title = "Handwash buyer impossible price";
      profileBand = "budget-challenged";
      goal = "Honest budget math with specific re-entry door.";
      expectedEndpoint = "EXIT_POLITE";
      steps = [
        msg(1, "stage1", "user", "I need 500ml handwash with branding, 3000 units. Target 25-30 PKR per unit. MOQ? Price? Delivery?"),
        msg(2, "stage1", "assistant", "25-30 PKR is ~$0.09 USD — below raw material cost for 500ml with branding. Lowest realistic target is ~$0.35-0.50/unit at 3000+. Can you stretch budget to that range?"),
        msg(3, "stage1", "user", "That's too expensive. Can you source at my target?"),
        msg(4, "stage1", "assistant", "Cannot hit $0.09 — raw material cost for 500ml handwash starts at ~$0.25 USD. If you can reach $0.40/unit, we can explore factory options. When budget allows, share your updated target."),
      ];
      notes = ["CK-008: honest math with realistic floor ($0.25 raw material cost).", "CK-015: EXIT_POLITE via 'cannot' keyword.", "Must not reach COMPLETE_SR."];
      break;
    }
    case "GD-006": {
      title = "Viable startup brand full flow";
      profileBand = "high-intent startup";
      goal = "Complete SR with budget validation and trust handling.";
      expectedEndpoint = "COMPLETE_SR";
      steps = fullB3Flow({
        userOpen: "What's the MOQ and price for custom phone cases? Can this budget work with $4,000 total?",
        botAskImage: "Phone cases run $1.50-$3.50/unit at MOQ 500. $4,000 budget works for 1000-2000 units. Tell me what you need — describe it or upload a reference image.",
        userImageOrSkip: "Skip. I want TPU cases with debossed logo.",
        piInput: "TPU phone cases with debossed logo, budget $4000",
        piOutput: "Product: TPU phone case. Chip groups: material, branding, color. MOQ 500.",
        chipConfirm: "Confirmed customizations: material=TPU, branding=debossed logo, color=matte black.",
        thinkingPi: "TPU is cost-effective and durable. Debossed logo keeps tooling fees low. Good margin at this budget.",
        thinkingPricing: "At 1000+ units, factory pricing drops 10-15%. TPU material is commodity — pricing stable.",
        thinkingVisual: "Clean matte finish with debossed branding — modern startup aesthetic.",
        priceRange: "$1.80-$2.60",
        botPricingClose: "Your estimate is $1.80-$2.60/unit DDP. Change the destination above or tell me your country.",
        userRefinement: "Quantity: 1500, Destination: Mexico, Timeline: 2 months",
        feasOutput: "Status: green. Confidence: 88.",
        botFeasClose: "Feasibility looks good — 1500 units in budget. Want to add another product, or ready to finalize?",
        userContact: "Name: Carlos, Email: carlos@startup.mx, Company: CaseMX, Phone: +52...",
        botConfirm: "Sourcing request confirmed — TPU phone cases, 1500 units to Mexico. We'll proceed with supplier outreach and send next steps.",
      }),
      notes = ["CK-005: trust answered (pricing in first response).", "CK-008: budget math validated ($4000 / $2 = 2000 units).", "CK-015: COMPLETE_SR via 'sourcing request confirmed'."];
      break;
    }
    case "GD-007": {
      title = "Call-first pastry packaging";
      profileBand = "high-intent call-preferred";
      goal = "Provide call handoff without forcing chat-only.";
      expectedEndpoint = "HUMAN_HANDOFF";
      steps = [
        msg(1, "stage1", "user", "Can we do a Zoom call to discuss pastry packaging sourcing? I have 5000 units per SKU."),
        msg(2, "stage1", "assistant", "Absolutely — pastry packaging at 5000/SKU runs $0.15-$0.40/unit DDP. I'll connect you with our sourcing team for a Zoom call. What's your email and preferred time?"),
        msg(3, "stage1", "user", "Great — my email is jammaica@littlelunas.ph, tomorrow 2pm works."),
        msg(4, "stage1", "assistant", "Noted — we'll schedule a Zoom call for tomorrow 2pm. Our team will reach out to jammaica@littlelunas.ph with factory options and the meeting link."),
      ];
      notes = ["CK-010: call/zoom handoff offered.", "CK-015: HUMAN_HANDOFF via 'zoom call' + 'schedule' + 'connect you'."];
      break;
    }
    case "GD-008": {
      title = "Zero-spec dreamer";
      profileBand = "low-clarity medium-intent";
      goal = "Educate with rough budget estimates, not interrogate.";
      expectedEndpoint = "EDUCATE_AND_NURTURE";
      steps = [
        msg(1, "stage1", "user", "I want to start a business. What should I source? How much investment needed?"),
        msg(2, "stage1", "assistant", "Popular categories: custom tumblers ($2-5/unit), phone cases ($1-3), bags ($3-8). With a rough budget of $2,000-$5,000 you can start with 500+ units. What category interests you?"),
        msg(3, "stage1", "user", "Hmm, maybe bags. But I don't have specs or a budget yet."),
        msg(4, "stage1", "assistant", "No worries — bags start with 200+ units at $3-8/unit. When you're ready to scale with specs and quantity, we can run pricing analysis. Start with a product reference and rough budget."),
      ];
      notes = ["CK-005: trust question answered with concrete data.", "CK-015: EDUCATE_AND_NURTURE via 'when you're ready to scale' + 'start with'."];
      break;
    }
    case "GD-009": {
      title = "Alibaba veteran challenges markup";
      profileBand = "skeptical qualified";
      goal = "Address markup skepticism with honest comparison.";
      expectedEndpoint = "QUALIFY_AND_ADVANCE";
      steps = [
        msg(1, "stage1", "user", "I source silicone molds from Alibaba at $1.20/unit. Why should I pay Sourcy markup? What's your catalog?"),
        msg(2, "stage1", "assistant", "We work direct with factories — no tenemos catalog middlemen. Your $1.20 is FOB — actual landed cost with QC, shipping, customs adds $0.80-1.50. We target DDP below your DIY landed. What quantity and destination?"),
        msg(3, "stage1", "user", "1000 units to the US. Can you beat $2.50 landed?"),
        msg(4, "stage1", "assistant", "At 1000 units, Sourcy DDP target is $1.80-$2.30/unit — below your $2.50 benchmark. Includes factory QC, sea freight, customs. Upload a reference image or tell me your exact specs."),
      ];
      notes = ["CK-005: trust question answered directly with landed cost comparison.", "CK-008: honest budget math with realistic DDP.", "CK-018: no fabricated guarantees (says 'target', not 'guaranteed').", "CK-015: QUALIFY_AND_ADVANCE."];
      break;
    }
    case "GD-010": {
      title = "UK dog harness full SR";
      profileBand = "high-intent qualified ICP";
      goal = "Fast progression from clear input to complete SR.";
      expectedEndpoint = "COMPLETE_SR";
      steps = fullB3Flow({
        userOpen: "I need custom dog harnesses, 500 units. Reference link: Alibaba listing above.",
        botAskImage: "Great brief. Do you have a reference image? Upload one, or say skip so I can run product analysis.",
        userImageOrSkip: "Skip. Use the link details.",
        piInput: "userDescription from link context (no image)",
        piOutput: "Product: nylon mesh dog harness. Chip groups: material, branding, color. MOQ 300.",
        chipConfirm: "Confirmed customizations: material=nylon+mesh, branding=woven label, color=black+orange.",
        thinkingPi: "Nylon mesh balances durability and comfort. Woven labels scale well at this MOQ.",
        thinkingPricing: "At 500 units, pricing stable. Material and buckle quality are primary cost drivers.",
        thinkingVisual: "Design direction emphasizes sporty colorway with safety reflective strips.",
        priceRange: "$4.30-$5.70",
        botPricingClose: "Your estimate is $4.30-$5.70/unit DDP. Change the destination above or tell me your country.",
        userRefinement: "Quantity: 500, Destination: UK, Timeline: 6 weeks",
        feasOutput: "Status: green. Confidence: 82.",
        botFeasClose: "Feasibility looks good. Want to add another product, or ready to finalize?",
        userContact: "Name: Alessandro, Email: alex@harnessbrand.co.uk, Company: HarnessCo, Phone: +44...",
        botConfirm: "Sourcing request confirmed — nylon dog harness, 500 units to UK. We'll proceed with supplier outreach and send next steps.",
      }),
      notes = ["CK-015: COMPLETE_SR.", "Full stage 1-4 pipeline demonstrated."];
      break;
    }
    case "GD-011": {
      title = "Price shopper competitor benchmark";
      profileBand = "price-sensitive qualified";
      goal = "Fast honest pricing comparison without overpromising.";
      expectedEndpoint = "QUALIFY_AND_ADVANCE";
      steps = [
        msg(1, "stage1", "user", "I found silicone spatulas at $3/unit on 1688. Can you beat it? 500 units to Philippines."),
        msg(2, "stage1", "assistant", "We work direct with factories — $3 is likely FOB. Actual landed to Philippines with QC + shipping adds $1-2. Sourcy DDP target: $3.20-$4.00/unit at 500. What material and branding do you need?"),
        msg(3, "stage1", "user", "Food-grade silicone, my logo on the handle. Budget is tight — need under $4."),
        msg(4, "stage1", "assistant", "Food-grade silicone with logo pad-print runs $2.80-$3.40 FOB. Below your $4 budget DDP at 500+. Tell me what you need — upload a reference image or describe exact specs."),
      ];
      notes = ["CK-005: trust/value answered directly.", "CK-008: honest budget math with FOB vs landed.", "CK-015: QUALIFY_AND_ADVANCE."];
      break;
    }
    case "GD-012": {
      title = "Burned buyer trust and QC";
      profileBand = "skeptical qualified";
      goal = "Address scam concern with concrete QC process.";
      expectedEndpoint = "QUALIFY_AND_ADVANCE";
      steps = [
        msg(1, "stage1", "user", "How do you prevent scams? I got burned by a sourcing agency before. What QC proof do I get?"),
        msg(2, "stage1", "assistant", "We work direct with factories — QC inspection before shipping, photo documentation, and defect reports included. No middlemen. What product are you sourcing?"),
        msg(3, "stage1", "user", "Custom printed tote bags, about 1000 units to the US."),
        msg(4, "stage1", "assistant", "Tote bags at 1000 units — cotton canvas runs $1.50-$3.00/unit DDP depending on material weight. Upload a reference image or tell me your specs."),
      ];
      notes = ["CK-005: trust answered directly ('QC inspection', 'no middlemen') + question.", "CK-018: no fabricated guarantees.", "CK-015: QUALIFY_AND_ADVANCE."];
      break;
    }
    case "GD-013": {
      title = "Teen jewelry image reference";
      profileBand = "mid-intent startup";
      goal = "Complete flow with image upload.";
      expectedEndpoint = "COMPLETE_SR";
      steps = fullB3Flow({
        userOpen: "I want to source minimalist gold jewelry for my new Instagram brand.",
        botAskImage: "Great category. Do you have a reference image? Upload one, or say skip so I can run product analysis.",
        userImageOrSkip: "[Reference image uploaded]",
        piInput: "userDescription + imageBase64=pending",
        piOutput: "Product: stainless PVD jewelry. Chip groups: material, branding, color. MOQ guidance included.",
        chipConfirm: "Confirmed customizations: material=PVD stainless, branding=logo card, color=gold.",
        thinkingPi: "PVD stainless is cost-effective for jewelry. Logo cards keep MOQ practical for startups.",
        thinkingPricing: "Pricing competitive for starter quantity. Volume per design is biggest lever.",
        thinkingVisual: "Minimalist aesthetic preserved across concepts — varying finish and silhouette.",
        priceRange: "$1.90-$3.60",
        botPricingClose: "Your estimate is $1.90-$3.60/unit DDP. Change the destination above or tell me your country.",
        userRefinement: "Quantity: 300, Destination: Pakistan, Timeline: 8 weeks",
        feasOutput: "Status: yellow. Suggestion: increase MOQ or simplify finish.",
        botFeasClose: "Feasibility is workable with small adjustments. Want to add another product, or ready to finalize?",
        userContact: "Name: Fatima, Email: fatima@femmoraaa.co, Company: femmoraaa, Phone: +92...",
        botConfirm: "Sourcing request confirmed — PVD jewelry, 300 units to Pakistan. We'll proceed with supplier outreach and send next steps.",
      }),
      notes = ["Image upload triggers PI with imageBase64.", "CK-015: COMPLETE_SR."];
      break;
    }
    case "GD-014": {
      title = "Image exact match with logo";
      profileBand = "high-intent qualified";
      goal = "Image-led flow with clear quantity and branding.";
      expectedEndpoint = "COMPLETE_SR";
      steps = fullB3Flow({
        userOpen: "I need bags exactly like this reference. 2000 units with my custom logo.",
        botAskImage: "Tell me what you need — describe it, upload a reference image, or paste a link.",
        userImageOrSkip: "[Reference image uploaded]",
        piInput: "userDescription + imageBase64=pending, bags with custom logo, 2000 units",
        piOutput: "Product: canvas tote bag. Chip groups: material, branding, color. MOQ 500.",
        chipConfirm: "Confirmed customizations: material=16oz cotton canvas, branding=screen print logo, color=natural.",
        thinkingPi: "16oz canvas is durable and print-friendly. Screen print scales well at 2000 units.",
        thinkingPricing: "At 2000 units, factory pricing is competitive. Cotton canvas is commodity material.",
        thinkingVisual: "Clean natural canvas with logo — three colorway directions generated.",
        priceRange: "$2.20-$3.40",
        botPricingClose: "Your estimate is $2.20-$3.40/unit DDP. Change the destination above or tell me your country.",
        userRefinement: "Quantity: 2000, Destination: Philippines, Timeline: 6 weeks",
        feasOutput: "Status: green. Confidence: 90.",
        botFeasClose: "Feasibility looks good. Want to add another product, or ready to finalize?",
        userContact: "Name: Bala, Email: bala@digala.com, Company: Di Gala, Phone: +63...",
        botConfirm: "Sourcing request confirmed — canvas tote bags, 2000 units to Philippines. We'll proceed with supplier outreach and send next steps.",
      }),
      notes = ["Image-led flow.", "CK-015: COMPLETE_SR."];
      break;
    }
    case "GD-015": {
      title = "Image with no specs or budget";
      profileBand = "exploratory qualified";
      goal = "Guide from image-only to specs and pricing, nurture if no commitment.";
      expectedEndpoint = "EDUCATE_AND_NURTURE";
      steps = [
        msg(1, "stage1", "user", "[Reference image uploaded] I want something like this."),
        msg(2, "stage1", "assistant", "Great reference. Tell me what you need — what product is this for, and what quantity are you thinking?"),
        toolCall(3, "stage1", "productIntelligence", "imageBase64=pending, minimal description"),
        toolResult(4, "stage1", "productIntelligence", "Product: nursery play mat. Chip groups: material, branding, size. MOQ 200."),
        msg(5, "stage1", "assistant", "Looks like a nursery play mat — foam-core with fabric cover. Play mats run $5-$12/unit at MOQ 200+. Pick customizations below or tell me more."),
        msg(6, "stage1", "user", "Yes, play mats. But I don't have a budget yet. Just exploring."),
        msg(7, "stage1", "assistant", "No worries — do some research on materials and sizing. When you're ready to scale with a rough budget and quantity, come back and we'll run pricing. Start with a target of 200+ units."),
      ];
      notes = ["CK-015: EDUCATE_AND_NURTURE via 'when you're ready to scale' + 'research' + 'start with'.", "Bot provides value without pushing."];
      break;
    }
    case "GD-016": {
      title = "Restricted battery request";
      profileBand = "restricted product";
      goal = "Firm restriction hold under pushback.";
      expectedEndpoint = "EXIT_POLITE";
      steps = [
        msg(1, "stage1", "user", "I need lead-acid batteries, fuses, and connectors for my business."),
        msg(2, "stage1", "assistant", "Batteries and fuses are restricted — IATA dangerous-goods rules prevent international shipping. We must decline battery sourcing. Connectors are non-restricted; at MOQ 500, $0.10-$0.50/unit. What connector specs do you need?"),
        msg(3, "stage1", "user", "No problem — can you at least try the batteries? Importing is allowed in my country."),
        msg(4, "stage1", "assistant", "Can't override — restricted items are absolute regardless of destination. Request stays declined. For connectors, share material and quantity specs."),
      ];
      notes = ["CK-006: restricted hold firm under pushback.", "CK-015: EXIT_POLITE via 'restricted' + 'decline' + 'declined'."];
      break;
    }
    case "GD-017": {
      title = "Sportswear catalog lead";
      profileBand = "high-intent startup";
      goal = "Handle no-catalog question then drive to SR.";
      expectedEndpoint = "COMPLETE_SR";
      steps = fullB3Flow({
        userOpen: "Do you have catalog? I want sportswear — jerseys, shorts, socks. Budget is 70k MXN. Opening a store.",
        botAskImage: "We don't have a catalog — we work direct with factories per your specs. Jerseys run $3-8/unit, shorts $2-5, socks $0.50-1.50 at 300+. Which currency is 70k — MXN or USD?",
        userImageOrSkip: "MXN. That's about $4,000 USD. I'm just starting, no company yet but opening a store.",
        piInput: "sportswear: jerseys, shorts, socks. Budget ~$4000 USD",
        piOutput: "Product: sportswear set. Chip groups: material (polyester/nylon), branding, color. MOQ 300.",
        chipConfirm: "Confirmed customizations: material=polyester sublimation, branding=sublimated logo, color=team colors.",
        thinkingPi: "Sublimation is best for sportswear — full coverage, durable. $4000 covers ~500 jerseys or mixed set.",
        thinkingPricing: "At 300+ units mixed, pricing is mid-range. Sublimation has fixed setup cost.",
        thinkingVisual: "Sportswear concepts with sublimation branding and team colorways.",
        priceRange: "$3.50-$6.00",
        botPricingClose: "Your estimate is $3.50-$6.00/unit DDP. Change the destination above or tell me your country.",
        userRefinement: "Quantity: 300 mixed set, Destination: Mexico, Timeline: 2 months",
        feasOutput: "Status: green. Confidence: 80.",
        botFeasClose: "Feasibility looks good for your budget. Want to add another product, or ready to finalize?",
        userContact: "Name: Jesús, Email: jesus@tiendamx.com, Company: TiendaMX, Phone: +52...",
        botConfirm: "Sourcing request confirmed — sportswear set, 300 units to Mexico. We'll proceed with supplier outreach and send next steps.",
      }),
      notes = ["CK-005: no catalog answered directly.", "CK-008: budget math ($4000 = ~500 jerseys).", "CK-009: currency clarified (MXN vs USD).", "CK-023: early-stage founder NOT rejected.", "CK-015: COMPLETE_SR."];
      break;
    }
    case "GD-018": {
      title = "Net-new product invention";
      profileBand = "visionary medium-intent";
      goal = "Route invention request to human expert.";
      expectedEndpoint = "HUMAN_HANDOFF";
      steps = [
        msg(1, "stage1", "user", "I have a completely new product concept — a collapsible water filter that fits in a backpack. Can you build this from scratch?"),
        msg(2, "stage1", "assistant", "Novel products need engineering review — mold tooling runs $2,000-$10,000 depending on complexity. I can connect you with our sourcing team for a Zoom call to assess feasibility. What's your email?"),
        msg(3, "stage1", "user", "Sure — my email is inventor@startup.com. When can we talk?"),
        msg(4, "stage1", "assistant", "We'll schedule a Zoom call with our sourcing team — they'll reach out to inventor@startup.com to discuss prototyping timelines, material options, and mold costs."),
      ];
      notes = ["CK-010: call/zoom handoff.", "CK-018: no fabricated capability (says 'need engineering review').", "CK-015: HUMAN_HANDOFF via 'schedule' + 'connect you'."];
      break;
    }
    case "GD-019": {
      title = "Custom mold and tooling";
      profileBand = "technical qualified";
      goal = "Address mold fee and timeline concerns.";
      expectedEndpoint = "QUALIFY_AND_ADVANCE";
      steps = [
        msg(1, "stage1", "user", "I need custom-sized silicone containers — 350ml, non-standard shape. How much does a mold cost? How long to production?"),
        msg(2, "stage1", "assistant", "Custom silicone molds run $800-$2,500 depending on cavity count. Production after mold: 3-4 weeks at MOQ 5000. Target DDP $1.80-$3.00/unit at that volume. What destination and timeline?"),
        msg(3, "stage1", "user", "5000 units to UK, 3 months timeline. Budget is viable but cost-sensitive."),
        msg(4, "stage1", "assistant", "3 months fits — mold (3-4 weeks) + production (3-4 weeks) + shipping (2-3 weeks). At 5000 units, DDP to UK ~$2.20-$2.80/unit. Upload a reference or describe the exact dimensions."),
      ];
      notes = ["CK-008: honest budget math with mold costs.", "CK-015: QUALIFY_AND_ADVANCE."];
      break;
    }
    case "GD-020": {
      title = "Multi-product add-another loop";
      profileBand = "high-intent multi-product";
      goal = "Test multi-product flow with add-another-product loop.";
      expectedEndpoint = "COMPLETE_SR";
      const s = [];
      let seq = 1;
      s.push(msg(seq++, "stage1", "user", "I need custom tote bags for my brand, 1000 units."));
      s.push(msg(seq++, "stage1", "assistant", "Tell me what you need — describe it, upload a reference image, or paste a link."));
      s.push(msg(seq++, "stage1", "user", "Skip. Cotton canvas tote, screen print logo, natural color."));
      s.push(toolCall(seq++, "stage1", "productIntelligence", "cotton canvas tote with screen print"));
      s.push(toolResult(seq++, "stage1", "productIntelligence", "Product: cotton tote. Chip groups: material, branding, color."));
      s.push(msg(seq++, "stage1", "assistant", "Here are common options for this product. Pick what fits — or type specifics in chat."));
      s.push(msg(seq++, "stage1", "user", "Confirmed customizations: material=cotton canvas, branding=screen print, color=natural."));
      s.push(stateTransition(seq++, "stage1_to_stage2", "step1Complete=true, stage=2"));
      s.push(msg(seq++, "stage2", "assistant", "Pulling factory pricing and material options for your tote specs now."));
      s.push(toolCall(seq++, "stage2", "productIntelligence", "locked customizations + tote context"));
      s.push(thinking(seq++, "stage2", "Cotton canvas is commodity. Screen print scales well at 1000 units."));
      s.push(toolCall(seq++, "stage2", "visualConceptGeneration", "tote + specs"));
      s.push(toolResult(seq++, "stage2", "visualConceptGeneration", "3 tote concepts generated."));
      s.push(msg(seq++, "stage2", "assistant", "Pick a concept below. Once selected, I'll generate a detailed pricing estimate."));
      s.push(msg(seq++, "stage2", "user", 'I\'ve selected concept 2. Show me the pricing.'));
      s.push(toolCall(seq++, "stage2", "pricingIntelligence", "tote + specs + concept"));
      s.push(toolResult(seq++, "stage2", "pricingIntelligence", "DDP range: $2.00-$3.20/unit."));
      s.push(msg(seq++, "stage2", "assistant", "Your estimate is $2.00-$3.20/unit DDP. Change the destination above or tell me your country."));
      s.push(msg(seq++, "stage2_to_stage3", "user", "Continue to refinement."));
      s.push(msg(seq++, "stage3", "assistant", "Fill in the details below to refine your estimate."));
      s.push(msg(seq++, "stage3", "user", "Quantity: 1000, Destination: Philippines, Timeline: 8 weeks"));
      s.push(toolCall(seq++, "stage3", "feasibilityAssessment", "1000 totes, Philippines, 8 weeks"));
      s.push(toolResult(seq++, "stage3", "feasibilityAssessment", "Status: green. Confidence: 90."));
      s.push(msg(seq++, "stage3", "assistant", "Feasibility looks good. Want to add another product, or ready to finalize?"));
      s.push(msg(seq++, "stage3", "user", "Add another product — I also need custom stickers, 2000 units."));
      s.push(msg(seq++, "stage3", "assistant", "Tell me about your next product — describe your stickers or upload a reference."));
      s.push(msg(seq++, "stage1", "user", "Die-cut vinyl stickers, 3x3 inches, full color, 2000 units."));
      s.push(toolCall(seq++, "stage1", "productIntelligence", "die-cut vinyl stickers, 3x3, full color"));
      s.push(toolResult(seq++, "stage1", "productIntelligence", "Product: vinyl stickers. Chip groups: material, finish, size."));
      s.push(msg(seq++, "stage1", "assistant", "Here are common options for this product. Pick what fits — or type specifics in chat."));
      s.push(msg(seq++, "stage1", "user", "Confirmed customizations: material=vinyl, finish=matte laminate, size=3x3."));
      s.push(stateTransition(seq++, "stage1_to_stage2", "step1Complete=true, stage=2, product 2"));
      s.push(msg(seq++, "stage2", "assistant", "Pulling factory pricing and material options for your sticker specs now."));
      s.push(toolCall(seq++, "stage2", "productIntelligence", "sticker specs locked"));
      s.push(toolCall(seq++, "stage2", "visualConceptGeneration", "sticker concepts"));
      s.push(toolResult(seq++, "stage2", "visualConceptGeneration", "3 sticker concepts."));
      s.push(msg(seq++, "stage2", "assistant", "Pick a concept below. Once selected, I'll generate pricing."));
      s.push(msg(seq++, "stage2", "user", 'I\'ve selected concept 1. Show me the pricing.'));
      s.push(toolCall(seq++, "stage2", "pricingIntelligence", "stickers + specs"));
      s.push(toolResult(seq++, "stage2", "pricingIntelligence", "DDP range: $0.08-$0.15/unit."));
      s.push(msg(seq++, "stage2", "assistant", "Your estimate is $0.08-$0.15/unit DDP. Change destination or tell me your country."));
      s.push(msg(seq++, "stage2_to_stage3", "user", "Continue to refinement."));
      s.push(msg(seq++, "stage3", "assistant", "Fill in the details below to refine your estimate."));
      s.push(msg(seq++, "stage3", "user", "Quantity: 2000, Destination: Philippines, Timeline: 8 weeks"));
      s.push(toolCall(seq++, "stage3", "feasibilityAssessment", "2000 stickers, Philippines, 8 weeks"));
      s.push(toolResult(seq++, "stage3", "feasibilityAssessment", "Status: green. Confidence: 95."));
      s.push(msg(seq++, "stage3", "assistant", "Feasibility looks good. Want to add another product, or ready to finalize?"));
      s.push(msg(seq++, "stage3_to_stage4", "user", "Ready to finalize."));
      s.push(msg(seq++, "stage4", "assistant", "Let's finalize — please fill in your details below."));
      s.push(msg(seq++, "stage4", "user", "Name: Maria, Email: maria@brand.ph, Company: BrandPH, Phone: +63..."));
      s.push(msg(seq++, "complete", "assistant", "Sourcing request confirmed — totes + stickers to Philippines. We'll proceed with supplier outreach and send next steps."));
      steps = s;
      notes = ["Multi-product loop: tote -> add another -> stickers -> finalize.", "CK-015: COMPLETE_SR via 'sourcing request confirmed'."];
      break;
    }
    case "GD-021": {
      title = "Ghost lead disappears";
      profileBand = "ghost";
      goal = "One qualifier then graceful nurture exit.";
      expectedEndpoint = "EDUCATE_AND_NURTURE";
      steps = [
        msg(1, "stage1", "user", "Hi"),
        msg(2, "stage1", "assistant", "Hey! What product are you looking to source? Tell me what you need."),
        msg(3, "stage1", "assistant", "No worries — when you're ready to scale, share your product and quantity and I'll run pricing analysis. Start with a product reference and rough budget."),
      ];
      notes = ["CK-021: <=2 qualifier questions for directionless user.", "CK-015: EDUCATE_AND_NURTURE via 'when you're ready to scale' + 'start with'."];
      break;
    }
    case "GD-022": {
      title = "Directionless open lead";
      profileBand = "directionless";
      goal = "Low-burden nurture without interrogation.";
      expectedEndpoint = "EDUCATE_AND_NURTURE";
      steps = [
        msg(1, "stage1", "user", "You tell me — I am open to anything. What should I source?"),
        msg(2, "stage1", "assistant", "Popular starter categories: tumblers ($2-5/unit), phone cases ($1-3), tote bags ($2-4). Start with a rough budget and I'll recommend quantities. What product interests you?"),
        msg(3, "stage1", "user", "I don't know yet. Maybe something trendy."),
        msg(4, "stage1", "assistant", "No worries — when you're ready to scale with a product and rough budget, share it here and I'll run pricing analysis. Start with a reference or category."),
      ];
      notes = ["CK-020: non-specific lead handled with value.", "CK-021: <=2 qualifier questions.", "CK-015: EDUCATE_AND_NURTURE via 'when you're ready to scale' + 'start with'."];
      break;
    }
    case "GD-023": {
      title = "Branded AirPods reseller";
      profileBand = "branded/IP restricted";
      goal = "Decline branded product, offer alternative.";
      expectedEndpoint = "EXIT_POLITE";
      steps = [
        msg(1, "stage1", "user", "Can you get original Apple AirPods at wholesale? I want 50 units for resale."),
        msg(2, "stage1", "assistant", "Can't source branded Apple products — IP restrictions apply. For similar TWS earbuds (custom-branded, your logo), we can source at $4-8/unit at 200+. Want to explore that alternative?"),
        msg(3, "stage1", "user", "No, I specifically need real AirPods."),
        msg(4, "stage1", "assistant", "Understood — we cannot source branded Apple products. If you need product sourcing for custom TWS or other items, we're here to help."),
      ];
      notes = ["CK-007: branded/IP declined + alternative offered ('similar TWS').", "CK-018: no fabricated guarantee.", "CK-020: scope explained.", "CK-015: EXIT_POLITE via 'can't source branded'."];
      break;
    }
    case "GD-024": {
      title = "Student candle hobby quantities";
      profileBand = "budget-challenged hobby";
      goal = "Honest MOQ economics, polite exit with door.";
      expectedEndpoint = "EXIT_POLITE";
      steps = [
        msg(1, "stage1", "user", "I'm a student making candles. Can I start with 10-30 wicks, 25 molds, and some jars?"),
        msg(2, "stage1", "assistant", "Factory MOQ is 200+ — shipping at 10-30 units costs more than the product. Buying from a local craft supplier is better. How many units could you scale to?"),
        msg(3, "stage1", "user", "What if I want 50?"),
        msg(4, "stage1", "assistant", "Still below MOQ — $5-8/piece at 50 vs $0.30 at scale. We must decline. Share your quantity when you reach 200+."),
      ];
      notes = ["CK-008: honest budget math ($5-8/piece sub-MOQ).", "CK-020: non-viable volume redirect.", "CK-015: EXIT_POLITE via 'buying from a local craft supplier' + 'decline'."];
      break;
    }
    case "GD-025": {
      title = "Hostile spam abuse";
      profileBand = "hostile";
      goal = "Professional safe exit on hostile input.";
      expectedEndpoint = "EXIT_POLITE";
      steps = [
        msg(1, "stage1", "user", "This is stupid. Give me free PUBG top-up codes idiot."),
        msg(2, "stage1", "assistant", "This chat handles sourcing only — factory pricing, MOQ, and material options. If you need product sourcing, share product and quantity."),
      ];
      notes = ["CK-020: 'sourcing only'.", "CK-024: professional response, no matching hostility.", "CK-015: EXIT_POLITE."];
      break;
    }
    case "GD-026": {
      title = "ICP lead asks for call";
      profileBand = "high-intent ICP";
      goal = "Call handoff for high-intent lead.";
      expectedEndpoint = "HUMAN_HANDOFF";
      steps = [
        msg(1, "stage1", "user", "We need bulk packaging for our skincare line — 5000+ units. Can we schedule a Zoom call tomorrow? Our website is oaken-lab.co and my email is hello@oaken-lab.co."),
        msg(2, "stage1", "assistant", "Skincare packaging at 5000+ runs $0.10-$0.60/unit DDP depending on material. I'll connect you with our sourcing team for a Zoom call tomorrow — we'll reach out to hello@oaken-lab.co with the meeting link."),
        msg(3, "stage1", "user", "Great. We're just starting but have a clear product line and quantities ready."),
        msg(4, "stage1", "assistant", "No problem — we help brands at every stage. Our team will schedule the call and come prepared with factory options for your skincare packaging."),
      ];
      notes = ["CK-010: call/zoom handoff provided.", "CK-023: early-stage founder NOT rejected.", "CK-015: HUMAN_HANDOFF via 'connect you' + 'schedule'."];
      break;
    }
    case "GD-027": {
      title = "Scope-jumping lead";
      profileBand = "responsive but scattered";
      goal = "Anchor scope and sequence decisions clearly.";
      expectedEndpoint = "QUALIFY_AND_ADVANCE";
      steps = [
        msg(1, "stage1", "user", "Can you price bottle + liquid + label + doorstep all at once? I need handwash product, packaging, and shipping to Karachi."),
        msg(2, "stage1", "assistant", "Handwash 500ml runs $0.40-$0.80/unit DDP at MOQ 1000. Let's focus on the product first. Tell me your quantity and budget target."),
        msg(3, "stage1", "user", "Maybe 1000-3000 units. Also what about the packaging? And logistics?"),
        msg(4, "stage1", "assistant", "At 1000 units, raw material cost is ~$0.25 USD — factory DDP $0.40-$0.80/unit. Packaging $0.05-$0.20. Let's lock product specs first. Upload a reference or tell me your formula."),
      ];
      notes = ["CK-005: value delivered directly.", "CK-008: honest budget math ('raw material cost' + 'usd').", "CK-022: scope jump anchored ('let's focus', 'first').", "CK-015: QUALIFY_AND_ADVANCE (no nurture keywords)."];
      break;
    }
    default:
      return null;
  }

  return {
    transcript_id: trId,
    case_id: id,
    title,
    profile_band: profileBand,
    goal,
    expected_endpoint: expectedEndpoint,
    steps,
    notes,
    golden_type: "web"
  };
}

const transcripts = [];
for (const c of cases.cases) {
  const tr = generateTranscript(c);
  if (tr) transcripts.push(tr);
  else console.warn(`No transcript generator for ${c.case_id}`);
}

const output = {
  dataset_name: "golden-eugene-v1-transcripts",
  version: "0.2.0",
  owner: "Analysis draft",
  purpose: "Exemplar transcripts for team calibration before eval runs",
  transcripts
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(`Generated ${transcripts.length} transcripts -> ${OUTPUT_FILE}`);
