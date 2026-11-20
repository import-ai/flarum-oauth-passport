#!/usr/bin/env bash
set -euo pipefail

sha=${1:?Expected a commit SHA}
[[ $sha =~ ^[0-9a-f]{40}$ && $(hostname -s) == cy-cpu-3 ]]
root=$(cd "$(dirname "$0")" && pwd)
cd /root/.local/docker/flarum
exec 9>"$root/deploy.lock"
flock -x 9

plugin=${2:-flarum-oauth-passport}
case "$plugin" in
  flarum-oauth-passport) image_repo=flarum-oauth-test ;;
  flarum-webhook|flarum-webhook-notification) image_repo="$plugin-test" ;;
  *) echo "Unsupported test plugin: $plugin" >&2; exit 1 ;;
esac
package="import-ai/$plugin"

test "$(docker exec flarum php -r '$c = require "/opt/flarum/config.php"; echo $c["url"]," ",$c["database"]["database"];')" = 'https://test.omnibox.pro/community flarum_test'
test -f compose.override.yaml
scratch=$(mktemp -d)
trap 'rm -rf -- "$scratch"' EXIT
cp compose.override.yaml "$scratch/previous.yaml"
previous=$(docker inspect flarum --format '{{.Config.Image}}')
case "$previous" in
  flarum-local-pr5:04615ec|flarum-local-pr5:rollback|flarum-oauth-test:*|flarum-forum-test:*|flarum-webhook-test:*|flarum-webhook-notification-test:*) ;;
  *) echo "Unexpected test forum image: $previous" >&2; exit 1 ;;
esac

mkdir "$scratch/source"
curl -fsSL --retry 2 --max-time 60 "https://codeload.github.com/import-ai/$plugin/tar.gz/$sha" |
  tar -xz --no-same-owner -C "$scratch/source" --strip-components=1
cp "$root/Dockerfile" "$root/prepare.php" "$root/check-lock.php" "$scratch/"
(
  cd "$scratch/source"
  for dir in src migrations js/dist less locale; do
    if [[ -d $dir ]]; then find "$dir" -type f -print0; fi
  done |
    sort -z |
    xargs -0 sha256sum
  sha256sum extend.php composer.json
) > "$scratch/source.sha256"

# Build on the running forum so the other installed plugins stay pinned.
parent_id=$(docker image inspect "$previous" --format '{{.Id}}')
image="$image_repo:$sha.${parent_id:7:12}"
docker build --build-arg "FORUM_BASE=$previous" --build-arg "PACKAGE=$package" --build-arg "REVISION=$sha" -t "$image" "$scratch"
expected=$(docker image inspect "$image" --format '{{.Id}}')
test "$(docker image inspect "$image" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')" = "$sha"

mkdir "$scratch/previous-migrations"
if docker exec flarum test -d "/opt/flarum/vendor/$package/migrations"; then
  docker cp "flarum:/opt/flarum/vendor/$package/migrations/." "$scratch/previous-migrations"
fi
mkdir -p "$scratch/source/migrations"
if ! diff -qr "$scratch/previous-migrations" "$scratch/source/migrations"; then
  echo "Saving the test database before applying extension migrations."
  docker exec flarum sh -eu -c 'test "$DB_NAME" = flarum_test; export MYSQL_PWD="$DB_PASSWORD"; exec mariadb-dump --single-transaction --quick --skip-lock-tables -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" "$DB_NAME"' |
    gzip > "$scratch/flarum_test.sql.gz"
  gzip -t "$scratch/flarum_test.sql.gz"
  install -m 600 "$scratch/flarum_test.sql.gz" "$root/flarum_test-${sha}-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
fi

recreate() {
  docker compose up -d --no-deps --no-build --pull never --force-recreate --wait --wait-timeout 110 flarum
}

printf 'services:\n  flarum:\n    image: %s\n    build: !reset null\n    pull_policy: never\n' "$image" > "$scratch/candidate.yaml"
docker compose -f compose.yaml -f "$scratch/candidate.yaml" config -q

restore() {
  status=$?
  if (( status == 0 )); then return; fi
  echo 'Deployment verification failed. Restoring the previous Compose override.' >&2
  install -m 600 "$scratch/previous.yaml" compose.override.yaml
  recreate || echo 'Previous image did not recover. Check test forum logs and any migration backup.' >&2
  exit "$status"
}
trap restore ERR
install -m 600 "$scratch/candidate.yaml" compose.override.yaml
old_id=$(docker inspect flarum --format '{{.Id}}')
recreate
test "$(docker inspect flarum --format '{{.Id}}')" != "$old_id"
test "$(docker inspect flarum --format '{{.Image}}')" = "$expected"
installed=$(docker exec flarum php -r 'require "/opt/flarum/vendor/autoload.php"; echo Composer\InstalledVersions::getPrettyVersion($argv[1]);' "$package")
test "$installed" = "dev-ci-$sha"
docker exec -i -w "/opt/flarum/vendor/$package" flarum sha256sum -c - < "$scratch/source.sha256" > "$scratch/verified"
curl -fsS --retry 3 --max-time 10 -H 'Host: test.omnibox.pro' http://127.0.0.1:8889/community/api |
  python3 -c 'import json,sys; assert json.load(sys.stdin)["data"]["attributes"]["baseUrl"] == "https://test.omnibox.pro/community"'
trap - ERR
echo "Verified $installed after recreating the test forum ($(wc -l < "$scratch/verified") source files)."
