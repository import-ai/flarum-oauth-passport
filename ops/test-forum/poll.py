#!/usr/bin/env python3
"""Deploy the newest eligible GitHub Actions result to the test forum."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

PLUGIN = sys.argv[1] if len(sys.argv) > 1 else "flarum-oauth-passport"
if PLUGIN not in {"flarum-oauth-passport", "flarum-webhook", "flarum-webhook-notification"}:
    raise SystemExit(f"Unsupported test plugin: {PLUGIN}")
REPO = f"import-ai/{PLUGIN}"
API = f"https://api.github.com/repos/{REPO}"


def github(path):
    token = os.environ.get("FLARUM_GITHUB_TOKEN")
    request = urllib.request.Request(API + path)
    if token:
        request.add_header("Authorization", "Bearer " + token)
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.load(response)


def eligible(run, after, get=github):
    if run["run_number"] <= after or run["conclusion"] != "success":
        return False
    if (run.get("head_repository") or {}).get("full_name") != REPO:
        return False
    sha = run["head_sha"]
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        return False
    if run["event"] == "push":
        return run["head_branch"] == "main" and get("/commits/main")["sha"] == sha
    if run["event"] != "pull_request":
        return False
    head = urllib.parse.quote("import-ai:" + run["head_branch"], safe="")
    return any(
        pr["state"] == "open"
        and pr["base"]["ref"] == "main"
        and (pr["head"]["repo"] or {}).get("full_name") == REPO
        and pr["head"]["sha"] == sha
        for pr in get(f"/pulls?state=open&base=main&head={head}")
    )


def main():
    if os.uname().nodename.split(".", 1)[0] != "cy-cpu-3":
        raise SystemExit("This deployment only runs on cy-cpu-3")
    root = Path(__file__).resolve().parent
    marker = root / ("last-run" if PLUGIN == "flarum-oauth-passport" else f"last-run-{PLUGIN}")
    after = int(marker.read_text()) if marker.exists() else 0
    try:
        result = github("/actions/workflows/test-forum.yml/runs?status=success&per_page=25")
    except urllib.error.HTTPError as error:
        if error.code == 404:
            print("Waiting for test-forum.yml on the default branch.")
            return
        raise
    for run in sorted(result["workflow_runs"], key=lambda item: item["run_number"], reverse=True):
        if eligible(run, after):
            print(f"Deploying {run['head_sha']} from {run['html_url']}", flush=True)
            subprocess.run([root / "deploy.sh", run["head_sha"], PLUGIN], check=True)
            temporary = marker.with_suffix(".tmp")
            temporary.write_text(str(run["run_number"]) + "\n")
            temporary.replace(marker)
            return


if __name__ == "__main__":
    main()
