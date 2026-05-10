#!/usr/bin/env python3
"""Fetch a GitHub issue via REST API (no gh CLI needed)."""
import urllib.request
import json
import sys

issue_num = sys.argv[1]
token = sys.argv[2]

url = f"https://api.github.com/repos/YrFnS/dark-factory-app/issues/{issue_num}"
req = urllib.request.Request(url, headers={
    "Authorization": f"token {token}",
    "Accept": "application/vnd.github+json",
    "User-Agent": "archon-workflow"
})

with urllib.request.urlopen(req) as r:
    d = json.load(r)

result = {
    "title": d.get("title", ""),
    "body": d.get("body", ""),
    "labels": [l["name"] for l in d.get("labels", [])],
    "state": d.get("state", ""),
    "url": d.get("html_url", ""),
    "author": d.get("user", {}).get("login", ""),
}
print(json.dumps(result, indent=2))
