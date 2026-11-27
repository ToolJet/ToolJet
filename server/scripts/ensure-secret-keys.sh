#!/bin/bash
# Sourced by the all-in-one images (preview, try) after Postgres is running:
#   source ensure-secret-keys.sh <postgres-data-dir>
# Exports SECRET_KEY_BASE and LOCKBOX_MASTER_KEY so the server never runs with a published example value.
# Generated keys are kept in <postgres-data-dir>/tooljet-keys.env, on the data volume, so they survive restarts.
# A value passed with -e/--env-file that is not an example value always wins and is never written to the file.
# Must never fail: the calling entrypoints run with `set -e`.

ensure_secret_keys() {
  local data_dir="$1"
  local key_file="$data_dir/tooljet-keys.env"
  local legacy_lockbox="replace_with_lockbox_master_key"
  local saved_secret="" saved_lockbox=""

  is_sample() {
    case "$1" in
      "" | replace_with_secret_key_base | "$legacy_lockbox" | 0000000000000000000000000000000000000000000000000000000000000000 | 0123456789ABCDEF) return 0 ;;
      *) return 1 ;;
    esac
  }

  # Never `source` the file: that would overwrite values the user passed in.
  if [ -f "$key_file" ]; then
    saved_secret=$(sed -n 's/^SECRET_KEY_BASE=//p' "$key_file" 2>/dev/null | head -n 1 || true)
    saved_lockbox=$(sed -n 's/^LOCKBOX_MASTER_KEY=//p' "$key_file" 2>/dev/null | head -n 1 || true)
  fi

  if is_sample "$SECRET_KEY_BASE"; then
    if [ -n "$saved_secret" ]; then
      SECRET_KEY_BASE="$saved_secret"
    else
      SECRET_KEY_BASE=$(random_hex 64)
      saved_secret="$SECRET_KEY_BASE"
      echo "Generated a new SECRET_KEY_BASE (stored in $key_file)."
    fi
  fi

  if is_sample "$LOCKBOX_MASTER_KEY"; then
    if [ -n "$saved_lockbox" ]; then
      LOCKBOX_MASTER_KEY="$saved_lockbox"
    elif has_no_tooljet_data; then
      LOCKBOX_MASTER_KEY=$(random_hex 32)
      saved_lockbox="$LOCKBOX_MASTER_KEY"
      echo "Generated a new LOCKBOX_MASTER_KEY (stored in $key_file)."
    else
      # Existing data is encrypted with the old example key; another key would make it unreadable.
      LOCKBOX_MASTER_KEY="$legacy_lockbox"
      saved_lockbox="$legacy_lockbox"
      echo "WARNING: LOCKBOX_MASTER_KEY is a published example value and existing data is encrypted with it."
      echo "WARNING: Rotate it: in /app/server run LOCKBOX_MASTER_KEY=<64 hex chars> npm run rotate:keys:prod,"
      echo "WARNING: enter '$legacy_lockbox' as the old key, then put the new key in $key_file and restart."
    fi
  fi

  if [ -n "$saved_secret$saved_lockbox" ] && [ -d "$data_dir" ]; then
    local content=""
    if [ -n "$saved_secret" ]; then content+="SECRET_KEY_BASE=$saved_secret"$'\n'; fi
    if [ -n "$saved_lockbox" ]; then content+="LOCKBOX_MASTER_KEY=$saved_lockbox"$'\n'; fi
    # Explicit && chain: `set -e` does not apply inside a condition.
    if (umask 077 && printf '%s' "$content" > "$key_file.tmp" && mv "$key_file.tmp" "$key_file"); then
      chown postgres:postgres "$key_file" 2>/dev/null || true
    else
      echo "WARNING: could not write $key_file; new keys will be generated on the next start."
    fi
  fi

  export SECRET_KEY_BASE LOCKBOX_MASTER_KEY
}

# <bytes> random bytes as hex. Coreutils only: not every image ships the openssl CLI.
random_hex() {
  head -c "$1" /dev/urandom | od -An -v -tx1 | tr -d ' \n'
}

# True only when Postgres positively reports that ToolJet has never set up its database.
# Any error counts as "has data", so a failed check never replaces the key of a populated database.
has_no_tooljet_data() {
  local db="${PG_DB:-}" result
  [[ "$db" =~ ^[A-Za-z0-9_]+$ ]] || return 1
  # The probe can only see the Postgres in this container.
  case "${PG_HOST:-localhost}" in localhost | 127.0.0.1) ;; *) return 1 ;; esac

  result=$(su postgres -s /bin/bash -c "psql -d postgres -tAc \"SELECT count(*) FROM pg_database WHERE datname = '$db'\"" 2>/dev/null || true)
  [ "$result" = "0" ] && return 0
  [ "$result" = "1" ] || return 1

  result=$(su postgres -s /bin/bash -c "psql -d '$db' -tAc \"SELECT to_regclass('public.users') IS NULL\"" 2>/dev/null || true)
  [ "$result" = "t" ]
}

ensure_secret_keys "$1"
