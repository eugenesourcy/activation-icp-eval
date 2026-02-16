# Sourcy Activation Bot

WhatsApp conversational agent that qualifies sourcing leads and collects Sourcing Requests (SRs) through natural conversation.

## Quick Start

### Prerequisites
- Docker Desktop running
- The OpenClaw Docker image built locally as `openclaw:local`

### Run the bot locally

```bash
cd /tmp/sourcy-openclaw
docker compose up -d openclaw-gateway
```

Gateway runs at http://localhost:18789 (WebChat UI) and accepts CLI commands.

### Send a test message

```bash
cd /tmp/sourcy-openclaw
docker compose run --rm openclaw-cli agent \
  --session-id test-1 \
  --message "Hi, I want to source some jewelry"
```

Add `--json` to get structured output. Same `--session-id` across calls maintains conversation state.

### Edit the bot's behavior

The bot's personality and rules live in two files:

- `workspace/SOUL.md` — who the bot is, what it knows, how it sounds
- `workspace/AGENTS.md` — conversation rules, per-turn priority, message discipline

Edit these files, then the running gateway picks up changes on the next message (no restart needed). The files are bind-mounted into the Docker container.

## Architecture

```
workspace/
  SOUL.md              # Identity, knowledge, tone
  AGENTS.md            # Rules, priorities, formatting
  GOLD_STANDARD.md     # What "good" looks like (deliverable doc)
  context/             # Gold standard conversation examples
.openclaw/
  openclaw.json        # OpenClaw config (model, channels, gateway)
  workspace/           # Docker-mounted copy of workspace/ (keep in sync)
  agents/main/sessions/  # Persisted conversation sessions (.jsonl)
```

Model: `anthropic/claude-opus-4-6`, thinking level: `low`.

### Docker Setup

The Docker Compose file is at `/tmp/sourcy-openclaw/docker-compose.yml`. Two services:

- `openclaw-gateway` — always-on server, serves WebChat + handles conversations
- `openclaw-cli` — ephemeral container for sending single messages via CLI

Environment config in `/tmp/sourcy-openclaw/.env`:
- `OPENCLAW_CONFIG_DIR` — path to .openclaw/ or openclaw-config/ on host
- `OPENCLAW_WORKSPACE_DIR` — path to workspace/ on host
- `OPENCLAW_GATEWAY_TOKEN` — auth token for gateway API

**Important:** The gateway and CLI mount DIFFERENT config directories. After editing `workspace/SOUL.md` or `workspace/AGENTS.md`, sync to the gateway mount:

```bash
cp workspace/AGENTS.md .openclaw/workspace/AGENTS.md
cp workspace/SOUL.md .openclaw/workspace/SOUL.md
```

## How the Bot Works

### Per-Turn Priority (v7)

Every turn, the bot picks the single highest-value action:

1. **Deliver a wow** — show category expertise (specific price, material tradeoff)
2. **Qualify** — is this lead viable? (budget math, quantity check)
3. **Advance the SR** — collect specs, confirm details (only after hooked + qualified)

### Hard Rules

- **2-3 lines per message max.** No bullet lists, no numbered steps on WhatsApp.
- **Prices first.** When a lead names a category, give prices before asking refining questions.
- **One question per turn.** Never a wall of questions.
- **Catalog/process = one-liner.** Don't explain, redirect.
- **Restricted products are absolute.** No reversal under pushback (batteries, branded, hazmat).
- **Estimate budgets.** If lead has no target price, estimate for them.
- **Specific exit doors.** When exiting, name the exact price/quantity that would make it viable.

See `workspace/GOLD_STANDARD.md` for the full principles document.

## Testing

### Persona Framework

8 core personas from real WhatsApp chat data + 6 adversarial test-set personas from Reddit research:

**Core 8 (from real chats):**
1. Syed — VCare handwash, Pakistan, unrealistic pricing ($0.09/unit)
2. Anam — zero specs, jewelry/bags/makeup, "no idea"
3. Anthony — AirPods reseller, 50 units, Malaysia
4. Jammaica — pastry packaging, wants Zoom call, Philippines
5. Jesus — sportswear, Mexico, 70K MXN, opening a store
6. Candle Student — hobby quantities, 25 wicks
7. femmoraaa — teenager, Instagram jewelry brand, no budget
8. Battery — restricted product (lead-acid), pushes back

**Test Set 6 (from Reddit):**
1. Ghost — says "Hi" then disappears
2. Alibaba Veteran — "why should I pay your markup?"
3. Burned Buyer — "I got scammed before"
4. Price Shopper — messaging 3 platforms simultaneously
5. Researcher — not buying this month, gathering data
6. Ad-Click Confused — "do you sell products?"

Persona profiles: `tests/run-v4-fullsr/personas.md` (core) and `tests/run-v4-fullsr/personas_testset.md` (test set).

