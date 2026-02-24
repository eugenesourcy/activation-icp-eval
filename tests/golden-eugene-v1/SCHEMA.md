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
  "behavior_bucket": "B1 | B2 | B3 | B4 | B5 | B6",
  "bucket_pattern": "e.g. B2A, B2B, B2C",
  "sourceability_status": "sourceable | nurture | blocked | irrelevant",
  "expected_endpoint": "EXIT_POLITE | EDUCATE_AND_NURTURE | QUALIFY_AND_ADVANCE | HUMAN_HANDOFF | COMPLETE_SR",
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
- `expected_stage_path` and `expected_tool_sequence` are required for Unified Activation flow correctness, not only chat quality.
- `behavior_bucket` maps each case to the team's behavior taxonomy:
  - `B1` Low-intent drop immediately
  - `B2` Intent but not quality (cannot complete sourceable requirements)
  - `B3` High-intent cooperative
  - `B4` Quality + high-intent ICP
  - `B5` Mismatch but responsive
  - `B6` Irrelevant / spam / hostile
