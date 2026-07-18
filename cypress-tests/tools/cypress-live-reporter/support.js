'use strict';

/**
 * support.js — browser side of cypress-live-reporter.
 *
 * Usage (cypress/support/e2e.js):
 *   require('../../tools/cypress-live-reporter/support');
 *
 * Reads its entire configuration from Cypress.env('clr'), which the Node
 * plugin injects — zero configuration of its own. Every hook is wrapped so
 * a reporter error can never fail a test.
 */

(function () {
  var cfg;
  try {
    cfg = typeof Cypress !== 'undefined' && Cypress.env && Cypress.env('clr');
  } catch (e) {
    cfg = null;
  }
  if (!cfg || cfg.enabled === false) return;

  var liveTests = !cfg.events || cfg.events.liveTests !== false;
  var domEnabled = !cfg.dom || cfg.dom.enabled !== false;
  var backtrackDepth = Math.min(Math.max(0, (cfg.dom && cfg.dom.backtrackDepth) || 0), 5);
  // command-log capture is cheap (no DOM) so it defaults ON
  var commandsEnabled = !cfg.commands || cfg.commands.enabled !== false;
  var commandsDepth = Math.min(Math.max(1, (cfg.commands && cfg.commands.depth) || 20), 50);
  // commands that never change the AUT — not worth a DOM snapshot
  var BACKTRACK_SKIP = { task: 1, log: 1, wrap: 1, then: 1, wait: 1 };

  var buffer = [];
  var ring = []; // DOM snapshots (backtrack)
  var cmdRing = []; // command log
  var currentCmd = null; // command in flight (the one that fails)

  function push(type, payload) {
    try {
      buffer.push(Object.assign({ type: type, ts: new Date().toISOString() }, payload));
    } catch (e) {
      /* dropped event, never an error */
    }
  }

  function flush() {
    try {
      if (!buffer.length) return;
      var batch = buffer.splice(0, buffer.length);
      cy.task('clr:events', batch, { log: false });
    } catch (e) {
      /* dropped batch */
    }
  }

  function testIdFor(runnable) {
    try {
      var parts = [];
      var node = runnable;
      while (node && node.title) {
        parts.unshift(node.title);
        node = node.parent;
      }
      return parts.join(' > ') || 'unknown';
    } catch (e) {
      return (runnable && runnable.title) || 'unknown';
    }
  }

  function attemptOf(runnable) {
    try {
      return ((runnable && runnable._currentRetry) || 0) + 1;
    } catch (e) {
      return 1;
    }
  }

  // Walk Mocha's suite tree (fully parsed by the time any before() runs) and
  // collect every it-block, so we can announce the roster up front.
  function collectTests(suite, acc) {
    try {
      (suite.tests || []).forEach(function (t) {
        acc.push({ testId: testIdFor(t), title: t.title });
      });
      (suite.suites || []).forEach(function (s) {
        collectTests(s, acc);
      });
    } catch (e) {
      /* partial roster is fine */
    }
    return acc;
  }

  function rootSuite(ctx) {
    var root = null;
    try {
      root = Cypress.mocha.getRunner().suite;
    } catch (e) {
      /* fall back to walking up from the hook's context */
    }
    if (!root && ctx && ctx.test) {
      root = ctx.test.parent;
      while (root && root.parent) root = root.parent;
    }
    return root;
  }

  function specRelative() {
    try {
      return (Cypress.spec && Cypress.spec.relative) || null;
    } catch (e) {
      return null;
    }
  }

  /* ---- command-log helpers -------------------------------------------- */

  function cmdGet(command, key) {
    try {
      if (command && typeof command.get === 'function') return command.get(key);
      return command && command.attributes && command.attributes[key];
    } catch (e) {
      return undefined;
    }
  }

  // Compact, safe stringification of a command's arguments (a selector, the
  // typed text, etc.). Never throws; caps length so a huge arg can't bloat the
  // payload.
  function argStr(args) {
    try {
      if (!args || !args.length) return '';
      return args
        .map(function (a) {
          if (a == null) return String(a);
          var t = typeof a;
          if (t === 'string') return a.length > 120 ? a.slice(0, 120) + '…' : a;
          if (t === 'number' || t === 'boolean') return String(a);
          if (t === 'function') return '[fn]';
          if (a.jquery || a.nodeType) return '[element]';
          try {
            var s = JSON.stringify(a);
            if (!s) return '[object]';
            return s.length > 120 ? s.slice(0, 120) + '…' : s;
          } catch (e) {
            return '[object]';
          }
        })
        .join(', ');
    } catch (e) {
      return '';
    }
  }

  // our own cy.task('clr:events', ...) flush must not appear in the log
  function isOwnTask(name, args) {
    return name === 'task' && args && args[0] === 'clr:events';
  }

  /**
   * Snapshot of the AUT document. Clones documentElement (never mutates the
   * AUT) and copies live form state onto the clone so the saved HTML shows
   * what the user actually saw. Returns null on any failure.
   */
  function serializeDom() {
    try {
      var win = cy.state('window');
      var doc = win && win.document;
      if (!doc || !doc.documentElement) return null;

      var clone = doc.documentElement.cloneNode(true);

      var live = doc.querySelectorAll('input, textarea, select');
      var copies = clone.querySelectorAll('input, textarea, select');
      for (var i = 0; i < live.length && i < copies.length; i++) {
        var el = live[i];
        var copy = copies[i];
        if (el.tagName === 'INPUT') {
          copy.setAttribute('value', el.value == null ? '' : el.value);
          if (el.checked) copy.setAttribute('checked', '');
          else copy.removeAttribute('checked');
        } else if (el.tagName === 'TEXTAREA') {
          copy.textContent = el.value == null ? '' : el.value;
        } else if (el.tagName === 'SELECT') {
          for (var j = 0; j < el.options.length && j < copy.options.length; j++) {
            if (el.options[j].selected) copy.options[j].setAttribute('selected', '');
            else copy.options[j].removeAttribute('selected');
          }
        }
      }

      var doctype = doc.doctype ? '<!DOCTYPE ' + doc.doctype.name + '>' : '<!DOCTYPE html>';
      return {
        html: doctype + '\n' + clone.outerHTML,
        // page address is `pageUrl` — `url` is reserved for the S3 artifact link
        pageUrl: (win.location && win.location.href) || null,
        viewportWidth: win.innerWidth,
        viewportHeight: win.innerHeight,
      };
    } catch (e) {
      return null;
    }
  }

  /* ---- spec roster: announce all it-blocks up front ------------------- */

  before(function () {
    try {
      if (!liveTests) return;
      var root = rootSuite(this);
      if (!root) return;
      var tests = collectTests(root, []);
      // one-time manifest per spec — lets a dashboard show "0 / N done"
      // the instant a spec starts, before any test runs
      push('spec:tests', {
        spec: specRelative(),
        tests: tests,
        totalTests: tests.length,
      });
      flush();
    } catch (e) {
      /* never fail the spec */
    }
  });

  /* ---- live per-test events ------------------------------------------- */

  beforeEach(function () {
    try {
      ring = [];
      cmdRing = [];
      currentCmd = null;
      if (!liveTests) return;
      var t = this.currentTest;
      if (!t) return;
      push('test:start', {
        testId: testIdFor(t),
        title: t.title,
        attempt: attemptOf(t),
        state: 'running',
        spec: specRelative(),
      });
      // immediate flush — this is what makes the dashboard live per it-block
      flush();
    } catch (e) {
      /* never fail the test */
    }
  });

  afterEach(function () {
    try {
      if (!liveTests) return;
      var t = this.currentTest;
      if (!t) return;
      var failed = t.state === 'failed';
      var maxRetries = typeof t.retries === 'function' ? t.retries() : 0;
      push('test:attempt:end', {
        testId: testIdFor(t),
        title: t.title,
        state: t.state,
        attempt: attemptOf(t),
        willRetry: !!(failed && ((t._currentRetry || 0) < maxRetries)),
        duration: t.duration,
        error: (t.err && t.err.message) || null,
        spec: specRelative(),
      });
      flush();
    } catch (e) {
      /* never fail the test */
    }
  });

  /* ---- command log (cheap, no DOM) ------------------------------------ */

  if (commandsEnabled) {
    Cypress.on('command:start', function (command) {
      try {
        var name = cmdGet(command, 'name');
        var args = cmdGet(command, 'args') || [];
        if (!name || isOwnTask(name, args)) return;
        currentCmd = { name: name, args: argStr(args), startedAt: new Date().getTime() };
      } catch (e) {
        /* noop */
      }
    });

    Cypress.on('command:end', function (command) {
      try {
        var name = cmdGet(command, 'name');
        var args = cmdGet(command, 'args') || [];
        if (!name || isOwnTask(name, args)) return;
        var entry = {
          name: name,
          args: argStr(args),
          state: cmdGet(command, 'state') || 'passed',
        };
        if (currentCmd && currentCmd.name === name) {
          entry.ms = new Date().getTime() - currentCmd.startedAt;
        }
        currentCmd = null;
        cmdRing.push(entry);
        if (cmdRing.length > commandsDepth) cmdRing.shift();
      } catch (e) {
        /* skipped command */
      }
    });
  }

  /* ---- failure evidence: command log + DOM snapshot (+ backtrack) ----- */

  if (domEnabled || commandsEnabled) {
    Cypress.on('fail', function (err, runnable) {
      try {
        var testId = testIdFor(runnable);
        var attempt = attemptOf(runnable);

        // command log — the last N commands, plus the one that was in flight
        // when the failure happened (command:end never fired for it)
        if (commandsEnabled) {
          var cmds = cmdRing.slice();
          if (currentCmd) {
            cmds.push({
              name: currentCmd.name,
              args: currentCmd.args,
              state: 'failed',
              ms: new Date().getTime() - currentCmd.startedAt,
            });
          }
          push('artifact:commands', {
            testId: testId,
            attempt: attempt,
            spec: specRelative(),
            error: (err && err.message) || null,
            commands: cmds,
          });
        }

        if (domEnabled) {
          var snap = serializeDom();
          if (snap) {
            push(
              'artifact:dom',
              Object.assign(
                { testId: testId, attempt: attempt, error: (err && err.message) || null, spec: specRelative() },
                snap
              )
            );
          }

          if (backtrackDepth > 0 && ring.length) {
            var total = ring.length;
            for (var i = 0; i < ring.length; i++) {
              push(
                'artifact:dom-backtrack',
                Object.assign(
                  {
                    testId: testId,
                    attempt: attempt,
                    command: ring[i].command,
                    stepsBeforeFailure: total - i,
                    spec: specRelative(),
                  },
                  ring[i].snap
                )
              );
            }
          }
        }

        ring = [];
        cmdRing = [];
        currentCmd = null;
      } catch (e) {
        /* evidence collection must never mask the real failure */
      }
      // ALWAYS rethrow — this reporter never swallows failures
      throw err;
    });
  }

  if (domEnabled && backtrackDepth > 0) {
    Cypress.on('command:end', function (command) {
      try {
        var name =
          command && typeof command.get === 'function'
            ? command.get('name')
            : command && command.attributes && command.attributes.name;
        if (!name || BACKTRACK_SKIP[name]) return;
        var snap = serializeDom();
        if (!snap) return;
        ring.push({ command: name, snap: snap });
        if (ring.length > backtrackDepth) ring.shift();
      } catch (e) {
        /* skipped snapshot */
      }
    });
  }

  /* ---- end-of-spec flush ------------------------------------------------ */

  after(function () {
    try {
      flush();
    } catch (e) {
      /* noop */
    }
  });
})();
