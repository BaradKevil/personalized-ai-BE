#!/usr/bin/env bash
# =============================================
#  Novi Backend — API Smoke Test
# =============================================
# Exercises the full API surface end-to-end:
# auth, profile, agent, settings, chat, memory,
# tasks, goals, notifications, activity logs,
# daily briefing, and cross-user ownership.
#
# Usage:
#   Start the server first:
#     cd backend && PORT=3000 npm run dev
#   Then run:
#     bash scripts/smoke-test.sh [base_url]
#
# Exits non-zero on the first failure.
# =============================================

set -u

BASE="${1:-http://localhost:3001/api}"
PASS=0
FAIL=0

say()  { printf '\n== %s ==\n' "$*"; }
ok()   { PASS=$((PASS + 1)); printf '  ✓ %s\n' "$*"; }
fail() { FAIL=$((FAIL + 1)); printf '  ✗ %s\n' "$*"; }
check() { # check <description> <expected_code> <actual_code>
  if [ "$2" = "$3" ]; then ok "$1"; else fail "$1 (expected $2, got $3)"; fi
}

EMAIL="smoke.$(date +%s)@novi.app"

# -------------------------------------------------
#  Auth
# -------------------------------------------------
say "AUTH"
REG=$(curl -s -m 10 -X POST "$BASE/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Smoke Tester\",\"mobile\":\"+91 90000 $(date +%H%M%S)\",\"email\":\"$EMAIL\",\"password\":\"Password123\",\"timezone\":\"Asia/Kolkata\"}")
TOKEN=$(echo "$REG" | python -c "import json,sys; print(json.load(sys.stdin)['data']['tokens']['access_token'])" 2>/dev/null)
REFRESH=$(echo "$REG" | python -c "import json,sys; print(json.load(sys.stdin)['data']['tokens']['refresh_token'])" 2>/dev/null)
[ -n "$TOKEN" ] && ok "register returns tokens" || fail "register failed: $REG"
check "duplicate register -> 409" 409 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X POST "$BASE/auth/register" -H 'Content-Type: application/json' -d "{\"name\":\"Duplicate Tester\",\"email\":\"$EMAIL\",\"password\":\"Password123\"}")"
check "login by email -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d "{\"identifier\":\"$EMAIL\",\"password\":\"Password123\"}")"
check "login bad password -> 401" 401 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d "{\"identifier\":\"$EMAIL\",\"password\":\"wrong\"}")"
check "protected route no token -> 401" 401 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "$BASE/users/profile")"
check "refresh token -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X POST "$BASE/auth/refresh-token" -H 'Content-Type: application/json' -d "{\"refresh_token\":\"$REFRESH\"}")"

H="Authorization: Bearer $TOKEN"
CT="Content-Type: application/json"

# -------------------------------------------------
#  Profile / Agent / Settings
# -------------------------------------------------
say "PROFILE · AGENT · SETTINGS"
check "GET profile -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "$BASE/users/profile" -H "$H")"
check "PUT profile -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X PUT "$BASE/users/profile" -H "$CT" -H "$H" -d '{"avatarColor":"#336699"}')"
check "GET agent -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "$BASE/agent" -H "$H")"
check "PUT agent -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X PUT "$BASE/agent" -H "$CT" -H "$H" -d '{"name":"Novi"}')"
check "GET settings -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "$BASE/settings" -H "$H")"
check "PUT settings -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X PUT "$BASE/settings" -H "$CT" -H "$H" -d '{"dailyBriefing":true}')"

