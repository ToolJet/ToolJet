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

  1. Prunes orphans. `.meta/appMeta.json`, `.meta/moduleMeta.json` and
     `.meta/dataSourceMeta.json` are the last authoritative record of which
     resources really exist on the branch; everything else under apps/,
     modules/ and data-sources/ is leftover from partial deletes/renames and
     would be resurrected by the meta-free reader (which trusts the tree).
     Anything not reachable from meta is removed.

  2. Normalizes resource names that contain a path separator. `/` is no longer
     allowed in app / module / data source names (it is the on-disk separator),
     but older repos have names like "Sales/Ops" that were serialized as nested
     directories the meta-free reader cannot see. Every `/` in a name (and in a
     dashboard folder name) becomes `-`, directories are moved to the flattened
     path and app.json's `name` is rewritten to match.

  3. Strips the transitional `updatedAt` field from every apps/**/app/app.json and
     modules/**/app/app.json if present. Change detection now uses git's own tree
     SHAs (computed at pull time), so no per-resource token lives in the files.

  4. Restructures data sources:
        data-sources/<co_relation_id>.json
     ->
        data-sources/<name>/data-source.json
     where <name> is the datasource's `name` field with `/` replaced by `-`.
     Content is rewritten in the server's canonical form (recursively sorted
     keys) so the first real push produces no spurious diff. ERRORS OUT if two
     datasources resolve to the same folder name (duplicate names would collide).

  5. Deletes the .meta/ directory (appMeta.json, moduleMeta.json,
     dataSourceMeta.json) — no longer read or written.

Steps 1 and 2 are skipped for a resource family whose meta file is absent (an
already-migrated repo): without meta there is no way to tell an orphan from a
live resource, so nothing is deleted.

