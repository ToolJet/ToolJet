#!/usr/bin/env python3
"""
git-migrate.py — convert a ToolJet git-sync repo from the legacy meta-based
layout to the current meta-free layout.

Run it against a CLONED repo working tree (one branch checked out at a time):

    git clone <repo-url> tj-repo
    cd tj-repo
    git checkout <branch>
    python3 /path/to/scripts/git-migrate.py .
    git add -A && git commit -m "chore: migrate git-sync layout (meta-free)"
    git push

Repeat the checkout → run → commit → push cycle for every branch that has been
synced (each branch stores its own apps/ modules/ data-sources/ + .meta/).

What it does (all idempotent — safe to re-run):

  1. Strips the transitional `updatedAt` field from every apps/**/app/app.json and
     modules/**/app/app.json if present. Change detection now uses git's own tree
     SHAs (computed at pull time), so no per-resource token lives in the files.

  2. Restructures data sources:
        data-sources/<co_relation_id>.json
     ->
        data-sources/<name>/data-source.json
     where <name> is the datasource's `name` field. Content is rewritten in the
     server's canonical form (recursively sorted keys) so the first real push
     produces no spurious diff. ERRORS OUT if two datasources resolve to the
     same folder name (duplicate names would collide).

  3. Deletes the .meta/ directory (appMeta.json, moduleMeta.json,
     dataSourceMeta.json) — no longer read or written.

Use --dry-run to preview without touching the working tree.
"""

import argparse
import json
import os
import shutil
import sys


class MigrationError(Exception):
    pass


def log(msg: str) -> None:
    print(msg, flush=True)


def canonical_json(obj) -> str:
    """Byte-compatible with the server's canonicalStringify: recursively sorted
    keys, 2-space indent, arrays left in order, non-ASCII preserved."""
    return json.dumps(obj, indent=2, sort_keys=True, ensure_ascii=False)


def load_json(path: str):
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


# ── 1. strip app.json updatedAt ──────────────────────────────────────────────


def iter_app_jsons(repo: str):
    """Yield every apps/**/app/app.json and modules/**/app/app.json path."""
    for resource_folder in ("apps", "modules"):
        base = os.path.join(repo, resource_folder)
        if not os.path.isdir(base):
            continue
        for dirpath, _dirnames, filenames in os.walk(base):
            if os.path.basename(dirpath) == "app" and "app.json" in filenames:
                yield os.path.join(dirpath, "app.json")


def migrate_app_jsons(repo: str, dry_run: bool) -> int:
    changed = 0
    for app_json_path in iter_app_jsons(repo):
        try:
            data = load_json(app_json_path)
        except (json.JSONDecodeError, OSError) as exc:
            log(f"  ! skipping unreadable {app_json_path}: {exc}")
            continue
        if not isinstance(data, dict) or "updatedAt" not in data:
            continue  # nothing to strip

        del data["updatedAt"]
        rel = os.path.relpath(app_json_path, repo)
        log(f"  - updatedAt -> {rel}")
        if not dry_run:
            with open(app_json_path, "w", encoding="utf-8") as fh:
                fh.write(json.dumps(data, indent=2, ensure_ascii=False))
                fh.write("\n")
        changed += 1
    return changed


# ── 2. data-sources restructure ──────────────────────────────────────────────


