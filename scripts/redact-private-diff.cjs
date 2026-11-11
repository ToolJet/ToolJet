#!/usr/bin/env node
// diff-cover needs paths, hunk ranges and line prefixes, not private source text.
const fs = require('fs');

function redactPrivateDiff(diff) {
  let inHunk = false;
  return diff
    .split('\n')
    .map((line) => {
      if (line.startsWith('diff --git ')) inHunk = false;
      if (line === 'GIT binary patch') throw new Error('Binary patch payloads cannot be published');
      if (line.startsWith('@@')) {
        const header = /^@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@/.exec(line);
        if (!header) throw new Error('Unsupported private diff hunk');
        inHunk = true;
        return header[0];
      }
      if (inHunk && /^[ +\-]/.test(line)) return `${line[0]}[source omitted]`;
      if (inHunk && line && line !== '\\ No newline at end of file') throw new Error('Unexpected private diff payload');
      if (
        !inHunk &&
        line &&
        !/^(diff --git |index |new file mode |deleted file mode |old mode |new mode |similarity index |dissimilarity index |rename from |rename to |copy from |copy to |--- |\+\+\+ |Binary files )/.test(
          line
        )
      )
        throw new Error('Unexpected private diff header');
      return line;
    })
    .join('\n');
}

module.exports = { redactPrivateDiff };
if (require.main === module) process.stdout.write(redactPrivateDiff(fs.readFileSync(0, 'utf8')));
