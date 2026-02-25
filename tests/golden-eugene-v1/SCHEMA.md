# Case Schema (Golden Eugene V1)

Each case in `cases.seed.json` follows this structure:

```json
{
  "case_id": "GD-001",
  "title": "Short human-readable title",
  "persona_type": "non_sourcing_or_spam | sourcing_moq_price_first | sourcing_with_alibaba_link | sourcing_with_image_reference | sourcing_text_only",
  "motivation": "start_business | expand_business | find_cheaper | unclear_or_non_buyer",
  "product_mode": "existing_no_custom | light_customization | custom_mold | net_new_invention",
  "input_mode": "text | link | image | mixed",
  "spec_clarity": "clear | partial | unclear",
  "risk_class": "normal | restricted | ip_branded | out_of_scope",
  "intent_level": "low | medium | high",
  "channel": "web | WA",
  "behavior_bucket": "B1 | B2 | B3 | B4 | B5 | B6",
  "bucket_pattern": "e.g. B2A, B2B, B2C",
  "sourceability_status": "sourceable | nurture | blocked | irrelevant",
  "expected_endpoint": "EXIT_POLITE | EDUCATE_AND_NURTURE | QUALIFY_AND_ADVANCE | HUMAN_HANDOFF | COMPLETE_SR",
  "acceptable_endpoints": ["optional; array of valid outcomes; if present, pass = actual in this list and not in must_not_reach"],
  "must_not_reach": ["optional; endpoints that indicate failure"],
  "optimal_endpoint": "optional; best outcome for bonus scoring only",
  "expected_dropoff_point": "nullable string; where we expect disengagement if non-converting",
  "expected_stage_path": [
    "splash_to_stage1",
    "stage1_ask_reference_image",
    "stage1_product_intelligence",
    "stage2_aha_sequence",
    "stage3_refine_feasibility",
    "stage4_contact_finalize"
  ],
  "expected_tool_sequence": [
    "productIntelligence",
    "pricingIntelligence",
    "visualConceptGeneration",
    "feasibilityAssessment"
  ],
  "required_fields_for_sr": [
    "product",
    "quantity_or_budget",
    "destination",
    "contact_email_or_call_slot"
  ],
  "persona_profile": {
    "what_they_want": "...",
    "what_they_know": "...",
    "what_they_dont_know": "...",
    "communication_style": "...",
    "trust_questions": ["..."],
    "dropoff_triggers": ["..."]
  },
  "hidden_truth": {
    "quantity": "...",
    "budget": "...",
    "destination": "...",
    "timeline": "...",
    "flexibility": "...",
    "notes": "..."
  },
  "allowed_disclosures_by_turn": [
    "T1: ...",
    "T2: ...",
    "T3+: ..."
  ],
  "must_pass_checks": ["CK-..."],
  "must_fail_checks": ["CK-..."],
  "review_status": "draft | reviewed | locked",
  "owner": "Eugene",
  "review_notes": "...",
  "sources": ["context/Good/...", "context/Bad/..."]
}
```

## Notes

- `persona_type` is a scenario/input class, not a rigid script.
- `allowed_disclosures_by_turn` is mandatory to prevent evaluator improvisation.
- `channel` (optional): `"web"` or `"WA"`. When `"WA"`, CK-012 and CK-013 (card/concise-web) are not applied; D1 handles message length for WhatsApp.
- `acceptable_endpoints` (optional): array of endpoint strings. When set, pass = actual endpoint is in this array and not in `must_not_reach`. Backward compat: if absent, pass = actual === `expected_endpoint`.
- `must_not_reach` (optional): array of endpoint strings that indicate failure (e.g. COMPLETE_SR for impossible-price cases).
- `optimal_endpoint` (optional): single endpoint for bonus/display; does not affect pass/fail.
- `expected_stage_path` and `expected_tool_sequence` are required for Unified Activation flow correctness, not only chat quality.
- `behavior_bucket` maps each case to the team's behavior taxonomy:
  - `B1` Budget / Quantity Challenge — lead has a product but budget or MOQ is unrealistic
  - `B2` Vague / No Specs — lead has not specified a product; bot should draw out specs
  - `B3` Qualified / Defined Product — lead has real product, specs, and/or budget; drive toward SR
  - `B4` Restricted / Impossible Product — product is restricted, not sourceable, or non-physical
  - `B5` Branded / IP Products — lead asking for a branded product; clarify sourcing limitations
  - `B6` Ghost / Non-responsive — lead stopped responding; follow up once, then exit