def migrate_data_sources(repo: str, dry_run: bool) -> int:
    ds_dir = os.path.join(repo, "data-sources")
    if not os.path.isdir(ds_dir):
        return 0

    # Legacy layout = flat *.json files directly under data-sources/.
    flat_files = [
        f
        for f in os.listdir(ds_dir)
        if f.endswith(".json") and os.path.isfile(os.path.join(ds_dir, f))
    ]
    if not flat_files:
        return 0  # already restructured (or empty)

    # First pass: resolve target folder per file and detect name collisions.
    planned = []  # (src_path, name, content)
    folder_owner: dict = {}  # folder-name -> (co_relation_id, src file)
    collisions = []
    for fname in sorted(flat_files):
        src_path = os.path.join(ds_dir, fname)
        try:
            content = load_json(src_path)
        except (json.JSONDecodeError, OSError) as exc:
            raise MigrationError(f"could not parse {src_path}: {exc}")

        name = content.get("name")
        co_rel_id = content.get("id") or fname[:-5]  # strip .json
        if not name:
            raise MigrationError(f"{fname}: datasource has no `name`, cannot place it in a folder")
        if "/" in name or "\\" in name:
            raise MigrationError(
                f"{fname}: datasource name {name!r} contains a path separator — rename it before migrating"
            )

        prev = folder_owner.get(name)
        if prev is not None:
            collisions.append((name, prev[0], co_rel_id, prev[1], fname))
        else:
            folder_owner[name] = (co_rel_id, fname)
        planned.append((src_path, name, content))

    if collisions:
        lines = [
            f"  - name {name!r}: co_relation_id {a} ({fa}) vs {b} ({fb})"
            for (name, a, b, fa, fb) in collisions
        ]
        raise MigrationError(
            "duplicate datasource names would collide in the folder-per-datasource "
            "layout. Rename one side in the source workspace and re-push before "
            "migrating:\n" + "\n".join(lines)
        )

    # Second pass: move + canonicalize.
    for src_path, name, content in planned:
        target_dir = os.path.join(ds_dir, name)
        target_file = os.path.join(target_dir, "data-source.json")
        rel_src = os.path.relpath(src_path, repo)
        rel_dst = os.path.relpath(target_file, repo)
        log(f"  ~ {rel_src} -> {rel_dst}")
        if not dry_run:
            os.makedirs(target_dir, exist_ok=True)
            with open(target_file, "w", encoding="utf-8") as fh:
                fh.write(canonical_json(content))
                fh.write("\n")
            os.remove(src_path)
    return len(planned)


# ── 3. delete .meta ──────────────────────────────────────────────────────────


def delete_meta(repo: str, dry_run: bool) -> bool:
    meta_dir = os.path.join(repo, ".meta")
    if not os.path.isdir(meta_dir):
        return False
    log(f"  - removing {os.path.relpath(meta_dir, repo)}/")
    if not dry_run:
        shutil.rmtree(meta_dir)
    return True


# ── main ─────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert a ToolJet git-sync repo to the meta-free layout.")
    parser.add_argument("repo", nargs="?", default=".", help="Path to the cloned repo working tree (default: cwd)")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing")
    args = parser.parse_args()

    repo = os.path.abspath(args.repo)
    if not os.path.isdir(repo):
        log(f"error: {repo} is not a directory")
        return 2
    if not os.path.isdir(os.path.join(repo, ".git")):
        log(f"warning: {repo} has no .git — proceeding, but this should be a cloned repo working tree")

    mode = " (dry-run)" if args.dry_run else ""
    log(f"Migrating git-sync repo: {repo}{mode}\n")

    try:
        log("1. strip app.json updatedAt")
        app_changes = migrate_app_jsons(repo, args.dry_run)
        log(f"   {app_changes} app.json file(s) updated\n")

        log("2. data-sources restructure")
        ds_changes = migrate_data_sources(repo, args.dry_run)
        log(f"   {ds_changes} datasource file(s) moved\n")

        log("3. delete .meta")
        removed = delete_meta(repo, args.dry_run)
        log(f"   {'.meta removed' if removed else 'no .meta directory'}\n")
    except MigrationError as exc:
        log(f"\nMIGRATION ABORTED: {exc}")
        return 1

    log("Done." + (" (dry-run — nothing written)" if args.dry_run else ""))
    if not args.dry_run:
        log("\nNext:")
        log("  git add -A")
        log('  git commit -m "chore: migrate git-sync layout (meta-free)"')
        log("  git push")
        log("\nRepeat per branch: git checkout <branch> && re-run this script.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
