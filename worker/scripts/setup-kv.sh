#!/usr/bin/env bash
# Run this once to create the KV namespace and patch wrangler.toml automatically.
set -e

echo "Creating JRCORP_KV namespace..."
OUTPUT=$(npx wrangler kv:namespace create JRCORP_KV 2>&1)
echo "$OUTPUT"

ID=$(echo "$OUTPUT" | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)

echo ""
echo "Creating JRCORP_KV preview namespace..."
PREV_OUTPUT=$(npx wrangler kv:namespace create JRCORP_KV --preview 2>&1)
echo "$PREV_OUTPUT"

PREV_ID=$(echo "$PREV_OUTPUT" | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)

if [[ -n "$ID" && -n "$PREV_ID" ]]; then
  sed -i.bak \
    -e "s/REPLACE_WITH_KV_ID/$ID/" \
    -e "s/REPLACE_WITH_KV_PREVIEW_ID/$PREV_ID/" \
    wrangler.toml
  echo ""
  echo "✅ wrangler.toml updated with KV IDs."
  echo "   id         = $ID"
  echo "   preview_id = $PREV_ID"
else
  echo "⚠️  Could not extract IDs automatically. Update wrangler.toml manually."
fi
