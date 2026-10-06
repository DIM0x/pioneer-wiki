#!/usr/bin/env bash
#
# Pioneer Wiki — download a published release and run it with Docker.
#
#   bash deploy.sh                  newest release
#   bash deploy.sh v0.1.0           a specific tag
#   bash deploy.sh --dir /srv/wiki  another install directory
#   bash deploy.sh --no-start       download and load only
#
# Needs docker plus curl or wget. Downloads the image archive, the compose file
# and the `.env.example` template from the GitHub release, loads the image into
# the local daemon and starts the service. The existing `.env` is never
# overwritten, and the archive is removed after loading unless --keep-archive is
# passed.

set -euo pipefail

REPO="${PIONEER_REPO:-NEUP-Net-Depart/pioneer-wiki}"
DIR="${PIONEER_DIR:-/srv/pioneer-wiki}"
TAG=""
START=1
KEEP=0

usage() {
  cat <<'EOF'
usage: deploy.sh [TAG] [--dir PATH] [--no-start] [--keep-archive]

  TAG             release tag to install (default: the newest release)
  --dir PATH      install directory (default: /srv/pioneer-wiki)
  --no-start      download and load the image, but do not start the service
  --keep-archive  keep the downloaded image archive after loading it

Environment overrides:
  PIONEER_REPO    owner/name to fetch the release from
                  (default: NEUP-Net-Depart/pioneer-wiki)
  PIONEER_DIR     same as --dir
EOF
}

die() { printf 'error: %s\n' "$*" >&2; exit 1; }
say() { printf '%s\n' "$*"; }

while [ $# -gt 0 ]; do
  case "$1" in
    --dir) [ $# -ge 2 ] || die "--dir needs a path"; DIR="$2"; shift 2 ;;
    --no-start) START=0; shift ;;
    --keep-archive) KEEP=1; shift ;;
    -h|--help) usage; exit 0 ;;
    -*) die "unknown option: $1" ;;
    *) [ -z "$TAG" ] || die "only one tag can be given"; TAG="$1"; shift ;;
  esac
done

command -v docker >/dev/null 2>&1 || die "docker is not installed"
docker info >/dev/null 2>&1 || die "cannot reach the Docker daemon — run with sudo, or add this user to the docker group"

case "$(uname -m)" in
  x86_64 | amd64) ;;
  *) die "these releases are built for x86_64; this host reports $(uname -m)" ;;
esac

if command -v curl >/dev/null 2>&1; then
  FETCHER=curl
elif command -v wget >/dev/null 2>&1; then
  FETCHER=wget
else
  die "need curl or wget to download the release"
fi

fetch() { # fetch URL DEST
  if [ "$FETCHER" = curl ]; then
    curl -fL --retry 3 --connect-timeout 15 -o "$2" "$1"
  else
    wget -q -O "$2" "$1"
  fi
}

if [ -n "$TAG" ]; then
  BASE="https://github.com/$REPO/releases/download/$TAG"
else
  BASE="https://github.com/$REPO/releases/latest/download"
  # Read the tag out of the redirect so the install can record what it installed.
  if [ "$FETCHER" = curl ]; then
    RESOLVED="$(curl -fsIL -o /dev/null -w '%{url_effective}' "https://github.com/$REPO/releases/latest" 2>/dev/null | sed 's|.*/||' || true)"
    if [ -n "$RESOLVED" ]; then TAG="$RESOLVED"; fi
  fi
fi

mkdir -p "$DIR"
INCOMING="$DIR/.incoming"
rm -rf "$INCOMING"
mkdir -p "$INCOMING"

say "→ downloading ${TAG:-the newest release} from $REPO"

# The one file a human must fill in is handled first, so a fresh install stops
# here instead of pulling a few hundred megabytes before saying so. The template
# is the release's own .env.example, kept beside .env as a reference.
ENV_FILE="$DIR/.env"
if fetch "$BASE/.env.example" "$INCOMING/.env.example"; then
  cp "$INCOMING/.env.example" "$DIR/.env.example"
  TEMPLATE="$DIR/.env.example"
else
  # A release published before the template was attached to it.
  TEMPLATE=""
