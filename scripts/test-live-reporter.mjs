import readline from 'readline';
import { createWriteStream } from 'fs';

const args = process.argv.slice(2);
const title = args[0];
const logFile = args[1];
const isTTY = process.stdout.isTTY || process.env.IS_TTY === '1';

const logStream = createWriteStream(logFile);
const rl = readline.createInterface({
  input: process.stdin,
  output: null,
  terminal: false
});

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let tick = 0;
let interval;

const FG_PURPLE = '\x1b[35m';
const FG_GRAY = '\x1b[90m';
const FG_GREEN = '\x1b[32m';
const FG_RED = '\x1b[31m';
const FG_YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const SYM_ARROW = '❯';

let passSuites = 0;
let failSuites = 0;
let skipSuites = 0;
let passTests = 0;
let failTests = 0;
let lastSuite = '';
const startTime = Date.now();

function cleanANSI(str) {
  return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

function render() {
  if (!isTTY) return;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const char = SPINNER[tick % SPINNER.length];
  tick++;

  let liveMsg = `${DIM}executing suites...${RESET}`;
  const totalSuites = passSuites + failSuites + skipSuites;
  if (totalSuites > 0) {
    let suiteParts = [];
    if (passSuites > 0) suiteParts.push(`${FG_GREEN}${passSuites} passed${RESET}`);
    if (failSuites > 0) suiteParts.push(`${FG_RED}${failSuites} failed${RESET}`);
    if (skipSuites > 0) suiteParts.push(`${FG_YELLOW}${skipSuites} skipped${RESET}`);
    
    let totalTests = passTests + failTests;
    let testPart = '';
    if (totalTests > 0) {
      testPart = ` ${FG_GRAY}•${RESET} ${DIM}Tests:${RESET} ${FG_GREEN}${passTests} passed${RESET}`;
      if (failTests > 0) {
        testPart += `, ${FG_RED}${failTests} failed${RESET}`;
      }
    }
    
    liveMsg = `${FG_GRAY}${totalSuites} suites${RESET} (${suiteParts.join(', ')})${testPart} ${DIM}• ${lastSuite}${RESET}`;
  }

  process.stdout.write(`\r  ${FG_PURPLE}${char}${RESET} ${title} ${FG_GRAY}(${elapsed}s)${RESET} ${SYM_ARROW} ${liveMsg}\x1b[K`);
}

if (isTTY) {
  process.stdout.write('\x1B[?25l'); // hide cursor
  interval = setInterval(render, 100);
}

rl.on('line', (line) => {
  logStream.write(line + '\n');
  if (!isTTY) return;
  
  const cleanLine = cleanANSI(line).trim();
  if (cleanLine.match(/^PASS\s+/)) {
    passSuites++;
    const parts = cleanLine.split(/\s+/);
    if (parts.length > 1) {
      const suiteParts = parts[1].split('/');
      lastSuite = suiteParts[suiteParts.length - 1];
    }
  } else if (cleanLine.match(/^FAIL\s+/)) {
    failSuites++;
    const parts = cleanLine.split(/\s+/);
    if (parts.length > 1) {
      const suiteParts = parts[1].split('/');
      lastSuite = suiteParts[suiteParts.length - 1];
    }
  } else if (cleanLine.match(/^SKIP\s+/) || cleanLine.match(/^PENDING\s+/)) {
    skipSuites++;
    const parts = cleanLine.split(/\s+/);
    if (parts.length > 1) {
      const suiteParts = parts[1].split('/');
      lastSuite = suiteParts[suiteParts.length - 1];
    }
  } else if (cleanLine.match(/^[✓√]\s+/)) {
    passTests++;
  } else if (cleanLine.match(/^[✕×✕]\s+/)) {
    failTests++;
  }
});

rl.on('close', () => {
  if (interval) clearInterval(interval);
  if (isTTY) {
    process.stdout.write('\x1B[?25h'); // show cursor
    process.stdout.write('\r\x1b[K'); // clear line
  }
  logStream.end();
});

process.on('SIGINT', () => {
  if (interval) clearInterval(interval);
  if (isTTY) process.stdout.write('\x1B[?25h');
  process.exit(1);
});