Use --dry-run to preview without touching the working tree. Each step plans in
full (and aborts on collisions) before writing anything, but a step that aborts
leaves earlier steps' writes on disk — `git checkout .` to start over.
"""

import argparse
import json
import os
import shutil
import sys


class MigrationError(Exception):
    pass


META_DIR = ".meta"
META_FILE_FOR = {"apps": "appMeta.json", "modules": "moduleMeta.json"}
DS_META_FILE = "dataSourceMeta.json"
DS_DIR = "data-sources"
DS_FILE = "data-source.json"

# Subdirectories the serializer writes for a single app/module. Used to strip an
# orphan's own files when a live resource sits underneath it (a name like "a/b"
# nests one resource inside another's directory).
APP_SUBDIRS = (
    "app",
    "components",
    "pages",
    "events",
    "queries",
    "versions",
    "schema",
    "tooljet_database",
    "definitions",
    "modules",
)


def log(msg: str) -> None:
    print(msg, flush=True)


def canonical_json(obj) -> str:
    """Byte-compatible with the server's canonicalStringify: recursively sorted
    keys, 2-space indent, arrays left in order, non-ASCII preserved."""
    return json.dumps(obj, indent=2, sort_keys=True, ensure_ascii=False)


def load_json(path: str):
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def write_app_json(path: str, data) -> None:
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(json.dumps(data, indent=2, ensure_ascii=False))
        fh.write("\n")


# ── repo-relative path helpers ───────────────────────────────────────────────
#
# Meta stores repo-relative POSIX paths ("apps/folder/name"); everything below
# compares paths in that form and converts to absolute only to touch the disk.


def to_rel(repo: str, abs_path: str) -> str:
    return os.path.relpath(abs_path, repo).replace(os.sep, "/")


def to_abs(repo: str, rel: str) -> str:
    return os.path.join(repo, *rel.split("/"))


def sanitize(value: str) -> str:
    """Resource name → directory-safe name. `/` is the on-disk separator."""
    return value.replace("/", "-").replace("\\", "-")


def has_separator(value: str) -> bool:
    return "/" in value or "\\" in value


def prune_empty_dirs(repo: str, start_rel: str, stop_rel: str) -> None:
    """Remove now-empty directories from start_rel upward, never past stop_rel."""
    current = start_rel
    while current and current != stop_rel and current.startswith(stop_rel + "/"):
        abs_dir = to_abs(repo, current)
        if not os.path.isdir(abs_dir) or os.listdir(abs_dir):
            return
        os.rmdir(abs_dir)
        current = current.rsplit("/", 1)[0]


# ── meta reading ─────────────────────────────────────────────────────────────


def read_meta(repo: str, file_name: str):
    """Parsed meta file, or None when the file is absent (already migrated)."""
    meta_path = os.path.join(repo, META_DIR, file_name)
    if not os.path.isfile(meta_path):
        return None
    try:
        data = load_json(meta_path)
    except (json.JSONDecodeError, OSError) as exc:
        raise MigrationError(f"could not parse {META_DIR}/{file_name}: {exc}")
    return data if isinstance(data, dict) else {}


# ── app / module resource resolution ─────────────────────────────────────────


class Resource:
    """One app or module in the repo. `path` is repo-relative and mutates as the
    resource is moved; `co_relation_id` is its durable identity."""

    def __init__(self, co_relation_id: str, path: str):
        self.co_relation_id = co_relation_id
        self.path = path


def discover_resource_dirs(repo: str, resource_folder: str) -> list:
    """Every directory under <resource_folder>/ holding an app/app.json, at any
    depth — names that contained `/` nest deeper than the two-level layout."""
    base = os.path.join(repo, resource_folder)
    if not os.path.isdir(base):
        return []
    found = []
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames[:] = [d for d in dirnames if not d.startswith(".")]
        if os.path.basename(dirpath) == "app" and "app.json" in filenames:
            found.append(to_rel(repo, os.path.dirname(dirpath)))
    return sorted(found)


def read_app_json(repo: str, resource_path: str):
    try:
        data = load_json(os.path.join(to_abs(repo, resource_path), "app", "app.json"))
    except (json.JSONDecodeError, OSError):
        return None
    return data if isinstance(data, dict) else None


def resolve_resources(repo: str, resource_folder: str, meta) -> list:
    """The live resources of one family: meta entries that still exist on disk
    when meta is present, otherwise whatever the tree holds."""
    on_disk = set(discover_resource_dirs(repo, resource_folder))

    if meta is None:
        resources = []
        for path in sorted(on_disk):
            app_json = read_app_json(repo, path)
            resources.append(Resource((app_json or {}).get("id") or path, path))
        return resources

    resources = []
    claimed = {}  # path -> co_relation_id, for duplicate meta entries
    for co_relation_id, entry in sorted(meta.items()):
        if not isinstance(entry, dict):
            continue  # e.g. the `lastUpdatedAt` scalar
        raw_path = entry.get("appPath")
        if not isinstance(raw_path, str) or not raw_path:
            continue
        path = raw_path.replace("\\", "/").strip("/")
        if path not in on_disk:
            log(f"  ! {co_relation_id}: meta points at missing {path} — dropping entry")
            continue
        if path in claimed:
            log(f"  ! {co_relation_id}: meta path {path} already claimed by {claimed[path]} — skipping")
            continue
        claimed[path] = co_relation_id
        resources.append(Resource(co_relation_id, path))
    return resources


# ── 1. prune orphans ─────────────────────────────────────────────────────────


def is_reachable(rel: str, valid_paths: set) -> bool:
    """True when rel is a live resource, sits inside one, or is on the way to one."""
    if rel in valid_paths:
        return True
    prefix = rel + "/"
    return any(v.startswith(prefix) or rel.startswith(v + "/") for v in valid_paths)


def prune_resource_folder(repo: str, resource_folder: str, valid_paths: set, dry_run: bool) -> int:
    """Delete every directory under <resource_folder>/ that no live resource needs.

    Directories that only exist as ancestors of a live resource are kept, but
    their own leftover content (an orphan app's `app/`, `pages/`, … next to a
    nested live one) is not reachable and gets removed by the same rule."""
    base = os.path.join(repo, resource_folder)
    if not os.path.isdir(base):
        return 0

    removed = 0
    for dirpath, dirnames, filenames in os.walk(base, topdown=True):
        dirnames[:] = [d for d in dirnames if not d.startswith(".")]
        rel = to_rel(repo, dirpath)
        if rel == resource_folder:
            continue
        if is_reachable(rel, valid_paths):
            stray = [f for f in filenames if not f.startswith(".")]
            if stray and not any(rel == v or rel.startswith(v + "/") for v in valid_paths):
                log(f"  ? {rel}/: {len(stray)} loose file(s) not part of any resource — left in place")
            continue
        log(f"  - orphan {rel}/")
        if not dry_run:
            shutil.rmtree(to_abs(repo, rel))
        dirnames[:] = []
        removed += 1
    return removed


def collect_ds_files(repo: str) -> list:
    """Every datasource file in the repo, both layouts, as (rel_path, content).

    Current layout is `data-sources/<name>/data-source.json`; legacy is a flat
    `data-sources/<co_relation_id>.json`. A name that contained `/` nested the
    folder layout deeper, so the walk is depth-agnostic."""
    ds_dir = os.path.join(repo, DS_DIR)
    if not os.path.isdir(ds_dir):
        return []

    out = []
    for name in sorted(os.listdir(ds_dir)):
        if not name.endswith(".json") or name == DS_FILE:
            continue
        if os.path.isfile(os.path.join(ds_dir, name)):
            out.append(to_rel(repo, os.path.join(ds_dir, name)))
    for dirpath, dirnames, filenames in os.walk(ds_dir):
        dirnames[:] = [d for d in dirnames if not d.startswith(".")]
        if DS_FILE in filenames and dirpath != ds_dir:
            out.append(to_rel(repo, os.path.join(dirpath, DS_FILE)))

    entries = []
    for rel in sorted(set(out)):
        try:
            content = load_json(to_abs(repo, rel))
        except (json.JSONDecodeError, OSError) as exc:
            raise MigrationError(f"could not parse {rel}: {exc}")
        if not isinstance(content, dict):
            raise MigrationError(f"{rel}: expected a JSON object")
        entries.append((rel, content))
    return entries


def ds_identity(rel: str, content: dict) -> str:
    """co_relation_id — `content.id` is authoritative; the flat layout's filename
    is the fallback for pre-id files."""
    ds_id = content.get("id")
    if isinstance(ds_id, str) and ds_id:
        return ds_id
    return os.path.basename(rel)[: -len(".json")]


def prune_data_sources(repo: str, entries: list, ds_meta, dry_run: bool) -> tuple:
    """Drop datasources absent from dataSourceMeta.json. Returns (kept, removed)."""
    if ds_meta is None:
        return entries, 0

    valid_ids = {k for k, v in ds_meta.items() if isinstance(v, dict)}
    kept, removed = [], 0
    for rel, content in entries:
        if ds_identity(rel, content) in valid_ids:
            kept.append((rel, content))
            continue
        # Folder layout: the whole <name>/ directory is the datasource.
        target = rel if rel.rsplit("/", 1)[-1] != DS_FILE else rel.rsplit("/", 1)[0]
        log(f"  - orphan {target}")
        if not dry_run:
            abs_target = to_abs(repo, target)
            if os.path.isdir(abs_target):
                shutil.rmtree(abs_target)
            else:
                os.remove(abs_target)
            prune_empty_dirs(repo, target.rsplit("/", 1)[0], DS_DIR)
        removed += 1
    return kept, removed


# ── 2. normalize names containing a path separator ───────────────────────────


def split_folder_and_name(app_name, segments: list) -> tuple:
    """Split a resource's path segments (below apps/ or modules/) into its
    dashboard folder and its name.

    `apps/a/b` is ambiguous on its own — folder "a" + app "b", or a root app
    named "a/b" — so app.json's `name` decides whenever it is available. The
    fallback assumes the documented layout: one folder level, rest is the name."""
    if app_name:
        name_segments = app_name.replace("\\", "/").split("/")
        if 0 < len(name_segments) <= len(segments) and segments[-len(name_segments) :] == name_segments:
            return segments[: -len(name_segments)], name_segments
    if len(segments) <= 1:
        return [], segments
    return segments[:1], segments[1:]


def plan_name_fixes(repo: str, resource_folder: str, resources: list) -> list:
    """(resource, new_path, new_name) for every resource whose path flattens."""
    plans = []
    for resource in resources:
        segments = resource.path.split("/")[1:]
        app_json = read_app_json(repo, resource.path)
        app_name = (app_json or {}).get("name")
        app_name = app_name if isinstance(app_name, str) and app_name else None
        folder_segments, name_segments = split_folder_and_name(app_name, segments)

        if app_name is None and len(segments) > 2:
            log(f"  ! {resource.path}: no name in app.json — assuming folder {folder_segments[0]!r}")

        new_name = sanitize("/".join(name_segments))
        parts = [resource_folder]
        if folder_segments:
            parts.append(sanitize("/".join(folder_segments)))
        parts.append(new_name)
        new_path = "/".join(parts)
        if new_path != resource.path:
            plans.append((resource, new_path, new_name))
    return plans


def assert_no_path_clashes(resources: list, plans: list) -> None:
    """Flattening two different names onto one path (or onto a path nested inside
    another resource) would silently merge apps — refuse instead."""
    moved = {id(r) for r, _, _ in plans}
    final = {}
    clashes = []
    for resource in resources:
        if id(resource) not in moved:
            final.setdefault(resource.path, []).append(resource.path)
    for resource, new_path, _ in plans:
        final.setdefault(new_path, []).append(resource.path)

    for path, sources in sorted(final.items()):
        if len(sources) > 1:
            clashes.append(f"  - {path}: from {', '.join(sorted(sources))}")
            continue
        parts = path.split("/")
        for depth in range(1, len(parts)):
            ancestor = "/".join(parts[:depth])
            if ancestor in final:
                clashes.append(f"  - {path} would sit inside resource {ancestor}")
                break

    if clashes:
        raise MigrationError(
            "flattening `/` in resource names would collide on disk. Rename one "
            "side in the source workspace and re-push before migrating:\n" + "\n".join(clashes)
        )


def apply_name_fixes(repo: str, resource_folder: str, plans: list, dry_run: bool) -> int:
    for resource, new_path, new_name in plans:
        src, dst = to_abs(repo, resource.path), to_abs(repo, new_path)
        log(f"  ~ {resource.path} -> {new_path}")
        if not dry_run:
            if os.path.exists(dst):
                raise MigrationError(f"{new_path} already exists — cannot move {resource.path} onto it")
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.move(src, dst)
            prune_empty_dirs(repo, resource.path.rsplit("/", 1)[0], resource_folder)

            app_json_path = os.path.join(dst, "app", "app.json")
            app_json = read_app_json(repo, new_path)
            if app_json is not None and isinstance(app_json.get("name"), str) and has_separator(app_json["name"]):
                app_json["name"] = new_name
                write_app_json(app_json_path, app_json)
        resource.path = new_path
    return len(plans)


# ── 3. strip app.json updatedAt ──────────────────────────────────────────────


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
            write_app_json(app_json_path, data)
        changed += 1
    return changed


# ── 4. data-sources restructure ──────────────────────────────────────────────


def resolve_ds_name(rel: str, content: dict) -> str:
    """The datasource's name. `content.name` is authoritative; a folder-layout
    file without one falls back to its directory address."""
    name = content.get("name")
    if isinstance(name, str) and name:
        return name
    if rel.rsplit("/", 1)[-1] == DS_FILE:
        return rel.rsplit("/", 1)[0][len(DS_DIR) + 1 :]
    raise MigrationError(f"{rel}: datasource has no `name`, cannot place it in a folder")


def migrate_data_sources(repo: str, entries: list, dry_run: bool) -> int:
    """Move every datasource to data-sources/<sanitized name>/data-source.json and
    rewrite it canonically. Idempotent: an already-correct file is only rewritten."""
    if not entries:
        return 0

    # First pass: resolve target folder per datasource and detect name collisions.
    planned = []  # (rel_src, target_folder, content)
    folder_owner = {}  # folder name -> (co_relation_id, rel_src)
    collisions = []
    for rel, content in entries:
        name = resolve_ds_name(rel, content)
        folder = sanitize(name)
        co_relation_id = ds_identity(rel, content)

        previous = folder_owner.get(folder)
        if previous is not None:
            collisions.append((folder, previous[0], co_relation_id, previous[1], rel))
        else:
            folder_owner[folder] = (co_relation_id, rel)
        planned.append((rel, folder, content))

    if collisions:
        lines = [
            f"  - folder {folder!r}: co_relation_id {a} ({fa}) vs {b} ({fb})"
            for (folder, a, b, fa, fb) in collisions
        ]
        raise MigrationError(
            "duplicate datasource names would collide in the folder-per-datasource "
            "layout. Rename one side in the source workspace and re-push before "
            "migrating:\n" + "\n".join(lines)
        )

    # Second pass: move + canonicalize. The name inside the file has to follow the
    # folder — pull reads the datasource's name from `content.name`, not the path.
    changed = 0
    for rel, folder, content in planned:
        target_rel = f"{DS_DIR}/{folder}/{DS_FILE}"
        if content.get("name") != folder:
            content["name"] = folder
        if target_rel == rel:
            with open(to_abs(repo, rel), "r", encoding="utf-8") as fh:
                if fh.read() == canonical_json(content) + "\n":
                    continue  # already migrated
            log(f"  ~ {rel} (rewrite)")
        else:
            log(f"  ~ {rel} -> {target_rel}")

        if not dry_run:
            target_abs = to_abs(repo, target_rel)
            os.makedirs(os.path.dirname(target_abs), exist_ok=True)
            with open(target_abs, "w", encoding="utf-8") as fh:
                fh.write(canonical_json(content))
                fh.write("\n")
            if target_rel != rel:
                source_dir = rel.rsplit("/", 1)[0]
                os.remove(to_abs(repo, rel))
                prune_empty_dirs(repo, source_dir, DS_DIR)
        changed += 1
    return changed


# ── 5. delete .meta ──────────────────────────────────────────────────────────


def delete_meta(repo: str, dry_run: bool) -> bool:
    meta_dir = os.path.join(repo, META_DIR)
    if not os.path.isdir(meta_dir):
        return False
    log(f"  - removing {os.path.relpath(meta_dir, repo)}/")
    if not dry_run:
        shutil.rmtree(meta_dir)
    return True


# ── main ─────────────────────────────────────────────────────────────────────


def run(repo: str, dry_run: bool) -> None:
    app_metas = {folder: read_meta(repo, file_name) for folder, file_name in META_FILE_FOR.items()}
    ds_meta = read_meta(repo, DS_META_FILE)

    log("1. prune orphaned resources")
    resources = {folder: resolve_resources(repo, folder, app_metas[folder]) for folder in META_FILE_FOR}
    ds_entries = collect_ds_files(repo)
    pruned = 0
    for folder in META_FILE_FOR:
        if app_metas[folder] is None:
            log(f"   no {META_FILE_FOR[folder]} — skipping {folder}/ (nothing to compare against)")
            continue
        pruned += prune_resource_folder(repo, folder, {r.path for r in resources[folder]}, dry_run)
    if ds_meta is None:
        log(f"   no {DS_META_FILE} — skipping {DS_DIR}/ (nothing to compare against)")
    else:
        ds_entries, ds_pruned = prune_data_sources(repo, ds_entries, ds_meta, dry_run)
        pruned += ds_pruned
    log(f"   {pruned} orphan(s) removed\n")

    log("2. normalize names containing '/'")
    renamed = 0
    for folder in META_FILE_FOR:
        plans = plan_name_fixes(repo, folder, resources[folder])
        assert_no_path_clashes(resources[folder], plans)
        renamed += apply_name_fixes(repo, folder, plans, dry_run)
    log(f"   {renamed} app/module director{'y' if renamed == 1 else 'ies'} flattened\n")

    log("3. strip app.json updatedAt")
    app_changes = migrate_app_jsons(repo, dry_run)
    log(f"   {app_changes} app.json file(s) updated\n")

    log("4. data-sources restructure")
    ds_changes = migrate_data_sources(repo, ds_entries, dry_run)
    log(f"   {ds_changes} datasource file(s) moved or rewritten\n")

    log("5. delete .meta")
    removed = delete_meta(repo, dry_run)
    log(f"   {'.meta removed' if removed else 'no .meta directory'}\n")


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
        run(repo, args.dry_run)
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