fi

# .env holds the only values a human must provide, so it is never overwritten.
if [ ! -f "$ENV_FILE" ]; then
  if [ -n "$TEMPLATE" ]; then
    cp "$TEMPLATE" "$ENV_FILE"
  else
    cat > "$ENV_FILE" <<'EOF'
# From the Supabase project settings. The anon key is public by design; the
# service-role key belongs in no file here.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
EOF
  fi
  chmod 600 "$ENV_FILE"
  say ""
  say "Stopped before starting: wrote $ENV_FILE for you to fill in."
  say "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then run"
  say "this script again. The rest of the file is optional."
  say "If the project has no schema yet, apply supabase/migrations (in the"
  say "release's source archive) in the Supabase SQL editor first, with the site"
  say "URL and https://<domain>/auth/callback allowed as redirect targets."
  exit 1
fi

env_value() { sed -n "s/^$1=//p" "$ENV_FILE" | tail -n 1; }
require_real() { # require_real VAR
  local value
  value="$(env_value "$1")"
  [ -n "$value" ] || die "$ENV_FILE has no $1 value yet"
  # Every placeholder in .env.example is written with a `your-` host, so a value
  # that still contains one was copied across without being filled in. Starting
  # with it fails worse than stopping: the container comes up healthy and the
  # site fails against a project that does not exist.
  case "$value" in
    *your-*) die "$ENV_FILE still holds the $1 placeholder from .env.example" ;;
  esac
}
require_real NEXT_PUBLIC_SUPABASE_URL
require_real NEXT_PUBLIC_SUPABASE_ANON_KEY

say "→ downloading the image"
fetch "$BASE/pioneer-wiki-linux-amd64.tar.gz" "$INCOMING/image.tar.gz" ||
  die "could not download the image from $REPO — check the tag and that the release finished building, or set PIONEER_REPO to the repository that publishes the releases"
fetch "$BASE/docker-compose.yml" "$INCOMING/docker-compose.yml" ||
  die "could not download docker-compose.yml"
fetch "$BASE/DEPLOY.txt" "$INCOMING/DEPLOY.txt" || true

# Replace the compose file, keeping the previous copy if it changed.
if [ -f "$DIR/docker-compose.yml" ] && ! cmp -s "$INCOMING/docker-compose.yml" "$DIR/docker-compose.yml"; then
  cp "$DIR/docker-compose.yml" "$DIR/docker-compose.yml.prev"
  say "→ docker-compose.yml changed; the previous file is kept as docker-compose.yml.prev"
fi
cp "$INCOMING/docker-compose.yml" "$DIR/docker-compose.yml"

say "→ loading the image"
LOADED="$(gzip -dc "$INCOMING/image.tar.gz" | docker load 2>&1)" || die "docker load failed"
printf '%s\n' "$LOADED" | sed 's/^/  /'

printf '%s installed %s\n' "${TAG:-unknown}" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$DIR/.pioneer-version"

mv "$INCOMING/DEPLOY.txt" "$DIR/DEPLOY.txt" 2>/dev/null || true
if [ "$KEEP" = 1 ]; then
  mv "$INCOMING/image.tar.gz" "$DIR/pioneer-wiki-linux-amd64.tar.gz"
  say "→ kept the archive at $DIR/pioneer-wiki-linux-amd64.tar.gz"
fi
rm -rf "$INCOMING"

if [ "$START" = 1 ]; then
  say "→ starting the service"
  (cd "$DIR" && docker compose up -d)
  (cd "$DIR" && docker compose ps)
else
  say "→ --no-start given; start it later with: cd $DIR && docker compose up -d"
fi

say ""
say "Caddy still needs this once (then reload it):"
say "    ${PIONEER_DOMAIN:-wiki.example.com} {"
say "        encode zstd gzip"
say "        reverse_proxy 127.0.0.1:3000"
say "    }"
say ""
say "Updating: run this script again. Rolling back: every release stays on disk as"
say "pioneer-wiki:<tag> — put PIONEER_IMAGE=pioneer-wiki:<tag> in $DIR/.env and run"
say "docker compose up -d there."
