#!/usr/bin/env bash
# Post or update the single conflict-button comment for PR_NUMBER.
# Reads PR_URL, HEAD_OWNER, HEAD_BRANCH from the environment.
set -euo pipefail

: "${PR_NUMBER:?}"
: "${PR_URL:?}"
: "${HEAD_OWNER:?}"
: "${HEAD_BRANCH:?}"
: "${GITHUB_REPOSITORY:?}"

MARKER="<!-- ai-conflict-buttons -->"
workdir="${RUNNER_TEMP:-/tmp}"
body_file="${workdir}/pr-${PR_NUMBER}-body.md"
out_file="${workdir}/pr-${PR_NUMBER}-comment.md"

mergeable_state=""
for _ in 1 2 3 4 5 6; do
  mergeable_state="$(gh api "repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}" --jq '.mergeable_state // "unknown"')"
  if [[ "$mergeable_state" != "unknown" && "$mergeable_state" != "null" ]]; then
    break
  fi
  sleep 5
done

gh api "repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}" --jq '.body // ""' > "$body_file"

if [[ "$mergeable_state" == "dirty" ]]; then
  export CONFLICTING=true
else
  export CONFLICTING=false
fi
export PR_BODY_FILE="$body_file"
export OUT_FILE="$out_file"
node scripts/ai-conflict-buttons.mjs

comment_id="$(gh api "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" --paginate \
  --jq ".[] | select(.body | contains(\"${MARKER}\")) | .id" | head -n 1)"

if [[ -z "$comment_id" ]]; then
  if [[ "$CONFLICTING" != "true" ]]; then
    echo "PR #${PR_NUMBER} is not conflicting and has no conflict comment."
    exit 0
  fi
  gh api --method POST "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
    -f body="$(cat "$out_file")" > /dev/null
  echo "Posted conflict comment on PR #${PR_NUMBER}."
  exit 0
fi

gh api --method PATCH "repos/${GITHUB_REPOSITORY}/issues/comments/${comment_id}" \
  -f body="$(cat "$out_file")" > /dev/null
echo "Updated conflict comment ${comment_id} on PR #${PR_NUMBER} (${mergeable_state})."
