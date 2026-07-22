# Auto-Sync Webhook — UI Testing Guide

## Prerequisites

1. ToolJet running locally (server + frontend)
2. A GitHub repo connected via HTTPS git-sync
3. At least 2 branches in the repo (e.g., `main` + `feature-test`)
4. Both branches tracked in ToolJet's branch settings
5. An app created and assigned to the tracked branches
6. ngrok or similar tunnel so GitHub can reach your local instance

---

## Test 1: Enable Auto-Sync & Configure Events

**Steps:**
1. Go to **Workspace Settings → Git Sync**
2. Scroll to the "Auto-Sync" section → Click **Configure**
3. Drawer opens → First time it auto-enables and shows webhook URL + secret
4. **Copy the webhook URL** and **secret** — you'll need these to configure GitHub

**Configure on GitHub:**
1. Go to your GitHub repo → **Settings → Webhooks → Add webhook**
2. Paste the webhook URL from ToolJet
3. Set Content type to `application/json`
4. Paste the secret
5. Select **"Let me select individual events"** → check: Pushes, Pull requests, Branch or tag deletion
6. Save

**Verify:** Back in ToolJet drawer, all 3 events should be checked (Push, Pull Request, Delete)

---

## Test 2: Push Event — Toast in App Builder

**Steps:**
1. Open an app in the **App Builder** (make sure you're on `main` branch)
2. In your local clone of the GitHub repo, make a trivial commit and push to `main`:
   ```
   echo "test" >> test.txt && git add . && git commit -m "test push" && git push
   ```
3. Wait 3-5 seconds

**Expected:**
- Toast appears in the app builder: **"Main branch has been updated from GitHub. Refresh to see changes"**
- Notification appears in the bell icon panel

---

## Test 3: Push Event — No Toast on Dashboard

**Steps:**
1. Navigate to the **Dashboard** (home page with app cards)
2. Push another commit to `main` from your terminal
3. Wait 3-5 seconds

**Expected:**
- **No toast appears**
- But check the notification bell → notification IS there in the panel

---

## Test 4: Deselect an Event → Ignored

**Steps:**
1. Go to **Workspace Settings → Git Sync → Configure** (auto-sync drawer)
2. **Uncheck "Pull Requests"** → Click **Save**
3. Toast: "Webhook settings saved"
4. Now on GitHub, create a PR from any branch to `main` and **merge it**
5. Wait 3-5 seconds

**Expected:**
- **Nothing happens** — no toast, no notification, no sync
- The PR webhook was rejected by ToolJet because you deselected it

**Re-enable:**
1. Back in drawer → Check "Pull Requests" → Save
2. Merge another PR → Now it should trigger sync + notification

---

## Test 5: Branch Deletion — Editor Freeze

**Steps:**
1. Create a branch on GitHub:
   ```
   git checkout -b delete-test && git push -u origin delete-test
   ```
2. In ToolJet, make sure this branch is tracked (create it in branch settings if needed)
3. Open an app in the **App Builder** → **switch to `delete-test` branch**
4. On GitHub (or terminal), delete the branch:
   ```
   git push origin --delete delete-test
   ```
5. Wait 3-5 seconds

**Expected:**
- Toast: **"This branch was deleted on GitHub."** (stays 8 seconds)
- **Editor is FROZEN** — you cannot drag widgets, edit properties, or interact
- A mandatory banner appears indicating the editor is frozen

---

## Test 6: Branch Deletion — Dashboard Refresh

**Steps:**
1. Create another branch:
   ```
   git checkout -b delete-test-2 && git push -u origin delete-test-2
   ```
2. Track it in ToolJet
3. On the **Dashboard**, set `delete-test-2` as your active branch (via branch switcher)
4. Delete it on GitHub:
   ```
   git push origin --delete delete-test-2
   ```
5. Wait 3-5 seconds

**Expected:**
- Toast: **"This branch was deleted on GitHub."**
- Branch dropdown/switcher **refreshes** — `delete-test-2` is gone
- No editor freeze (you're not in the editor)

---

## Test 7: Branch Deletion — Different Branch (No Action)

**Steps:**
1. Be on `main` branch (either app builder or dashboard)
2. Delete some other branch on GitHub:
   ```
   git push origin --delete some-other-branch
   ```
3. Wait 3-5 seconds

**Expected:**
- **No toast, no freeze** (you're not on the deleted branch)
- Notification still appears in the bell icon panel

---

## Test 8: Tag Push — Version Import

**Steps:**
1. Open an app in the **App Builder**
2. From your terminal, push a tag:
   ```
   git tag v1.0.0-test && git push origin v1.0.0-test
   ```
3. Wait 3-5 seconds

**Expected:**
- Toast: **"New version saved from GitHub. Refresh to see changes"**
- Check app versions — new version should appear

---

## Test 9: Self-Trigger Prevention

**Steps:**
1. In the App Builder, make a change to a widget (e.g., move a button)
2. Use ToolJet's built-in push/commit to push changes to GitHub
3. Wait 5 seconds

**Expected:**
- **No toast appears** — ToolJet recognizes its own push and skips it
- Server logs show: `[auto-sync] Skipping self-triggered push on <branch>`
- No duplicate pull/sync occurs

---

## Test 10: Secret Rotation

**Steps:**
1. Open auto-sync drawer → click **Rotate Secret**
2. Confirm in modal
3. Note: GitHub still has the OLD secret configured
4. Push a commit from your terminal

**Expected (within 1 hour):**
- Webhook still works! (old secret accepted during grace period)

**After grace period (or simulate by clearing Redis):**
- GitHub webhook deliveries will fail with 401
- You'd need to update the secret in GitHub webhook settings

---

## Test 11: Disable Auto-Sync

**Steps:**
1. Open auto-sync drawer → click **Delete Webhook** (or disable button)
2. Confirm
3. Push a commit to GitHub

**Expected:**
- GitHub shows webhook delivery **failed** (403 Forbidden)
- No sync, no notification in ToolJet

---

## Test 12: Re-Enable With Fewer Events

**Steps:**
1. Re-open drawer → it auto-enables (new secret generated)
2. **Uncheck "Delete"** → Save
3. **Update the webhook secret on GitHub** (new secret from drawer)
4. Push a commit → should work (accepted)
5. Delete a branch on GitHub → should be **ignored**

**Expected:**
- Push: processed normally, notification appears
- Delete: GitHub shows 202 response but ToolJet returns `{ status: "ignored" }`
- No branch deletion occurs in ToolJet

---

## Test 13: Recent Events Tab (Audit Log)

**Steps:**
1. Open auto-sync drawer → switch to **"Recent Events"** tab
2. Observe the list after running tests above

**Expected:**
- Events listed chronologically (newest first)
- Each shows: event type, status (`processed`, `skipped`, `ignored`, `failed`), timestamp
- Ignored events (from deselected event types) show status `ignored` if they were queued, or don't appear at all (rejected at controller level before recording)

---

## Test 14: Error Notification

**Steps:**
1. Open an app in the **App Builder**
2. Corrupt the sync state (e.g., delete the git repo's `.git` folder, or change the repo URL to something invalid in the DB temporarily)
3. Push a commit from a second clone that still has the correct remote
4. Wait for the worker to fail all retry attempts

**Expected:**
- Error toast in app builder: **"Auto-sync failed for branch ..."**
- On dashboard: no toast, but error notification in panel

---

## Test 14: Validation

**Steps:**
1. Open auto-sync drawer
2. Uncheck ALL 3 event checkboxes

**Expected:**
- Validation error: **"Select at least one event before saving!"**
- Save does not proceed
- Re-check one event → validation clears

---

## Test 15: Discard Changes

**Steps:**
1. Change event selection (don't save)
2. Click X to close drawer

**Expected:**
- Discard confirmation modal appears
- Click "Discard" → drawer closes, changes lost
- Reopen drawer → original saved state restored

---

## Quick Checklist

| # | Test | Where | Pass? |
|---|------|-------|-------|
| 1 | Enable + configure on GitHub | Settings | ☐ |
| 2 | Push → toast in app builder | App Builder | ☐ |
| 3 | Push → NO toast on dashboard | Dashboard | ☐ |
| 4 | Deselected event → nothing happens | Settings + GitHub | ☐ |
| 5 | Branch delete → freeze in editor | App Builder | ☐ |
| 6 | Branch delete → refresh on dashboard | Dashboard | ☐ |
| 7 | Branch delete (other branch) → no action | Either | ☐ |
| 8 | Tag push → version toast | App Builder | ☐ |
| 9 | Self-push → skipped (no loop) | App Builder | ☐ |
| 10 | Rotate secret → grace period works | Settings + GitHub | ☐ |
| 11 | Disable → 403 from GitHub | Settings + GitHub | ☐ |
| 12 | Re-enable fewer events → filtering works | Settings + GitHub | ☐ |
| 13 | Audit log shows events | Settings drawer | ☐ |
| 14 | Error → toast only in editor | App Builder | ☐ |
| 15 | Validation blocks 0 events | Settings drawer | ☐ |
| 16 | Discard modal works | Settings drawer | ☐ |

---

## Useful Debug Queries

```sql
-- Check webhook config
SELECT webhook_enabled, webhook_secret IS NOT NULL as has_secret, webhook_events
FROM organization_git_sync WHERE organization_id = '<orgId>';

-- Check recent webhook events
SELECT delivery_id, event_type, status, error_message, created_at
FROM git_sync_webhook_events
WHERE organization_id = '<orgId>'
ORDER BY created_at DESC LIMIT 10;

-- Check branches
SELECT id, branch_name, is_default
FROM organization_git_sync_branches
WHERE organization_id = '<orgId>';
```

```bash
# Check Redis skip flag
redis-cli GET "gitsync:skip:<orgId>:<branchName>"

# Check Redis lock
redis-cli GET "gitsync:lock:<orgId>:<branchName>"

# Check old secret grace period
redis-cli TTL "gitsync:old_secret:<orgId>"
```
