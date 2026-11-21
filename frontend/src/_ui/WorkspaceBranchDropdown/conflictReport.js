// Formats branch error modal sections as a text/JSON report.

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

const pad = (n) => String(n).padStart(2, '0');

function formatLocalTimestamp(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

export function buildConflictReport({ action, branchName, reportedAt = new Date(), sections = [] }) {
  const nonEmpty = sections.filter((s) => s.issues?.length);
  const issueCount = nonEmpty.reduce((sum, s) => sum + s.issues.length, 0);

  const lines = [
    'ToolJet branch error report',
    '---------------------------',
    `Action:    ${action}`,
    ...(branchName ? [`Branch:    ${branchName}`] : []),
    `Reported:  ${formatLocalTimestamp(reportedAt)}`,
    `Summary:   ${plural(issueCount, 'issue')} across ${plural(nonEmpty.length, 'group')}`,
  ];

  let n = 0;
  const groups = nonEmpty.map((section) => {
    lines.push('', `== ${section.title} (${section.issues.length}) ==`);
    return {
      title: section.title,
      issues: section.issues.map((it) => {
        n += 1;
        lines.push('', `[${n}] ${it.issue}`);
        if (it.value) lines.push(`    Value:       ${it.value}`);
        if (it.details) lines.push(`    Details:     ${it.details}`);
        lines.push(`    Resolution:  ${it.resolution}`);
        lines.push(`    Resources (${it.resources.length}):`);
        it.resources.forEach((r) => {
          const parts = [r.type, r.name];
          if (r.id) parts.push(`ID ${r.id}`);
          if (r.origin) parts.push(r.origin);
          lines.push(`      - ${parts.join(' | ')}`);
        });

        const issue = { index: n, type: it.issue };
        if (it.value) issue.value = it.value;
        if (it.details) issue.details = it.details;
        issue.resolution = it.resolution;
        issue.resources = it.resources.map((r) => ({
          type: r.type,
          name: r.name,
          ...(r.id ? { id: r.id } : {}),
          ...(r.origin ? { origin: r.origin } : {}),
        }));
        return issue;
      }),
    };
  });

  const json = JSON.stringify(
    {
      report: 'ToolJet branch error report',
      action,
      ...(branchName ? { branch: branchName } : {}),
      reportedAt: reportedAt.toISOString(),
      summary: { issues: issueCount, groups: nonEmpty.length },
      groups,
    },
    null,
    2
  );

  return { text: lines.join('\n'), json };
}
