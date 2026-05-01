#!/usr/bin/env bash
set -e

WRITE_MODE=false

if [[ "$1" == "--write" ]]; then
  WRITE_MODE=true
fi

TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")

echo ""
echo "Move Firebase utility scripts from js/ to scripts/"
echo ""

PLANNED=(
  "move: js/firebase-migrate.js -> scripts/firebase-migrate.mjs"
  "move: js/firebase-seed.js -> scripts/firebase-seed.mjs"
  "update imports inside moved files"
)

echo "Planned changes:"
for item in "${PLANNED[@]}"; do
  echo "- $item"
done

if [[ "$WRITE_MODE" == false ]]; then
  echo ""
  echo "Dry run only. Apply with:"
  echo ""
  echo "  bash scripts/move-firebase-tools.sh --write"
  echo ""
  exit 0
fi

mkdir -p scripts

backup_if_exists() {
  local file="$1"

  if [[ -f "$file" ]]; then
    cp "$file" "$file.$TIMESTAMP.bak"
  fi
}

move_and_fix_imports() {
  local source_file="$1"
  local target_file="$2"

  if [[ ! -f "$source_file" ]]; then
    echo "skip: $source_file not found"
    return
  fi

  backup_if_exists "$source_file"

  if [[ -f "$target_file" ]]; then
    backup_if_exists "$target_file"
  fi

  mv "$source_file" "$target_file"

  # These scripts moved one folder up from js/ to scripts/,
  # so relative imports into js/ need ../js/
  perl -0pi -e "s/from ['\"]\.\/firebase\.js['\"]/from '..\/js\/firebase.js'/g" "$target_file"
  perl -0pi -e "s/from ['\"]\.\/state\.js['\"]/from '..\/js\/state.js'/g" "$target_file"
  perl -0pi -e "s/from ['\"]\.\/app\//from '..\/js\/app\//g" "$target_file"
  perl -0pi -e "s/from ['\"]\.\/customers\//from '..\/js\/customers\//g" "$target_file"
  perl -0pi -e "s/from ['\"]\.\/products\//from '..\/js\/products\//g" "$target_file"
  perl -0pi -e "s/from ['\"]\.\/orders\//from '..\/js\/orders\//g" "$target_file"
  perl -0pi -e "s/from ['\"]\.\/utils\//from '..\/js\/utils\//g" "$target_file"
}

move_and_fix_imports "js/firebase-migrate.js" "scripts/firebase-migrate.mjs"
move_and_fix_imports "js/firebase-seed.js" "scripts/firebase-seed.mjs"

echo ""
echo "Done."
echo "Backups created with suffix: .$TIMESTAMP.bak"
