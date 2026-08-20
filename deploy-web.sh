#!/usr/bin/env bash
#
# Deploy the Code994 Next.js storefront to this VPS.
#   git pull -> install deps -> build -> restart service -> poll the homepage.
#
# Usage (on the VPS, as root):
#   bash /opt/994Front/deploy-web.sh
#
# The whole body runs inside main(), which bash parses into memory before
# executing — so the mid-run `git pull` can't corrupt the running script even
# if this file itself changed in that same pull.
#
set -euo pipefail

# ---- config (adjust here if paths/names ever change) ----
REPO_DIR="/opt/994Front"
SERVICE="code994-web"
HEALTH_URL="http://localhost:3000"
HEALTH_TIMEOUT=120   # Next.js cold start after a fresh build can take a while

main() {
  cd "$REPO_DIR"

  echo "==> [1/5] git pull"
  git pull --ff-only

  echo "==> [2/5] npm install"
  npm install --no-audit --no-fund

  echo "==> [3/5] npm run build"
  npm run build

  echo "==> [4/5] restart $SERVICE"
  sudo systemctl restart "$SERVICE"

  echo "==> [5/5] waiting for the site (up to ${HEALTH_TIMEOUT}s)"
  for i in $(seq 1 "$HEALTH_TIMEOUT"); do
    code=$(curl -s -o /dev/null -w '%{http_code}' "$HEALTH_URL" || true)
    case "$code" in
      200|301|302|307|308)
        echo ""
        echo "OK — web deploy succeeded (HTTP $code) after ${i}s."
        sudo systemctl is-active "$SERVICE"
        exit 0 ;;
    esac
    sleep 1
  done

  echo ""
  echo "FAILED — site did not respond within ${HEALTH_TIMEOUT}s. Last logs:"
  sudo journalctl -u "$SERVICE" -n 40 --no-pager
  exit 1
}

main "$@"
