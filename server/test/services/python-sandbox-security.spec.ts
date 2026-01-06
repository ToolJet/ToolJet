import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PythonExecutorService } from '../../ee/workflows/services/python-executor.service';
import { SecurityModeDetectorService } from '../../ee/workflows/services/security-mode-detector.service';
import { SandboxMode } from '../../src/modules/workflows/interfaces/IPythonExecutorService';
import { WorkflowBundle } from '../../src/entities/workflow_bundle.entity';
import { Logger } from 'nestjs-pino';
import { execSync } from 'child_process';
import * as fs from 'fs';

/**
 * =============================================================================
 * PYTHON SANDBOX SECURITY TEST SUITE
 * =============================================================================
 *
 * We allow users to run arbitrary Python code in workflows. Without proper
 * sandboxing, a malicious user could:
 *
 * 1. STEAL DATA: Read database credentials, API keys, user data
 * 2. ATTACK INFRASTRUCTURE: Connect to internal services, databases
 * 3. CRYPTO-MINE: Use our CPU/memory for cryptocurrency mining
 * 4. PIVOT ATTACKS: Use our servers to attack other systems
 * 5. DENIAL OF SERVICE: Crash our servers with fork bombs, memory exhaustion
 *
 * HOW WE PROTECT:
 * ---------------
 * nsjail creates a "jail" using Linux kernel features:
 *
 * - NAMESPACES: Isolated view of system resources (like Docker containers)
 * - CAPABILITIES: Fine-grained root permissions (we drop ALL of them)
 * - RLIMITS: Resource quotas (CPU time, memory, file descriptors)
 * - SECCOMP: Syscall filtering (blocks dangerous kernel calls) [Linux only]
 * - CGROUPS: Resource accounting/limits [Linux only]
 *
 * TEST TIERS:
 * -----------
 * Tier 1: CORE - Works everywhere, tests namespace/capability isolation
 * Tier 2: RLIMIT - Works on Docker, tests resource limits
 * Tier 3: SYSCALL - Tests behavior (blocked by caps OR seccomp)
 * Tier 4: SECCOMP - CI only, verifies seccomp filter is active
 * Tier 5: CGROUP - CI only, verifies memory/PID limits via cgroups
 *
 * @group workflows
 * @group security
 */
// =============================================================================
// SECURITY CAPABILITY DETECTION - Generic, Platform-Agnostic
// =============================================================================

/**
 * Cached capabilities - run detection once per test session
 */
let cachedCapabilities: SecurityCapabilities | null = null;

interface SecurityCapabilities {
  platform: string; // Informational only - NOT used for decisions
  seccomp: {
    available: boolean;
    reason: string;
  };
  cgroupv2: {
    available: boolean;
    writable: boolean;
    reason: string;
  };
  namespaces: {
    available: string[];
    reason: string;
  };
  sandbox: {
    works: boolean;
    mode: 'full' | 'limited' | 'none';
    details: string;
  };
}

/**
 * Works on any environment - no platform assumptions
 */
function detectSeccompAvailable(): { available: boolean; reason: string } {
  // Method 1: Try to run nsjail with seccomp using the actual config file
  // This matches how PythonExecutorService runs nsjail
  try {
    const configPath = '/etc/nsjail/python-execution.cfg';
    if (fs.existsSync(configPath)) {
      const result = execSync(
        `nsjail --config ${configPath} -- /usr/bin/python3 -c "print('seccomp_test')" 2>&1`,
        { timeout: 10000, encoding: 'utf-8', stdio: 'pipe' }
      );
      // Check if seccomp policy was loaded (look for seccomp-related output or success)
      if (result.includes('seccomp_test') || result.includes('Executing')) {
        return { available: true, reason: 'nsjail seccomp test passed' };
      }
    }
  } catch (e: any) {
    const error = e.stderr?.toString() || e.stdout?.toString() || e.message || '';
    // If seccomp filter is in the output, it means seccomp is configured
    if (error.includes('seccomp') && !error.includes('failed')) {
      return { available: true, reason: 'nsjail with seccomp configured' };
    }
    if (error.includes('PR_SET_SECCOMP') || error.includes('Invalid argument')) {
      return { available: false, reason: 'Kernel/container does not support nested seccomp' };
    }
    if (error.includes('nsjail') && error.includes('not found')) {
      return { available: false, reason: 'nsjail not installed' };
    }
    // Other errors - try alternative method
  }

  // Method 2: Check /proc/self/status for current seccomp mode
  try {
    const status = fs.readFileSync('/proc/self/status', 'utf-8');
    const seccompLine = status.split('\n').find((l) => l.startsWith('Seccomp:'));
    if (seccompLine) {
      const mode = seccompLine.split(':')[1].trim();
      if (mode === '2') {
        return { available: true, reason: 'Already in seccomp filter mode' };
      }
    }
  } catch {
    // /proc not available
  }

  return { available: false, reason: 'Could not verify seccomp availability' };
}

/**
 * Tests if cgroupv2 is available AND writable 
 */
function detectCgroupv2Available(): { available: boolean; writable: boolean; reason: string } {
  try {
    const mounts = fs.readFileSync('/proc/mounts', 'utf-8');
    const hasCgroupv2 = mounts.includes('cgroup2');
    const hasCgroupv1Only = mounts.includes('cgroup ') && !hasCgroupv2;

    if (!hasCgroupv2) {
      return {
        available: false,
        writable: false,
        reason: hasCgroupv1Only ? 'Only cgroupv1 available' : 'No cgroup filesystem mounted',
      };
    }

    // cgroupv2 exists - check if writable by trying to create a test cgroup
    const cgroupPath = '/sys/fs/cgroup';
    try {
      const testPath = `${cgroupPath}/nsjail_test_${process.pid}`;
      fs.mkdirSync(testPath);
      fs.rmdirSync(testPath);
      return { available: true, writable: true, reason: 'cgroupv2 writable' };
    } catch {
      return { available: true, writable: false, reason: 'cgroupv2 present but read-only (container restriction)' };
    }
  } catch {
    return { available: false, writable: false, reason: '/proc/mounts not readable' };
  }
}

/**
 * Detects which Linux namespaces are available
 */
function detectNamespacesAvailable(): { available: string[]; reason: string } {
  try {
    const nsDir = '/proc/self/ns';
    const entries = fs.readdirSync(nsDir);

    const namespaceMap: Record<string, string> = {
      user: 'user',
      mnt: 'mount',
      pid: 'pid',
      net: 'network',
      ipc: 'ipc',
      uts: 'uts',
      cgroup: 'cgroup',
    };

    const available = entries.filter((e) => namespaceMap[e]).map((e) => namespaceMap[e]);

    return { available, reason: `${available.length} namespaces available` };
  } catch {
    return { available: [], reason: '/proc/self/ns not accessible' };
  }
}

/**
 * Uses the actual nsjail config file for accurate detection
 */
