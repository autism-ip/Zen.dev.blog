#!/bin/bash
cd /tmp
echo "=== COMPONENTS LIST ==="
gh api repos/Penn-Lam/Penn.dev.blog/contents/src/components --jq '.[].name'
echo ""
echo "=== sunny-mode.js ==="
gh api repos/Penn-Lam/Penn.dev.blog/contents/src/components/sunny-mode.js --jq '.content' | base64 -d
echo ""
echo "=== penflow-signature.js ==="
gh api repos/Penn-Lam/Penn.dev.blog/contents/src/components/penflow-signature.js --jq '.content' | base64 -d
echo ""
echo "=== friends/page.js ==="
gh api repos/Penn-Lam/Penn.dev.blog/contents/src/app/friends/page.js --jq '.content' | base64 -d
echo ""
echo "=== friend-card.js ==="
gh api repos/Penn-Lam/Penn.dev.blog/contents/src/components/friend-card.js --jq '.content' | base64 -d
