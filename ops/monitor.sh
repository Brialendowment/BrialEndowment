#!/usr/bin/env bash
# Site monitor for brialendowment.org — run hourly by .github/workflows/monitor.yml.
#
# Checks what a visitor actually depends on: the website, the www redirect, the
# Supabase database (the same public RPC the homepage calls), Supabase Auth and
# the mail Edge Function. Once a day it also checks the domain's expiry date and
# that the monitor stays enabled.
#
# Emails the founder (via Resend) only when something changes: when the site goes
# down, every 6 hours while it stays down, and once when it recovers. State is
# kept in $STATE_DIR, which the workflow carries between runs with actions/cache.
#
# Logs are public (public repository): print status codes only, never bodies.

set -uo pipefail

SITE="https://brialendowment.org"
WWW="https://www.brialendowment.org"
SB="https://sdlrjqdbxxzddgivnjws.supabase.co"
ALERT_TO="${ALERT_TO:-brialbisnis@gmail.com}"
ALERT_FROM="Brial Endowment Monitor <desk@brialendowment.org>"
STATE_DIR="${STATE_DIR:-.monitor-state}"
STATE="$STATE_DIR/state"
REPO="${GITHUB_REPOSITORY:-Brialendowment/BrialEndowment}"
REMIND_EVERY=$((6 * 3600))

# The public (anon) key is already shipped in the website, so read it from there.
ANON=$(grep -o 'SUPABASE_ANON_KEY = "[^"]*"' site/supabase-client.js | cut -d'"' -f2)

now=$(date -u +%s)
today=$(date -u +%F)
STATUS=ok; SINCE=$now; LAST_ALERT=0; LAST_DAILY=""
mkdir -p "$STATE_DIR"
# shellcheck disable=SC1090
[ -f "$STATE" ] && . "$STATE"

failures=()
warnings=()

# try NAME CMD... — runs CMD up to 3 times, 15 s apart; records NAME on failure.
try() {
  local name=$1; shift
  for attempt in 1 2 3; do
    if out=$("$@" 2>&1); then echo "ok    $name ($out)"; return 0; fi
    [ $attempt -lt 3 ] && sleep 15
  done
  echo "FAIL  $name ($out)"
  failures+=("$name — $out")
}

check_home() {
  local code body
  body=$(mktemp)
  code=$(curl -sS -m 20 -o "$body" -w '%{http_code}' "$SITE/") || { echo "no response"; return 1; }
  [ "$code" = 200 ] || { echo "HTTP $code"; return 1; }
  grep -q "Brial Endowment" "$body" || { echo "HTTP 200 but page content missing"; return 1; }
  echo "HTTP 200"
}

check_www() {
  local hdr code loc
  hdr=$(curl -sS -m 20 -o /dev/null -D - "$WWW/" | tr -d '\r') || { echo "no response"; return 1; }
  code=$(printf '%s' "$hdr" | awk 'toupper($1) ~ /^HTTP/ {c=$2} END {print c}')
  loc=$(printf '%s' "$hdr" | awk 'tolower($1)=="location:" {print $2}')
  case "$code" in 301|302|307|308) ;; *) echo "HTTP $code (expected redirect)"; return 1;; esac
  case "$loc" in "$SITE"*) echo "HTTP $code → $loc";; *) echo "redirects to '$loc'"; return 1;; esac
}

check_db() {
  local code
  code=$(curl -sS -m 25 -o /dev/null -w '%{http_code}' -X POST "$SB/rest/v1/rpc/be_public_snapshot" \
    -H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H "Content-Type: application/json" -d '{}') \
    || { echo "no response"; return 1; }
  [ "$code" = 200 ] || { echo "HTTP $code"; return 1; }
  echo "HTTP 200"
}

check_auth() {
  local code
  code=$(curl -sS -m 20 -o /dev/null -w '%{http_code}' "$SB/auth/v1/health" -H "apikey: $ANON") \
    || { echo "no response"; return 1; }
  [ "$code" = 200 ] || { echo "HTTP $code"; return 1; }
  echo "HTTP 200"
}

check_mailfn() {
  local code
  code=$(curl -sS -m 25 -o /dev/null -w '%{http_code}' -X OPTIONS "$SB/functions/v1/be-mail" \
    -H "Origin: $SITE" -H "Access-Control-Request-Method: POST") || { echo "no response"; return 1; }
  [ "$code" = 200 ] || { echo "HTTP $code"; return 1; }
  echo "HTTP 200"
}