# -------------------------------------------------
#  Chat
# -------------------------------------------------
say "CHAT"
CONV=$(curl -s -m 10 -X POST "$BASE/chat/conversations" -H "$CT" -H "$H" -d '{"title":"Smoke"}')
CID=$(echo "$CONV" | python -c "import json,sys; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
[ -n "$CID" ] && ok "create conversation" || fail "create conversation: $CONV"
# AI reply: 200 when GROQ_API_KEY is set; 503 (honest "not configured") without one
CODE="$(curl -s -m 20 -o /dev/null -w '%{http_code}' -X POST "$BASE/chat/conversations/$CID/messages" -H "$CT" -H "$H" -d '{"content":"Hello Novi"}')"
if [ "$CODE" = "200" ] || [ "$CODE" = "503" ]; then
  ok "send message -> 200/503 (AI key-dependent)"
else
  fail "send message -> $CODE (expected 200 or 503)"
fi
check "list messages -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "$BASE/chat/conversations/$CID/messages" -H "$H")"

# -------------------------------------------------
#  Memory
# -------------------------------------------------
say "MEMORY"
MEM=$(curl -s -m 10 -X POST "$BASE/memory" -H "$CT" -H "$H" -d '{"category":"Preferences","content":"Prefers morning workouts"}')
MID=$(echo "$MEM" | python -c "import json,sys; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
[ -n "$MID" ] && ok "create memory" || fail "create memory: $MEM"
check "search memory -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "$BASE/memory?search=workouts" -H "$H")"
check "update memory -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X PUT "$BASE/memory/$MID" -H "$CT" -H "$H" -d '{"importance":"high"}')"

# -------------------------------------------------
#  Tasks
# -------------------------------------------------
say "TASKS"
TASK=$(curl -s -m 10 -X POST "$BASE/tasks" -H "$CT" -H "$H" -d '{"title":"Call Rahul","priority":"high","dueDate":"2026-08-18T11:00:00","tags":["work"]}')
TID=$(echo "$TASK" | python -c "import json,sys; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
[ -n "$TID" ] && ok "create task" || fail "create task: $TASK"
check "toggle task -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X POST "$BASE/tasks/$TID/toggle" -H "$H")"
check "update task -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X PUT "$BASE/tasks/$TID" -H "$CT" -H "$H" -d '{"priority":"medium"}')"

# -------------------------------------------------
#  Goals
# -------------------------------------------------
say "GOALS"
GOAL=$(curl -s -m 10 -X POST "$BASE/goals" -H "$CT" -H "$H" -d '{"title":"Launch startup","steps":[{"id":"s1","text":"MVP","done":false},{"id":"s2","text":"Launch","done":false}]}')
GID=$(echo "$GOAL" | python -c "import json,sys; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null)
[ -n "$GID" ] && ok "create goal" || fail "create goal: $GOAL"
check "toggle goal step -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X POST "$BASE/goals/$GID/steps/s1/toggle" -H "$H")"

# -------------------------------------------------
#  Notifications / Activity Logs / Briefing
# -------------------------------------------------
say "NOTIFICATIONS · LOGS · BRIEFING"
check "GET notifications -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "$BASE/notifications" -H "$H")"
check "mark all read -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X POST "$BASE/notifications/read-all" -H "$H")"
check "GET activity logs -> 200" 200 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "$BASE/activity-logs?page=1&limit=5" -H "$H")"
check "GET daily briefing -> 200" 200 "$(curl -s -m 20 -o /dev/null -w '%{http_code}' "$BASE/daily-briefing" -H "$H")"

# -------------------------------------------------
#  Ownership: second user cannot touch first user's data
# -------------------------------------------------
say "OWNERSHIP"
REG2=$(curl -s -m 10 -X POST "$BASE/auth/register" -H "$CT" -d "{\"name\":\"Intruder\",\"email\":\"intruder.$(date +%s)@novi.app\",\"password\":\"Password123\"}")
TOKEN2=$(echo "$REG2" | python -c "import json,sys; print(json.load(sys.stdin)['data']['tokens']['access_token'])" 2>/dev/null)
H2="Authorization: Bearer $TOKEN2"
check "cross-user task -> 404" 404 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X PUT "$BASE/tasks/$TID" -H "$CT" -H "$H2" -d '{"title":"HACKED"}')"
check "cross-user memory -> 404" 404 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X DELETE "$BASE/memory/$MID" -H "$H2")"
check "cross-user goal -> 404" 404 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X DELETE "$BASE/goals/$GID" -H "$H2")"
check "cross-user conversation -> 404" 404 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "$BASE/chat/conversations/$CID/messages" -H "$H2")"

# -------------------------------------------------
#  Validation
# -------------------------------------------------
say "VALIDATION"
check "invalid task ID -> 400" 400 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X PUT "$BASE/tasks/abc" -H "$CT" -H "$H" -d '{"title":"x"}')"
check "empty memory -> 400" 400 "$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X POST "$BASE/memory" -H "$CT" -H "$H" -d '{"content":""}')"

# -------------------------------------------------
#  Cleanup (the user rows we created)
# -------------------------------------------------
curl -s -m 10 -X POST "$BASE/auth/logout" -H "$CT" -H "$H" -d "{\"refresh_token\":\"$REFRESH\"}" > /dev/null 2>&1

echo
echo "=============================="
echo " PASS: $PASS   FAIL: $FAIL"
echo "=============================="
[ "$FAIL" -eq 0 ]
