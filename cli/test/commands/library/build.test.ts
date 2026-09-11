import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import Build from '../../../src/commands/library/build';
import { runCommand } from '../../helpers/run-command';
import {
  withTempCwd,
  writeValidProjectFixture,
  writeTsErrorProjectFixture,
  writeEmptyProjectFixture,
} from '../../helpers/fixtures';

describe('library build', () => {
  const cwd = withTempCwd();

  it('builds a valid project to dist/ with no auth or network calls', async () => {
    writeValidProjectFixture(cwd.get());

    const result = await runCommand(Build);

    expect(result.exitCode).to.be.undefined;
    expect(fs.existsSync(path.join(cwd.get(), 'dist', 'index.js'))).to.be.true;

    const manifest = JSON.parse(fs.readFileSync(path.join(cwd.get(), 'dist', 'manifest.json'), 'utf8'));
    expect(Object.keys(manifest.components)).to.deep.equal(['HelloWorld']);
    expect(result.stdout).to.include('Bundle built: dist/index.js');
    expect(result.stdout).to.include('1 components');
  }).timeout(30000);

  it('sets process.exitCode = 1 (without calling process.exit) when the build has TS errors', async () => {
    writeTsErrorProjectFixture(cwd.get());
    const originalExitCode = process.exitCode;

    const result = await runCommand(Build);

    expect(result.exitCode).to.be.undefined;
    expect(process.exitCode).to.equal(1);
    expect(result.stdout).to.match(/TypeScript compiled \(\d+ errors\)/);

    process.exitCode = originalExitCode;
  }).timeout(30000);

  it('reports 0 components without failing when nothing is exported', async () => {
    writeEmptyProjectFixture(cwd.get());
    const originalExitCode = process.exitCode;

    const result = await runCommand(Build);

    expect(result.stdout).to.include('0 components');
    expect(process.exitCode).to.not.equal(1);

    process.exitCode = originalExitCode;
  }).timeout(30000);
});
