#!/bin/sh
set -e

CONFIG_DIR="/home/node/.openclaw"
mkdir -p "$CONFIG_DIR/agents/main/agent" "$CONFIG_DIR/agents/main/sessions" "$CONFIG_DIR/credentials"

# Write openclaw.json (Telegram channel config)
cat > "$CONFIG_DIR/openclaw.json" << 'EOF'
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
      "enabled": true,
      "dmPolicy": "open",
      "allowFrom": ["*"],
      "groupPolicy": "disabled",
      "streamMode": "partial"
    }
  },
  "gateway": {
    "mode": "local",
    "bind": "loopback"
  },
  "plugins": {
    "entries": {
      "telegram": { "enabled": true }
    }
  }
}
EOF

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

exec node dist/index.js gateway --bind lan --port "${PORT:-8080}" --allow-unconfigured