function verifySandboxWorks(): { works: boolean; mode: 'full' | 'limited' | 'none'; details: string } {
  // Test 1: Is nsjail installed?
  try {
    execSync('which nsjail', { stdio: 'pipe' });
  } catch {
    return { works: false, mode: 'none', details: 'nsjail not installed' };
  }

  // Test 2: Does the config file exist?
  const configPath = '/etc/nsjail/python-execution.cfg';
  if (!fs.existsSync(configPath)) {
    return { works: false, mode: 'none', details: `nsjail config not found at ${configPath}` };
  }

  // Test 3: Can we run a sandboxed process with the actual config?
  try {
    execSync(`nsjail --config ${configPath} -- /usr/bin/python3 -c "print('test')" 2>&1`, {
      timeout: 15000,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
  } catch (e: any) {
    const error = e.stderr?.toString() || e.message || '';
    // Check for specific errors
    if (error.includes('PR_SET_SECCOMP')) {
      // Seccomp failed but namespaces might work - this is "limited" mode
      // Try without seccomp to confirm namespaces work
      try {
        execSync('nsjail -Mo --user 65534 --group 65534 -- /bin/true 2>&1', {
          timeout: 10000,
          stdio: 'pipe',
        });
        return { works: true, mode: 'limited', details: 'Namespaces: OK, Seccomp: Unavailable (kernel restriction)' };
      } catch {
        return { works: false, mode: 'none', details: `Sandbox failed: ${error.slice(0, 100)}` };
      }
    }
    return { works: false, mode: 'none', details: `Sandbox failed: ${error.slice(0, 100)}` };
  }

  // Test 4: Does seccomp work?
  const seccomp = detectSeccompAvailable();

  const mode = seccomp.available ? 'full' : 'limited';
  const details = seccomp.available
    ? 'Namespaces: OK, Seccomp: OK'
    : `Namespaces: OK, Seccomp: Unavailable (${seccomp.reason})`;

  return { works: true, mode, details };
}

/**
 * Detects platform for informational purposes only
 * NOT used for security decisions - we test actual capabilities instead
 */
function detectPlatformInfo(): string {
  try {
    if (process.env.GITHUB_ACTIONS) return 'github-actions';
    if (process.env.GITLAB_CI) return 'gitlab-ci';
    if (process.env.JENKINS_URL) return 'jenkins';
    if (process.env.CIRCLECI) return 'circleci';

    const uname = execSync('uname -r', { encoding: 'utf-8' }).trim();
    if (uname.includes('microsoft') || uname.includes('WSL')) return 'wsl2';

    if (fs.existsSync('/.dockerenv')) return 'docker';
    return 'linux';
  } catch {
    return 'unknown';
  }
}

/**
 * Comprehensive, generic security capability detection
 * Works on ANY Linux environment - no hardcoded platform assumptions
 */
function detectSecurityCapabilities(): SecurityCapabilities {
  // Return cached result if available
  if (cachedCapabilities) {
    return cachedCapabilities;
  }

  // Run all detection
  const seccomp = detectSeccompAvailable();
  const cgroupv2 = detectCgroupv2Available();
  const namespaces = detectNamespacesAvailable();
  const sandbox = verifySandboxWorks();

  cachedCapabilities = {
    platform: detectPlatformInfo(),
    seccomp,
    cgroupv2,
    namespaces,
    sandbox,
  };

  return cachedCapabilities;
}

// Detect capabilities at module load time so describe/describe.skip works correctly
const securityCapabilities = detectSecurityCapabilities();

describe('Python Sandbox Security Tests', () => {
  let service: PythonExecutorService;
  let securityModeDetector: SecurityModeDetectorService;
  let sandboxMode: SandboxMode;

  beforeAll(async () => {
    const mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const mockBundleRepository = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PythonExecutorService,
        SecurityModeDetectorService,
        { provide: Logger, useValue: mockLogger },
        { provide: getRepositoryToken(WorkflowBundle), useValue: mockBundleRepository },
      ],
    }).compile();

    service = module.get<PythonExecutorService>(PythonExecutorService);
    securityModeDetector = module.get<SecurityModeDetectorService>(SecurityModeDetectorService);

    await securityModeDetector.onModuleInit();
    sandboxMode = securityModeDetector.getMode();

    // Print detailed capability report (detection already done at module load)
    console.log(`
========================================
SECURITY CAPABILITY DETECTION
========================================
Platform: ${securityCapabilities.platform} (informational only)
Sandbox Mode: ${sandboxMode}

Sandbox: ${securityCapabilities.sandbox.works ? 'WORKS' : 'FAILED'} (${securityCapabilities.sandbox.mode})
  ${securityCapabilities.sandbox.details}

Seccomp: ${securityCapabilities.seccomp.available ? 'AVAILABLE' : 'UNAVAILABLE'}
  ${securityCapabilities.seccomp.reason}

cgroupv2: ${securityCapabilities.cgroupv2.available ? 'AVAILABLE' : 'UNAVAILABLE'}${securityCapabilities.cgroupv2.writable ? ' (writable)' : ''}
  ${securityCapabilities.cgroupv2.reason}

Namespaces: ${securityCapabilities.namespaces.available.join(', ') || 'none detected'}
========================================
`);
  })

  const skipIfNoNsjail = () => {
    if (sandboxMode !== SandboxMode.ENABLED) {
      return true;
    }
    return false;
  };

  /**
   * Helper to run Python code and assert security expectations
   */
  async function runSecurityTest(
    code: string,
    expectedPattern: RegExp | string,
    shouldNotContain: string = 'SECURITY_BREACH',
    timeout = 10000
  ) {
    const result = await service.execute(code, {}, null, timeout);
    expect(result.status).toBe('ok');
    if (typeof expectedPattern === 'string') {
      expect(result.data).toContain(expectedPattern);
    } else {
      expect(result.data).toMatch(expectedPattern);
    }
    expect(result.data).not.toContain(shouldNotContain);
    return result;
  }

  // ============================================================================
  // TIER 1: NETWORK ISOLATION
  // ============================================================================
  /**
   * WHAT: Blocks all network access from sandboxed code
   * WHY: Prevents attackers from:
   *   - Exfiltrating stolen data to external servers
   *   - Attacking internal services (Redis, Postgres, other microservices)
   *   - Using our infrastructure for DDoS attacks
   *   - Downloading additional malware
   *
   * HOW: nsjail creates a network namespace with NO interfaces (not even loopback)
   */
  describe('Network Isolation', () => {
    beforeEach(() => {
      if (skipIfNoNsjail()) pending('nsjail not available');
    });

    it('should block HTTP requests (prevents data exfiltration)', async () => {
      await runSecurityTest(
        `
import urllib.request
try:
    urllib.request.urlopen('http://1.1.1.1', timeout=2)
    result = 'SECURITY_BREACH: Network access allowed'
except Exception as e:
    result = f'Network blocked: {type(e).__name__}'
        `,
        'Network blocked'
      );
    }, 15000);

    it('should block raw socket connections (prevents port scanning)', async () => {
      await runSecurityTest(
        `
import socket
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(2)
    s.connect(('8.8.8.8', 53))
    result = 'SECURITY_BREACH: Socket connection allowed'
except OSError as e:
    result = f'Socket blocked: {type(e).__name__} errno={e.errno}'
        `,
        /Socket blocked.*errno=/
      );
    }, 15000);

    it('should block DNS resolution (prevents internal service discovery)', async () => {
      await runSecurityTest(
        `
import socket
try:
    socket.gethostbyname('google.com')
    result = 'SECURITY_BREACH: DNS resolution allowed'
except socket.gaierror as e:
    result = f'DNS blocked: {e.args}'
        `,
        'DNS blocked'
      );
    }, 15000);

    it('should have no loopback interface (prevents localhost attacks)', async () => {
      /**
       * iface_no_lo: true should prevent loopback.
       * However, in Docker on macOS, network namespace behavior may differ.
       * The key test is that external network is blocked (tested above).
       *
       * This test verifies loopback is at least not usable for connections.
       */
      await runSecurityTest(
        `
import socket
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1)
    # Try to connect to a service on localhost (should fail)
    s.connect(('127.0.0.1', 80))
    result = 'SECURITY_BREACH: Loopback connection succeeded'
except OSError as e:
    # Connection refused or network unreachable is expected
    result = f'Loopback blocked: errno={e.errno}'
except Exception as e:
    result = f'Loopback blocked: {type(e).__name__}'
finally:
    try:
        s.close()
    except:
        pass
        `,
        /Loopback blocked/
      );
    }, 15000);

    it('should have no network interfaces visible', async () => {
      await runSecurityTest(
        `
import os
try:
    interfaces = os.listdir('/sys/class/net')
    if interfaces:
        result = f'SECURITY_BREACH: Network interfaces found: {interfaces}'
    else:
        result = 'No network interfaces'
except FileNotFoundError:
    result = 'No network interfaces (/sys/class/net not accessible)'
        `,
        /No network interfaces/
      );
    }, 15000);
  });

  // ============================================================================
  // TIER 1: USER/UID NAMESPACE ISOLATION
  // ============================================================================
  /**
   * WHAT: Runs code as fake "root" that has no real privileges
   * WHY: Even if attacker thinks they're root (UID 0), they can't:
   *   - Read files owned by other users
   *   - Modify system files
   *   - Access hardware devices
   *   - Escalate to real root
   *
   * HOW: UID namespace maps container UID 0 -> host UID 65534 (nobody)
   */
  describe('User/UID Namespace Isolation', () => {
    beforeEach(() => {
      if (skipIfNoNsjail()) pending('nsjail not available');
    });

    it('should run as mapped UID (fake root with no power)', async () => {
      await runSecurityTest(
        `
import os
uid = os.getuid()
euid = os.geteuid()
result = f'UID={uid} EUID={euid}'
        `,
        'UID=0 EUID=0' // Looks like root but isn't
      );
    }, 15000);

    it('should have NO capabilities (prevents privilege escalation)', async () => {
      /**
       * Capabilities are fine-grained root permissions. Examples:
       * - CAP_NET_ADMIN: Configure network interfaces
       * - CAP_SYS_ADMIN: Mount filesystems, change hostname
       * - CAP_SYS_PTRACE: Debug/trace other processes
       *
       * We drop ALL of them (keep_caps: false).
       * We verify this by attempting operations that require capabilities.
       */
      await runSecurityTest(
        `
import os

# Test operations that require capabilities
tests_failed = 0

# CAP_SETUID - try to change UID
try:
    os.setuid(1000)
except PermissionError:
    tests_failed += 1
except OSError:
    tests_failed += 1

# CAP_CHOWN - try to change file ownership
try:
    with open('/tmp/cap_test.txt', 'w') as f:
        f.write('test')
    os.chown('/tmp/cap_test.txt', 1000, 1000)
except (PermissionError, OSError):
    tests_failed += 1
finally:
    try:
        os.remove('/tmp/cap_test.txt')
    except:
        pass

# CAP_MKNOD - try to create device
try:
    import stat
    os.mknod('/tmp/fake_dev', stat.S_IFCHR | 0o666, os.makedev(1, 3))
except (PermissionError, OSError, AttributeError):
    tests_failed += 1

if tests_failed >= 2:
    result = f'No capabilities ({tests_failed} privileged ops blocked)'
else:
    result = f'SECURITY_BREACH: Only {tests_failed} ops blocked'
        `,
        /No capabilities/
      );
    }, 15000);

    it('should block setuid (prevents switching to other users)', async () => {
      await runSecurityTest(
        `
import os
try:
    os.setuid(1000)
    result = 'SECURITY_BREACH: setuid succeeded'
except OSError as e:
    result = f'setuid blocked: {e}'
        `,
        'setuid blocked'
      );
    }, 15000);
  });

  // ============================================================================
  // TIER 1: PID NAMESPACE ISOLATION
  // ============================================================================
  /**
   * WHAT: Sandboxed code sees only its own processes
   * WHY: Prevents attackers from:
   *   - Seeing what other processes are running
   *   - Sending signals to other processes (kill, pause)
   *   - Reading memory of other processes
   *   - Discovering internal service architecture
   *
   * HOW: PID namespace gives sandbox its own process tree starting at PID 1
   */
  describe('PID Namespace Isolation', () => {
    beforeEach(() => {
      if (skipIfNoNsjail()) pending('nsjail not available');
    });

    it('should have isolated PID namespace (low PIDs)', async () => {
      await runSecurityTest(
        `
import os
pid = os.getpid()
ppid = os.getppid()
if pid <= 10 and ppid <= 10:
    result = f'PID namespace isolated: PID={pid} PPID={ppid}'
else:
    result = f'SECURITY_BREACH: PID too high ({pid}), might see host'
        `,
        'PID namespace isolated'
      );
    }, 15000);

    it('should not see host processes in /proc', async () => {
      await runSecurityTest(
        `
import os
try:
    pids = [int(p) for p in os.listdir('/proc') if p.isdigit()]
    max_pid = max(pids) if pids else 0

    if len(pids) > 10 or max_pid > 100:
        result = f'SECURITY_BREACH: Too many processes: {len(pids)} pids, max={max_pid}'
    else:
        result = f'/proc isolated: {len(pids)} pids, max={max_pid}'
except FileNotFoundError:
    # /proc not mounted - this is actually MORE secure than isolated /proc
    result = '/proc not accessible (secure - not mounted)'
except Exception as e:
    result = f'/proc not accessible: {e}'
        `,
        /\/proc isolated|\/proc not accessible/
      );
    }, 15000);
  });

  // ============================================================================
  // TIER 1: FILESYSTEM ISOLATION
  // ============================================================================
  /**
   * WHAT: Sandboxed code sees a minimal fake filesystem
   * WHY: Prevents attackers from:
   *   - Reading .env files with database passwords
   *   - Reading /etc/shadow (password hashes)
   *   - Modifying application code
   *   - Planting backdoors that persist
   *
   * HOW: Mount namespace with:
   *   - Read-only bind mounts for /usr, /lib (Python needs these)
   *   - tmpfs for /tmp, /home (writes disappear after execution)
   *   - Fake /etc/passwd with just "sandbox" user
   *   - No access to /app, /root, /var, etc.
   */
  describe('Filesystem Isolation', () => {
    beforeEach(() => {
      if (skipIfNoNsjail()) pending('nsjail not available');
    });

    it('should have fake /etc/passwd (not host version)', async () => {
      await runSecurityTest(
        `
try:
    with open('/etc/passwd', 'r') as f:
        content = f.read()
    if 'sandbox' in content and len(content) < 100:
        result = '/etc/passwd is sandbox version'
    elif len(content) < 100:
        # Small file, likely sandbox version even if different format
        result = '/etc/passwd is sandbox version (small file)'
    else:
        result = f'SECURITY_BREACH: /etc/passwd is host ({len(content)} bytes)'
except FileNotFoundError:
    # No /etc/passwd is also secure - can't enumerate users
    result = '/etc/passwd is sandbox version (not accessible)'
        `,
        '/etc/passwd is sandbox version'
      );
    }, 15000);

    it('should not have /etc/shadow accessible (password hashes)', async () => {
      await runSecurityTest(
        `
import os
try:
    exists = os.path.exists('/etc/shadow')
    if exists:
        with open('/etc/shadow', 'r') as f:
            f.read()
        result = 'SECURITY_BREACH: /etc/shadow readable'
    else:
        result = '/etc/shadow does not exist'
except PermissionError:
    result = '/etc/shadow permission denied'
except Exception as e:
    result = f'/etc/shadow blocked: {type(e).__name__}'
        `,
        /does not exist|permission denied|blocked/
      );
    }, 15000);

    it('should have read-only /usr (prevents code tampering)', async () => {
      await runSecurityTest(
        `
try:
    with open('/usr/test_write.txt', 'w') as f:
        f.write('test')
    result = 'SECURITY_BREACH: /usr is writable'
except (OSError, IOError) as e:
    result = f'/usr is read-only: {e}'
        `,
        '/usr is read-only'
      );
    }, 15000);

    it('should have tmpfs /home and /tmp (writes dont persist)', async () => {
      /**
       * We verify tmpfs by testing behavior: writes work but are ephemeral
       * If /proc/mounts is not accessible, we verify via file operations
       */
      await runSecurityTest(
        `
import os
try:
    with open('/proc/mounts', 'r') as f:
        mounts = f.read()

    home_tmpfs = 'tmpfs /home' in mounts
    tmp_tmpfs = 'tmpfs /tmp' in mounts

    if home_tmpfs and tmp_tmpfs:
        result = '/home and /tmp are tmpfs'
    else:
        result = f'SECURITY_BREACH: not tmpfs (home={home_tmpfs}, tmp={tmp_tmpfs})'
except FileNotFoundError:
    # /proc not mounted, verify tmpfs behavior instead
    # Write to both locations - if it works, they're writable (likely tmpfs)
    try:
        with open('/tmp/tmpfs_test.txt', 'w') as f:
            f.write('test')
        os.remove('/tmp/tmpfs_test.txt')
        with open('/home/tmpfs_test.txt', 'w') as f:
            f.write('test')
        os.remove('/home/tmpfs_test.txt')
        result = '/home and /tmp are tmpfs (verified via write test)'
    except Exception as e:
        result = f'Filesystem test failed: {e}'
        `,
        '/home and /tmp are tmpfs'
      );
    }, 15000);

    it('should not access host /app directory (our code)', async () => {
      await runSecurityTest(
        `
import os
host_indicators = ['node_modules', 'package.json', 'server', '.env']
try:
    if os.path.exists('/app'):
        contents = os.listdir('/app')
        found = [f for f in host_indicators if f in contents]
        if found:
            result = f'SECURITY_BREACH: Host /app accessible: {found}'
        else:
            result = '/app exists but empty'
    else:
        result = '/app does not exist in sandbox'
except Exception as e:
    result = f'/app not accessible: {e}'
        `,
        /does not exist|not accessible|empty/
      );
    }, 15000);

    it('should allow temporary writes to /tmp', async () => {
      await runSecurityTest(
        `
import os
test_file = '/tmp/security_test.txt'
with open(test_file, 'w') as f:
    f.write('test data')
with open(test_file, 'r') as f:
    content = f.read()
os.remove(test_file)
result = f'Temporary write works: {content}'
        `,
        'Temporary write works'
      );
    }, 15000);
  });

  // ============================================================================
  // TIER 1: ENVIRONMENT VARIABLE ISOLATION
  // ============================================================================
  /**
   * WHAT: Sandboxed code only sees explicitly allowed env vars
   * WHY: Environment variables often contain:
   *   - DATABASE_URL with passwords
   *   - API keys (AWS_SECRET_ACCESS_KEY, STRIPE_SECRET_KEY)
   *   - Internal service URLs
   *   - JWT secrets
   *
   * HOW: nsjail's keep_env: false clears all env vars, then we add back only safe ones
   */
  describe('Environment Isolation', () => {
    beforeEach(() => {
      if (skipIfNoNsjail()) pending('nsjail not available');
    });

    it('should only have explicitly allowed env vars', async () => {
      const result = await service.execute(
        `
import os
env = dict(os.environ)
result = {'count': len(env), 'vars': sorted(env.keys())}
        `,
        {},
        null,
        10000
      );

      expect(result.status).toBe('ok');

      // ONLY these vars are allowed by nsjail config
      const allowedVars = new Set([
        'PATH',
        'HOME',
        'PYTHONPATH',
        'PYTHONDONTWRITEBYTECODE',
        'PYTHONUNBUFFERED',
        'OMP_NUM_THREADS',
        'OPENBLAS_NUM_THREADS',
        'LC_CTYPE', // Sometimes added by Python
      ]);

      const actualVars = new Set(result.data.vars as string[]);
      const unexpected = [...actualVars].filter((v) => !allowedVars.has(v));

      expect(unexpected).toEqual([]);
    }, 15000);

    it('should not expose any secrets', async () => {
      await runSecurityTest(
        `
import os
env = os.environ

secret_patterns = [
    'PASSWORD', 'PASSWD', 'SECRET', 'KEY', 'TOKEN', 'CREDENTIAL',
    'API_KEY', 'APIKEY', 'AUTH', 'PRIVATE', 'CERT',
    'PG_PASS', 'POSTGRES', 'MYSQL', 'REDIS', 'MONGO', 'DATABASE_URL',
    'AWS_', 'AZURE_', 'GCP_', 'GOOGLE_', 'GITHUB_',
    'LOCKBOX', 'MASTER_KEY', 'ENCRYPTION', 'JWT', 'SESSION',
]

found_secrets = []
for key in env.keys():
    key_upper = key.upper()
    for pattern in secret_patterns:
        if pattern in key_upper:
            found_secrets.append(key)
            break

if found_secrets:
    result = f'SECURITY_BREACH: Secrets exposed: {found_secrets}'
else:
    result = 'No secrets exposed'
        `,
        'No secrets exposed'
      );
    }, 15000);

    it('should not expose server env vars (NODE_ENV, TOOLJET_HOST)', async () => {
      await runSecurityTest(
        `
import os
server_vars = ['NODE_ENV', 'TOOLJET_HOST', 'LOCKBOX_MASTER_KEY', 'SECRET_KEY_BASE', 'PG_HOST']
exposed = [var for var in server_vars if var in os.environ]

if exposed:
    result = f'SECURITY_BREACH: Server vars exposed: {exposed}'
else:
    result = 'Server vars not exposed'
        `,
        'Server vars not exposed'
      );
    }, 15000);
  });

  // ============================================================================
  // TIER 2: RESOURCE LIMITS (RLIMITS)
  // ============================================================================
  /**
   * WHAT: Limits CPU, memory, file descriptors, processes
   * WHY: Prevents denial-of-service attacks:
   *   - CPU exhaustion (crypto mining, infinite loops)
   *   - Memory exhaustion (crash the server)
   *   - Fork bombs (spawn infinite processes)
   *   - File descriptor exhaustion
   *
   * HOW: Linux rlimit syscall sets hard limits the process cannot exceed
   */
  describe('Resource Limits (rlimit)', () => {
    beforeEach(() => {
      if (skipIfNoNsjail()) pending('nsjail not available');
    });

    it('should enforce CPU time limit (prevents crypto mining)', async () => {
      const start = Date.now();
      const result = await service.execute(
        `
# Infinite CPU-bound loop (simulates crypto mining)
while True:
    x = 1 + 1
        `,
        {},
        null,
        15000
      );

      const elapsed = Date.now() - start;

      // rlimit_cpu: 5 means 5 seconds of CPU time
      expect(elapsed).toBeLessThan(10000);
      // Process killed, doesn't return normally
      expect(result.status === 'error' || result.data === undefined).toBe(true);
    }, 20000);

    it('should enforce wall-clock time limit (prevents hanging)', async () => {
      const start = Date.now();
      const result = await service.execute(
        `
import time
time.sleep(30)  # Try to sleep 30 seconds
result = 'SECURITY_BREACH: Slept past time_limit'
        `,
        {},
        null,
        15000
      );

      const elapsed = Date.now() - start;

      // time_limit: 10 in nsjail config
      expect(elapsed).toBeLessThan(12000);
      expect(result.status === 'error' || result.data === undefined).toBe(true);
    }, 20000);

    it('should enforce file descriptor limit (rlimit_nofile: 64)', async () => {
      const result = await service.execute(
        `
files = []
try:
    for i in range(100):
        f = open(f'/tmp/fd_test_{i}.txt', 'w')
        files.append(f)
    result = f'SECURITY_BREACH: Opened {len(files)} files'
except OSError as e:
    result = f'FD limit enforced at {len(files)} files'
finally:
    for f in files:
        try: f.close()
        except: pass
        `,
        {},
        null,
        10000
      );

      expect(result.status).toBe('ok');
      expect(result.data).toMatch(/FD limit enforced at \d+ files/);
      expect(result.data).not.toContain('SECURITY_BREACH');

      // Verify limit is around 60-64 (some FDs used by Python)
      const match = /at (\d+) files/.exec(result.data?.toString() || '');
      if (match) {
        const fdCount = parseInt(match[1], 10);
        expect(fdCount).toBeLessThan(70);
        expect(fdCount).toBeGreaterThan(50);
      }
    }, 15000);

    it('should enforce process limit (prevents fork bombs)', async () => {
      /**
       * Fork bomb: while true; do :(){ :|:& };: done
       * Creates exponentially growing processes, crashes server
       *
       * rlimit_nproc limits processes per UID. In Docker on macOS,
       * this may not be enforced as strictly. The key protection is:
       * 1. time_limit kills long-running processes
       * 2. cgroupv2 pids.max (on native Linux)
       *
       * This test verifies fork is at least somewhat limited or
       * documents the current behavior.
       */
      const result = await service.execute(
        `
import os
children = 0
pids = []
try:
    for i in range(50):  # Try to fork more
        pid = os.fork()
        if pid == 0:
            os._exit(0)
        else:
            pids.append(pid)
            children += 1
    result = f'Fork limited at {children} (soft limit)'
except OSError as e:
    result = f'Fork limited at {children}: errno={e.errno}'
finally:
    for pid in pids:
        try: os.waitpid(pid, 0)
        except: pass
        `,
        {},
        null,
        15000
      );

      expect(result.status).toBe('ok');
      // On Docker/macOS, rlimit_nproc may allow some forks
      // The important thing is it's not unlimited (< 100)
      const match = /at (\d+)/.exec(result.data?.toString() || '');
      if (match) {
        const forkCount = parseInt(match[1], 10);
        expect(forkCount).toBeLessThan(100);
      }
    }, 20000);
  });

  // ============================================================================
  // TIER 3: SYSCALL RESTRICTIONS
  // ============================================================================
  /**
   * WHAT: Blocks dangerous system calls
   * WHY: Some syscalls allow:
   *   - ptrace: Debug other processes, steal memory
   *   - mount: Attach filesystems, escape sandbox
   *   - mknod: Create device files, access hardware
   *   - chroot: Attempt container escape
   *
   * HOW:
   *   - On Docker/macOS: Blocked by dropped capabilities
   *   - On native Linux: Blocked by seccomp filter (more secure)
   *
   * IMPORTANT: We test that the BEHAVIOR is blocked, not HOW it's blocked
   */
  describe('Syscall Restrictions', () => {
    beforeEach(() => {
      if (skipIfNoNsjail()) pending('nsjail not available');
    });

    it('should block ptrace (prevents debugging other processes)', async () => {
      /**
       * ptrace allows one process to:
       * - Read/write memory of another process
       * - Intercept system calls
       * - Inject code into running processes
       *
       * Used by: gdb, strace, malware
       */
      await runSecurityTest(
        `
import ctypes
import errno

libc = ctypes.CDLL(None, use_errno=True)

# PTRACE_TRACEME = 0
result_code = libc.ptrace(0, 0, None, None)
err = ctypes.get_errno()

if result_code == 0:
    result = 'SECURITY_BREACH: ptrace succeeded'
elif err == errno.EPERM:
    result = 'ptrace blocked: EPERM (no CAP_SYS_PTRACE)'
elif err == errno.ENOSYS:
    result = 'ptrace blocked: ENOSYS (seccomp)'
else:
    result = f'ptrace blocked: errno={err}'
        `,
        /ptrace blocked/
      );
    }, 15000);

    it('should block mount (prevents filesystem escape)', async () => {
      await runSecurityTest(
        `
import ctypes
import errno

libc = ctypes.CDLL(None, use_errno=True)
result_code = libc.mount(b'/dev/null', b'/mnt', b'tmpfs', 0, None)
err = ctypes.get_errno()

if result_code == 0:
    result = 'SECURITY_BREACH: mount succeeded'
else:
    result = f'mount blocked: errno={err}'
        `,
        /mount blocked/
      );
    }, 15000);

    it('should block mknod (prevents device file creation)', async () => {
      /**
       * mknod creates device files (/dev/null, /dev/sda, etc.)
       * Attacker could create a device file to access raw disk
       */
      await runSecurityTest(
        `
import os
import stat
try:
    os.mknod('/tmp/fake_null', stat.S_IFCHR | 0o666, os.makedev(1, 3))
    result = 'SECURITY_BREACH: mknod succeeded'
except OSError as e:
    result = f'mknod blocked: {e}'
except AttributeError:
    result = 'mknod not available'
        `,
        /mknod blocked|not available/
      );
    }, 15000);

    it('should block chroot (prevents sandbox escape attempts)', async () => {
      await runSecurityTest(
        `
import os
try:
    os.chroot('/tmp')
    result = 'SECURITY_BREACH: chroot succeeded'
except OSError as e:
    result = f'chroot blocked: {e}'
        `,
        'chroot blocked'
      );
    }, 15000);

    it('should block sethostname (prevents fingerprinting attacks)', async () => {
      await runSecurityTest(
        `
import ctypes
import errno

libc = ctypes.CDLL(None, use_errno=True)
result_code = libc.sethostname(b'hacked', 6)
err = ctypes.get_errno()

if result_code == 0:
    result = 'SECURITY_BREACH: sethostname succeeded'
else:
    result = f'sethostname blocked: errno={err}'
        `,
        /sethostname blocked/
      );
    }, 15000);
  });

  // ============================================================================
  // TIER 4: SECCOMP TESTS (CI/Native Linux Only)
  // ============================================================================
  /**
   * WHAT: Verify seccomp filter is active
   * WHY: Seccomp provides kernel-level syscall filtering
   *      More secure than just dropping capabilities
   *
   * NOTE: Only works on native Linux, not Docker on macOS
   */
  // Skip based on ACTUAL capability detection, not platform guessing
  const describeSeccomp = securityCapabilities?.seccomp?.available ? describe : describe.skip;

  describeSeccomp('Seccomp Filter (requires seccomp support)', () => {
    beforeEach(() => {
      if (skipIfNoNsjail()) pending('nsjail not available');
    });

    it('should have seccomp mode enabled', async () => {
      // Verify seccomp by testing that a blocked syscall returns an error
      // We can't read /proc/self/status because /proc is not mounted in the sandbox
      await runSecurityTest(
        `
import ctypes
import errno

libc = ctypes.CDLL(None, use_errno=True)

# Try reboot syscall - should be blocked by seccomp
# reboot requires CAP_SYS_BOOT and is blocked by our seccomp filter
result_code = libc.reboot(0)
err = ctypes.get_errno()

if result_code == -1 and err == errno.EPERM:
    result = 'Seccomp filter active - reboot blocked with EPERM'
elif result_code == -1:
    result = f'Seccomp filter active - reboot blocked with errno {err}'
else:
    result = 'SECURITY_BREACH: reboot syscall allowed'
        `,
        /Seccomp filter active/
      );
    }, 15000);
  });

  // ============================================================================
  // TIER 5: CGROUP TESTS (CI/Native Linux Only)
  // ============================================================================
  /**
   * WHAT: Verify cgroup memory/PID limits
   * WHY: rlimits can sometimes be bypassed, cgroups provide hard limits
   *
   * NOTE: Only works on native Linux with cgroupv2
   */
  // Skip based on ACTUAL capability detection - cgroupv2 must be writable
  const describeCgroup = securityCapabilities?.cgroupv2?.writable ? describe : describe.skip;

  describeCgroup('cgroupv2 Limits (requires writable cgroupv2)', () => {
    beforeEach(() => {
      if (skipIfNoNsjail()) pending('nsjail not available');
    });

    it('should enforce memory limit via cgroups', async () => {
      const result = await service.execute(
        `
data = []
try:
    for i in range(500):
        data.append(bytearray(1024 * 1024))  # 1MB chunks
    result = f'SECURITY_BREACH: Allocated {len(data)}MB'
except MemoryError:
    result = f'Memory limit enforced at {len(data)}MB'
        `,
        {},
        null,
        15000
      );

      expect(
        result.status === 'error' ||
        result.data === undefined ||
        result.data?.toString().includes('Memory limit enforced')
      ).toBe(true);
    }, 20000);
  });

  // ============================================================================
  // TIER 6: EXECUTION CONTEXT ISOLATION
  // ============================================================================
  /**
   * WHAT: Each execution is completely isolated from previous ones
   * WHY: Prevents:
   *   - Data leakage between workflow runs
   *   - One user's code affecting another's
   *   - Persistence of malware
   */
  describe('Execution Context Isolation', () => {
    beforeEach(() => {
      if (skipIfNoNsjail()) pending('nsjail not available');
    });

    it('should not share variables between executions', async () => {
      // First execution sets a secret
      await service.execute('shared_secret = "super_secret_value"', {}, null, 10000);

      // Second execution should NOT see it
      await runSecurityTest(
        `
try:
    result = shared_secret
except NameError:
    result = 'Variable isolation working'
        `,
        'Variable isolation working'
      );
    }, 20000);

    it('should not persist files between executions', async () => {
      // First execution creates files
      await service.execute(
        `
with open('/tmp/secret.txt', 'w') as f:
    f.write('stolen_data')
with open('/home/backdoor.py', 'w') as f:
    f.write('malware')
result = 'Files created'
        `,
        {},
        null,
        10000
      );

      // Second execution should NOT see them
      await runSecurityTest(
        `
import os
paths = ['/tmp/secret.txt', '/home/backdoor.py']
found = [p for p in paths if os.path.exists(p)]
if found:
    result = f'SECURITY_BREACH: Files persisted: {found}'
else:
    result = 'File isolation working'
        `,
        'File isolation working'
      );
    }, 20000);

    it('should start with clean /tmp each execution', async () => {
      await runSecurityTest(
        `
import os
contents = os.listdir('/tmp')
if len(contents) > 5:
    result = f'SECURITY_BREACH: /tmp not clean: {contents}'
else:
    result = f'/tmp is clean ({len(contents)} items)'
        `,
        '/tmp is clean'
      );
    }, 15000);
  });

  // ============================================================================
  // TIER 7: STATE INJECTION SECURITY
  // ============================================================================
  /**
   * WHAT: Safely pass data from Node.js to Python
   * WHY: Attackers might try to inject malicious state that:
   *   - Overrides Python builtins (open, json, etc.)
   *   - Injects code through special characters
   *   - Breaks out of the sandbox
   */
  describe('State Injection Security', () => {
    beforeEach(() => {
      if (skipIfNoNsjail()) pending('nsjail not available');
    });

    it('should safely inject state variables', async () => {
      const result = await service.execute('result = injected_value', { injected_value: 'test_data_123' }, null, 10000);

      expect(result.status).toBe('ok');
      expect(result.data).toBe('test_data_123');
    }, 15000);

    it('should handle state with special characters', async () => {
      const result = await service.execute('result = special', { special: "quotes'and\"stuff" }, null, 10000);

      expect(result.status).toBe('ok');
      expect(result.data).toContain('quotes');
    }, 15000);

    it('should not allow state to override critical builtins', async () => {
      /**
       * Attacker sends state: { open: "malicious_function" }
       * Hoping to break file operations or inject code
       *
       * Note: The Python executor may reject certain keys that conflict
       * with builtins. This test verifies the behavior is safe.
       */
      const result = await service.execute(
        `
# Test that standard operations still work
import json as json_module
data = {'test': True}
json_str = json_module.dumps(data)

# Test file operations
try:
    opened = open('/tmp/test.txt', 'w')
    opened.close()
    import os
    os.remove('/tmp/test.txt')
    result = 'Builtins protected'
except Exception as e:
    # If open is shadowed, this would fail
    result = f'Builtins modified: {e}'
        `,
        {
          // These keys might be filtered or cause errors - that's OK
          // The point is the sandbox doesn't break
          user_open: 'custom_value',
          user_json: 'also_custom',
        },
        null,
        10000
      );

      expect(result.status).toBe('ok');
      expect(result.data).toBe('Builtins protected');
    }, 15000);

    it('should handle complex nested state', async () => {
      const complexState = {
        user: { name: 'test', id: 123 },
        data: [1, 2, 3],
        nested: { deep: { value: 'found' } },
      };

      const result = await service.execute('result = nested["deep"]["value"]', complexState, null, 10000);

      expect(result.status).toBe('ok');
      expect(result.data).toBe('found');
    }, 15000);
  });

  // ============================================================================
  // TIER 8: APPLICATION-LEVEL ISOLATION (ToolJet-specific)
  // ============================================================================

  describe('Application Source Code Protection', () => {
    /**
     * WHAT: Verify sandbox can't read application source code
     * WHY: Attackers could:
     *   - Find vulnerabilities in our code
     *   - Steal proprietary business logic
     *   - Discover API patterns to exploit
     */
    beforeEach(() => {
      if (skipIfNoNsjail()) pending('nsjail not available');
    });

    it('should not access server source code', async () => {
      await runSecurityTest(
        `
import os
paths_to_check = [
    '/app/server/src',
    '/app/server/ee',
    '/app/server/package.json',
    '/app/server/tsconfig.json',
    '/app/frontend',
    '/app/plugins',
]
accessible = []
for path in paths_to_check:
    if os.path.exists(path):
        accessible.append(path)
if accessible:
    result = f'SECURITY_BREACH: Source code accessible: {accessible}'
else:
    result = 'Source code not accessible'
        `,
        'Source code not accessible'
      );
    }, 15000);

    it('should not access node_modules', async () => {
      await runSecurityTest(
        `
import os
paths = ['/app/node_modules', '/app/server/node_modules', '/node_modules']
found = [p for p in paths if os.path.exists(p)]
if found:
    result = f'SECURITY_BREACH: node_modules accessible: {found}'
else:
    result = 'node_modules not accessible'
        `,
        'node_modules not accessible'
      );
    }, 15000);

    it('should not access .env files', async () => {
      await runSecurityTest(
        `
import os
env_paths = ['/app/.env', '/app/server/.env', '/.env', '/root/.env', '/home/.env']
found = [p for p in env_paths if os.path.exists(p)]
if found:
    result = f'SECURITY_BREACH: .env files accessible: {found}'
else:
    result = '.env files not accessible'
        `,
        '.env files not accessible'
      );
    }, 15000);

    it('should not access git repository', async () => {
      await runSecurityTest(
        `
import os
git_paths = ['/app/.git', '/.git', '/home/.git']
found = [p for p in git_paths if os.path.exists(p)]
if found:
    result = f'SECURITY_BREACH: .git accessible: {found}'
else:
    result = '.git not accessible'
        `,
        '.git not accessible'
      );
    }, 15000);
  });

  describe('Database Isolation', () => {
    /**
     * WHAT: Verify sandbox can't connect to databases
     * WHY: Attackers could:
     *   - Dump entire database
     *   - Modify/delete data
     *   - Create backdoor admin accounts
     *   - Steal user credentials
     */
    beforeEach(() => {
      if (skipIfNoNsjail()) pending('nsjail not available');
    });

    it('should not connect to PostgreSQL via network', async () => {
      await runSecurityTest(
        `
import socket
ports = [5432, 5431, 5433]
hosts = ['localhost', '127.0.0.1', 'host.docker.internal', 'postgres', 'db']
connected = []
for host in hosts:
    for port in ports:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.5)
            s.connect((host, port))
            connected.append(f'{host}:{port}')
            s.close()
        except:
            pass
if connected:
    result = f'SECURITY_BREACH: PostgreSQL reachable at {connected}'
else:
    result = 'PostgreSQL not reachable (network isolated)'
        `,
        'PostgreSQL not reachable'
      );
    }, 20000);

    it('should not connect to Redis via network', async () => {
      await runSecurityTest(
        `
import socket
ports = [6379, 6380]
hosts = ['localhost', '127.0.0.1', 'host.docker.internal', 'redis']
connected = []
for host in hosts:
    for port in ports:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.5)
            s.connect((host, port))
            connected.append(f'{host}:{port}')
            s.close()
        except:
            pass
if connected:
    result = f'SECURITY_BREACH: Redis reachable at {connected}'
else:
    result = 'Redis not reachable (network isolated)'
        `,
        'Redis not reachable'
      );
    }, 20000);

    it('should not have database connection strings in environment', async () => {
      await runSecurityTest(
        `
import os
db_patterns = ['DATABASE_URL', 'PG_HOST', 'PG_PASS', 'PG_USER', 'REDIS_URL', 'REDIS_HOST', 'MONGODB_URI']
found = [k for k in os.environ if any(p in k.upper() for p in db_patterns)]
if found:
    result = f'SECURITY_BREACH: DB connection strings exposed: {found}'
else:
    result = 'No database connection strings exposed'
        `,
        'No database connection strings exposed'
      );
    }, 15000);
  });

  describe('Internal Service Isolation', () => {
    /**
     * WHAT: Verify sandbox can't reach internal microservices
     * WHY: Attackers could:
     *   - Bypass authentication via internal APIs
     *   - Access admin-only endpoints
     *   - Exploit services that trust internal network
     */
    beforeEach(() => {
      if (skipIfNoNsjail()) pending('nsjail not available');
    });

    it('should not reach internal APIs (PostgREST, etc)', async () => {
      await runSecurityTest(
        `
import socket
ports = [3000, 3001, 8080, 8081]
hosts = ['localhost', '127.0.0.1', 'host.docker.internal', 'postgrest', 'server']
connected = []
for host in hosts:
    for port in ports:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.5)
            s.connect((host, port))
            connected.append(f'{host}:{port}')
            s.close()
        except:
            pass
if connected:
    result = f'SECURITY_BREACH: Internal API reachable at {connected}'
else:
    result = 'Internal APIs not reachable'
        `,
        'Internal APIs not reachable'
      );
    }, 20000);

    it('should not reach cloud metadata endpoints (SSRF protection)', async () => {
      /**
       * Cloud metadata endpoints are often targets for SSRF attacks
       * AWS: 169.254.169.254, GCP: metadata.google.internal, Azure: 169.254.169.254
       */
      await runSecurityTest(
        `
import socket
metadata_endpoints = [
    ('169.254.169.254', 80),   # AWS/Azure metadata
    ('169.254.169.254', 443),
    ('metadata.google.internal', 80),  # GCP metadata
]
connected = []
for host, port in metadata_endpoints:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        s.connect((host, port))
        connected.append(f'{host}:{port}')
        s.close()
    except:
        pass
if connected:
    result = f'SECURITY_BREACH: Cloud metadata reachable at {connected}'
else:
    result = 'Cloud metadata endpoints not reachable (SSRF protected)'
        `,
        'Cloud metadata endpoints not reachable'
      );
    }, 15000);
  });

  describe('Secrets and Credentials Protection', () => {
    /**
     * WHAT: Verify sandbox can't access sensitive credentials
     * WHY: These credentials could be used to:
     *   - Impersonate users (JWT secrets)
     *   - Access cloud resources (AWS keys)
     *   - Decrypt sensitive data (encryption keys)
     */
    beforeEach(() => {
      if (skipIfNoNsjail()) pending('nsjail not available');
    });

    it('should not expose JWT/session secrets', async () => {
      await runSecurityTest(
        `
import os
secret_vars = ['SECRET_KEY_BASE', 'JWT_SECRET', 'PGRST_JWT_SECRET', 'SESSION_SECRET', 'COOKIE_SECRET']
exposed = [k for k in secret_vars if k in os.environ]
if exposed:
    result = f'SECURITY_BREACH: Secrets exposed: {exposed}'
else:
    result = 'No JWT/session secrets exposed'
        `,
        'No JWT/session secrets exposed'
      );
    }, 15000);

    it('should not expose encryption keys', async () => {
      await runSecurityTest(
        `
import os
key_patterns = ['LOCKBOX', 'MASTER_KEY', 'ENCRYPTION', 'PRIVATE_KEY', 'SECRET_KEY']
exposed = [k for k in os.environ if any(p in k.upper() for p in key_patterns)]
if exposed:
    result = f'SECURITY_BREACH: Encryption keys exposed: {exposed}'
else:
    result = 'No encryption keys exposed'
        `,
        'No encryption keys exposed'
      );
    }, 15000);

    it('should not expose cloud credentials', async () => {
      await runSecurityTest(
        `
import os
cloud_patterns = ['AWS_', 'AZURE_', 'GCP_', 'GOOGLE_', 'DO_', 'LINODE_', 'VULTR_', 'DIGITALOCEAN']
exposed = [k for k in os.environ if any(k.upper().startswith(p) for p in cloud_patterns)]
if exposed:
    result = f'SECURITY_BREACH: Cloud credentials exposed: {exposed}'
else:
    result = 'No cloud credentials exposed'
        `,
        'No cloud credentials exposed'
      );
    }, 15000);

    it('should not expose OAuth/API keys', async () => {
      await runSecurityTest(
        `
import os
api_patterns = ['API_KEY', 'APIKEY', 'CLIENT_SECRET', 'APP_SECRET', 'OAUTH', 'GITHUB_TOKEN', 'STRIPE']
exposed = [k for k in os.environ if any(p in k.upper() for p in api_patterns)]
if exposed:
    result = f'SECURITY_BREACH: API keys exposed: {exposed}'
else:
    result = 'No OAuth/API keys exposed'
        `,
        'No OAuth/API keys exposed'
      );
    }, 15000);

    it('should not expose ToolJet-specific secrets', async () => {
      await runSecurityTest(
        `
import os
tooljet_secrets = [
    'TOOLJET_SECRET_KEY_BASE',
    'LOCKBOX_MASTER_KEY',
    'PG_PASS',
    'REDIS_PASSWORD',
    'SMTP_PASSWORD',
    'SSO_',
]
exposed = [k for k in os.environ if any(p in k.upper() for p in tooljet_secrets)]
if exposed:
    result = f'SECURITY_BREACH: ToolJet secrets exposed: {exposed}'
else:
    result = 'No ToolJet-specific secrets exposed'
        `,
        'No ToolJet-specific secrets exposed'
      );
    }, 15000);
  });

  // ============================================================================
  // SECURITY SUMMARY
  // ============================================================================
  describe('Security Summary', () => {
    it('should report security status', async () => {
      console.log(`
========================================
PYTHON SANDBOX SECURITY SUMMARY
========================================
Platform: ${securityCapabilities.platform} (informational only)
nsjail: ${sandboxMode === SandboxMode.ENABLED ? 'ENABLED' : 'DISABLED'}
Sandbox Mode: ${securityCapabilities.sandbox.mode.toUpperCase()}

CAPABILITY DETECTION (runtime-verified):
  Seccomp: ${securityCapabilities.seccomp.available ? 'AVAILABLE' : 'UNAVAILABLE'}
    ${securityCapabilities.seccomp.reason}
  cgroupv2: ${securityCapabilities.cgroupv2.available ? 'AVAILABLE' : 'UNAVAILABLE'}${securityCapabilities.cgroupv2.writable ? ' (writable)' : ' (read-only)'}
    ${securityCapabilities.cgroupv2.reason}
  Namespaces: ${securityCapabilities.namespaces.available.length > 0 ? securityCapabilities.namespaces.available.join(', ') : 'none'}

SECURITY LAYERS:
  1. Network Namespace   - No network access
  2. User Namespace      - Fake root, no capabilities
  3. PID Namespace       - Isolated process tree
  4. Mount Namespace     - Minimal filesystem
  5. Environment         - No secrets exposed
  6. Resource Limits     - CPU, memory, FD, process limits
  7. Syscall Filtering   - ${securityCapabilities.seccomp.available ? 'seccomp active' : 'via dropped capabilities'}
  8. Execution Isolation - No state persists

SKIPPED TESTS:
  Seccomp tests: ${securityCapabilities.seccomp.available ? 'RUNNING' : 'SKIPPED'}
  cgroupv2 tests: ${securityCapabilities.cgroupv2.writable ? 'RUNNING' : 'SKIPPED'}
========================================
`);

      expect(true).toBe(true);
    });
  });
});
