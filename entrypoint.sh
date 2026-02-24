#!/bin/sh
set -e

# Use fixed container paths (volumes are mounted here by docker-compose).
# Do NOT use OPENCLAW_CONFIG_DIR/OPENCLAW_WORKSPACE_DIR here - those are
# host paths for Docker's volume binding and don't exist inside the container.
CONFIG_DIR="/home/node/.openclaw"
WORKSPACE="/home/node/.openclaw/workspace"
mkdir -p "$CONFIG_DIR/agents/main/agent" "$CONFIG_DIR/agents/main/sessions" "$CONFIG_DIR/credentials" "$WORKSPACE"

# Copy bundled workspace files if workspace is empty or missing SOUL.md
if [ ! -f "$WORKSPACE/SOUL.md" ]; then
  cp -r /home/node/.openclaw/workspace/* "$WORKSPACE/" 2>/dev/null || true
fi

# Enable Telegram only when TELEGRAM_BOT_TOKEN is set (Railway/production)
TELEGRAM_ENABLED="${TELEGRAM_BOT_TOKEN:+true}"
TELEGRAM_ENABLED="${TELEGRAM_ENABLED:-false}"

# Write openclaw.json
# - gateway.auth.token: required when bind=lan; CLI/gateway use OPENCLAW_GATEWAY_TOKEN
# - gateway.remote: so CLI in Docker can reach the gateway container
# - channels.telegram: enabled only when TELEGRAM_BOT_TOKEN is set
cat > "$CONFIG_DIR/openclaw.json" << TOMEOF
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-opus-4-6"
      },
      "maxConcurrent": 4
    }
  },
  "commands": { "native": "auto" },
  "channels": {
    "telegram": {
      "enabled": $TELEGRAM_ENABLED,
      "dmPolicy": "open",
      "allowFrom": ["*"],
      "groupPolicy": "disabled",
      "streamMode": "partial"
    }
  },
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "$OPENCLAW_GATEWAY_TOKEN"
    },
    "controlUi": {
      "allowInsecureAuth": true
    },
    "remote": {
      "url": "ws://openclaw-gateway:18789",
      "token": "$OPENCLAW_GATEWAY_TOKEN"
    }
  },
  "plugins": {
    "entries": {
      "telegram": { "enabled": $TELEGRAM_ENABLED }
    }
  }
}
TOMEOF

# Write Anthropic auth from env var
if [ -n "$ANTHROPIC_API_KEY" ]; then
  cat > "$CONFIG_DIR/agents/main/agent/auth-profiles.json" << AUTHEOF
{
  "version": 1,
  "profiles": {
    "anthropic": {
      "provider": "anthropic",
      "type": "api_key",
      "key": "$ANTHROPIC_API_KEY"
    }
  },
  "lastGood": { "anthropic": "anthropic" }
}
AUTHEOF
fi

chmod 700 "$CONFIG_DIR"
chmod 600 "$CONFIG_DIR/openclaw.json"

exec node dist/index.js gateway --bind lan --port "${PORT:-8080}"
