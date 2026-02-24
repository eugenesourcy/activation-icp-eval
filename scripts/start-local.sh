#!/usr/bin/env bash
# Start the OpenClaw gateway and print the WebChat URL.
# Usage: ./scripts/start-local.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$REPO_ROOT"

# Load .env if it exists
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Start gateway
docker compose up -d openclaw-gateway

# Wait for gateway to be ready
echo "Waiting for gateway to start..."
sleep 3

# Get chat URL with token (dashboard command connects to gateway and outputs URL)
echo ""
echo "=== WebChat UI ==="
if [ -n "$OPENCLAW_GATEWAY_TOKEN" ]; then
  echo "Open in your browser: http://localhost:18789/?token=$OPENCLAW_GATEWAY_TOKEN"
  echo ""
  echo "Paste the token into Settings if prompted, or use the URL above."
else
  echo "Run 'docker compose run --rm openclaw-cli dashboard --no-open' to get the auth URL."
fi
echo ""
echo "Gateway logs: docker compose logs -f openclaw-gateway"
echo "Stop:         docker compose down"
