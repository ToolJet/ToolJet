---
id: upgrade-to-v3.16
title: ToolJet 3.16 Migration Guide
---

ToolJet 3.16 introduces a set of **UI and platform updates**. All changes are **non-breaking**, but there are a few that may require minor layout adjustments. This guide summarises all key updates.

:::tip Before upgrading
We recommend reviewing this guide and testing in a staging environment to evaluate UI differences. For self-hosted users, ensure `.env` changes are applied for audit log retention.
:::


## App Builder Changes

Applicable for both Cloud and Self-Hosted ToolJet deployments.

### High Severity (Action Required)
These changes may visibly impact your app's layout or remove features, manual action may be required.

| Area       |Change     |
|:-----------|:----------|
| App Header | Free plan users can **no longer hide the app header**. If you have hidden the app header, it will now be visible on all your applications. Ensure your layout accounts for this change.|
| Dark Mode & Header   | **Toggle App Mode icon** disappears if the page menu is hidden. **Workaround**: Use a Button with the `Toggle App Mode` action.     |

### Medium Severity (Suggested Updates)

These are layout or usability improvements that may require tweaks depending on your app setup.

| Area       |Change     |
|:-----------|:----------|
| Page Menu (Text and icon)         | For page menus using the **Text and icon** style, icons will now stay visible when the menu is collapsed. This was not the case before and may slightly affect your layout. |
| Page Menu (Text only and Icon only) | Page menus using **Text only** or **Icon only** styles can no longer be collapsed. If your layout depended on collapsing these, adjustments may be needed. |
| Branding | The app logo and title now appear side-by-side in the top-left corner of the page menu. The separate top bar that previously held the title and logo has been removed. This change may affect layout balance and branding visibility. |

### Low Severity (Minor Component Changes)

These changes may cause **minor visual shifts** but require no action unless affecting your layout.

| Component         | Change Description    |
|:------------------|:----------------------|
| Container         | Padding updates applied. This may slightly affect alignment of tightly placed child components like headers or cards.                  |
| File Picker        | Enhanced UI with added file size range selection, list titles, and improved visual feedback.                           |
| Tab               | Tab headers have undergone minor visual polish, including alignment and spacing improvements.                                               |
| List View         | Padding on individual records has been slightly adjusted for consistency with other layout components.                                                        |
| Form              | Internal padding revised to align with updated container spacing logic.                                                   |
| Table             | A horizontal scrollbar has been added for overflow content. Scrollbar is now also wider for better accessibility.                        |
| Daterange Picker  | Calendar popup design modernised with better visual grouping and clarity of date selection.                                              |
| Steps             | Step indicators have updated padding and width, improving alignment and usability in multi-step forms.                                                   |
| Image             | Fallback UI for broken images has been improved—display is cleaner and more informative.                                      |
| Dividers          | Side padding removed on both horizontal and vertical dividers, making them appear slightly larger or more prominent.                                |
| Canvas            | When the page menu expands, the canvas now shrinks more predictably to avoid layout clipping.                                |
| Page Menu (Icon)  | The pin icon has been replaced with a hamburger menu icon to better reflect toggle behaviour in collapsed mode.                                 |


## Platform Changes

### Medium Severity 

Audit logs are the reports of all the activities done in your ToolJet account. Below are the default retention periods that determine how long these logs are stored, depending on your deployment type.

| Deployment    | Notes     |
|:--------------|:----------|
| Cloud         | No change. Audit logs remain fixed to 90 days.                                                 |
| Self-Hosted   | Audit logs now default to 90 days. Override via `.env`: `AUDIT_LOG_RETENTION_PERIOD=90`       |


## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [hello@tooljet.com](mailto:hello@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)

