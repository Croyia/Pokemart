#!/bin/bash
# usage: fetch_watchdog.sh query.txt out.json   -> exit 0 ok, 2 gave up
Q=$1; OUT=$2; LOG=${OUT%.json}.status.log
HOSTS=(https://overpass.kumi.systems https://overpass-api.de)
: > "$LOG"
for attempt in $(seq 1 8); do
  H=${HOSTS[$(( (attempt-1) % ${#HOSTS[@]} ))]}
  echo "$(date +%T) attempt $attempt via $H" >> "$LOG"
  if curl -sS -m 100 -A "commute-sample/1.0" --data-urlencode data@"$Q" "$H/api/interpreter" -o "$OUT.tmp" 2>>"$LOG" \
     && python3 -c "import json,sys;d=json.load(open('$OUT.tmp'));assert d.get('elements') is not None" 2>>"$LOG"; then
    mv "$OUT.tmp" "$OUT"; echo "$(date +%T) OK $(stat -c%s "$OUT") bytes" >> "$LOG"; echo "WATCHDOG OK: $OUT"; exit 0
  fi
  echo "$(date +%T) FAILED attempt $attempt; backoff $((attempt*10))s" >> "$LOG"
  sleep $((attempt*10))
done
echo "WATCHDOG GAVE UP after 8 attempts; see $LOG"; tail -5 "$LOG"; exit 2