### Assessment Rubric

Each bot turn scored on 5 dimensions (0-2 each, max 10/turn):

- **D1 Length** — 2=1-3 lines, 1=4-5, 0=6+
- **D2 Value** — 2=specific expertise, 1=generic useful, 0=none
- **D3 Qualify** — 2=got signal, 1=asked Q, 0=no attempt
- **D4 Discipline** — 2=one Q + natural WHY, 1=minor violation, 0=multiple Qs
- **D5 Last Msg Test** — 2=hooked or qualified, 1=partial, 0=wasted

Pass threshold: avg >= 7.0/10 per conversation.

Full rubric: `tests/ASSESSMENT_RUBRIC.md`.

### Running a Test

```bash
# 1. Start gateway (if not running)
cd /tmp/sourcy-openclaw && docker compose up -d openclaw-gateway

# 2. Sync workspace files
cp workspace/AGENTS.md .openclaw/workspace/AGENTS.md
cp workspace/SOUL.md .openclaw/workspace/SOUL.md

# 3. Run a persona conversation (one message at a time, same session-id)
cd /tmp/sourcy-openclaw
docker compose run --rm openclaw-cli agent \
  --session-id v7-syed \
  --message "Hi, I need price, moq, delivery time for 500ml handwash. Target 25-30 PKR."

# 4. Session files persist at:
#    openclaw-config/agents/main/sessions/v7-syed.jsonl

# 5. Copy results to test run folder
cp openclaw-config/agents/main/sessions/v7-*.jsonl tests/run-v7/results/

# 6. Write assessment using rubric, save to tests/run-v7/assessments/
```

### Test Results (v7 — Current)

8/8 PASS. Average 8.8/10.

| Persona | Turns | Score | Key Result |
|---------|-------|-------|------------|
| Anam | 5 | 7.8 | Prices-first fixed dead turns |
| femmoraaa | 3 | 9.0 | No process dump, clean budget Q |
| Jesus | 3 | 8.0 | Catalog one-liner, prices for all categories |
| Syed | 2 | 8.5 | Honest math, specific exit door |
| Battery | 2 | 8.5 | Held firm under pushback |
| Anthony | 2 | 9.0 | Branded restriction + alternative |
| Jammaica | 1 | 10.0 | Call handoff + value in parallel |
| Candle | 2 | 8.5 | Respectful exit, specific re-entry door |

### Version History

| Version | Date | Personas | Pass | Avg Lines | Key Change |
|---------|------|----------|------|-----------|------------|
| v1 | Feb 12 | 6 | 67% | 12-18 | Baseline |
| v2 | Feb 12 | 8 | 88% | 10-15 | Call handoff, budget math |
| v3 | Feb 12 | 8 | 100% | 8-12 | WHY enforcement, restricted products |
| v3-test | Feb 12 | 6 new | 100% | 8-12 | Generalization confirmed |
| v4 | Feb 12 | 14 | Regressions | 6-10 | Strict persona testing |
| v5 | Feb 12 | 4 fixes | 100% | 6-10 | Absolute restrictions, estimate budgets |
| v6 | Feb 16 | 5 | 60% | 2-5 | Per-turn priority, hard cap (stricter rubric) |
| v7 | Feb 16 | 8 | 100% | 1-4 | Prices-first, one-liner rules |

## Repo Structure

```
workspace/
  SOUL.md               # Bot identity + knowledge
  AGENTS.md             # Conversation rules (current: v7)
  GOLD_STANDARD.md      # Principles document (deliverable)
  IDENTITY.md           # OpenClaw identity config
  USER.md               # User context
  TOOLS.md              # Available tools
  context/              # Gold standard conversation examples
.openclaw/              # Docker-mounted OpenClaw config (gateway)
  openclaw.json         # Model, channels, gateway config
  workspace/            # Bind-mounted workspace (keep synced)
  agents/main/sessions/ # Gateway session files
openclaw-config/        # CLI-specific OpenClaw config
  agents/main/sessions/ # CLI session files (persist after tests)
context/
  Good/                 # Real WA chats — successful leads
  Bad/                  # Real WA chats — failed/lost leads
tests/
  ASSESSMENT_RUBRIC.md  # Scoring framework for all test runs
  run-v1/ through run-v7/
    results/            # Raw .jsonl session files
    assessments/        # Scored per-persona assessments
    personas/           # Persona JSON profiles (v1-v3)
    run_summary_vN.md   # Aggregate scores + analysis
sourcy_wa_bot_prototype_report.html  # Deployed report for stakeholders
```

## Deploying

Report deploys to Vercel: `sourcy-jade.vercel.app`
GitHub repo: `github.com/neicras/sourcy-activation-bot`

For production WhatsApp deployment, enable the WhatsApp plugin in `.openclaw/openclaw.json` and configure the channel credentials.