send_mail() { # subject, text
  if [ -z "${RESEND_API_KEY:-}" ]; then
    echo "::error::RESEND_API_KEY secret is not set — cannot email the alert"; return 1
  fi
  local payload code
  payload=$(jq -n --arg from "$ALERT_FROM" --arg to "$ALERT_TO" --arg s "$1" --arg t "$2" \
    '{from:$from, to:[$to], subject:$s, text:$t}')
  code=$(curl -sS -m 30 -o /dev/null -w '%{http_code}' -X POST https://api.resend.com/emails \
    -H "Authorization: Bearer $RESEND_API_KEY" -H "Content-Type: application/json" -d "$payload")
  echo "alert email: HTTP $code"
  [ "$code" = 200 ]
}

echo "== Checks $(date -u '+%F %T') UTC"
try "Website (brialendowment.org)" check_home
try "www → main site redirect" check_www
try "Database (homepage data)" check_db
try "Sign-in service (Supabase Auth)" check_auth
try "Email function (be-mail)" check_mailfn

# ---- Once a day: domain expiry, recent backup, keep scheduled workflows enabled
if [ "$LAST_DAILY" != "$today" ]; then
  echo "== Daily checks"
  exp=$(curl -sSL -m 30 https://rdap.org/domain/brialendowment.org 2>/dev/null \
        | jq -r '.events[]? | select(.eventAction=="expiration") | .eventDate' 2>/dev/null | head -1)
  if [ -n "$exp" ]; then
    days=$(( ( $(date -u -d "$exp" +%s) - now ) / 86400 ))
    echo "domain expires $exp ($days days)"
    [ "$days" -lt 30 ] && warnings+=("The domain brialendowment.org expires in $days days ($exp). Renew it at the registrar, or the website and all @brialendowment.org email will stop.")
  else
    echo "domain expiry: could not read (not treated as an outage)"
  fi

  # Public repositories switch scheduled workflows off after 60 days without
  # commits. Re-enabling the monitor daily keeps it running. (Backups run from
  # the private brialendowment-backups repository, which has no such limit and
  # emails on its own failures.)
  if [ -n "${GH_TOKEN:-}" ]; then
    gh api -X PUT "repos/$REPO/actions/workflows/monitor.yml/enable" >/dev/null 2>&1 \
      && echo "keep-alive: monitor.yml enabled" || echo "keep-alive: monitor.yml (skipped)"
  fi
  LAST_DAILY=$today
fi

# ---- Decide whether to email
rc=0
if [ ${#failures[@]} -gt 0 ]; then
  list=$(printf -- '- %s\n' "${failures[@]}")
  if [ "$STATUS" = ok ]; then
    SINCE=$now
    send_mail "⚠️ brialendowment.org: something is down" \
"The hourly check found a problem (each check was retried 3 times):

$list

Started: $(date -u -d @"$SINCE" '+%F %H:%M') UTC
You will get a reminder every 6 hours while it lasts, and one email when it is fixed.

Details: https://github.com/$REPO/actions/workflows/monitor.yml" && LAST_ALERT=$now || rc=1
  elif [ $((now - LAST_ALERT)) -ge $REMIND_EVERY ]; then
    send_mail "⚠️ Still down: brialendowment.org" \
"Still failing since $(date -u -d @"$SINCE" '+%F %H:%M') UTC:

$list

Details: https://github.com/$REPO/actions/workflows/monitor.yml" && LAST_ALERT=$now || rc=1
  fi
  STATUS=down
else
  if [ "$STATUS" = down ]; then
    mins=$(( (now - SINCE) / 60 ))
    send_mail "✅ Recovered: brialendowment.org is back" \
"All checks pass again. The problem lasted about $mins minutes." || rc=1
  fi
  STATUS=ok; SINCE=$now
fi

if [ ${#warnings[@]} -gt 0 ]; then
  send_mail "Brial Endowment: needs attention" "$(printf -- '- %s\n\n' "${warnings[@]}")" || rc=1
fi

printf 'STATUS=%s\nSINCE=%s\nLAST_ALERT=%s\nLAST_DAILY=%s\n' "$STATUS" "$SINCE" "$LAST_ALERT" "$LAST_DAILY" > "$STATE"
echo "== Status: $STATUS"
# Fail the run only if an alert could not be sent, so GitHub's own failure
# notice becomes the fallback.
exit $rc
