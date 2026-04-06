#!/usr/bin/env bash
# SEO content presence tests
# Verifies that visually-hidden text still exists in source files for SEO indexing.
PASS=0; FAIL=0

check() {
  local desc="$1"; local cmd="$2"
  if eval "$cmd" > /dev/null 2>&1; then
    echo "  PASS: $desc"; PASS=$((PASS+1))
  else
    echo "  FAIL: $desc"; FAIL=$((FAIL+1))
  fi
}

echo "=== SEO content presence tests ==="
check '"Jak mogę pomóc?" present in index.markdown for SEO' \
  "grep -q 'Jak mog' docs/index.markdown"
check 'Site title "Jak mogę pomóc?" present in _config.yml for SEO' \
  "grep -q 'Jak mog' docs/_config.yml"

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
