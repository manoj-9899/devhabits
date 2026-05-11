#!/usr/bin/env node
// scripts/install-aliases.js
// ─────────────────────────────────────────────────────────────────────────────
// Installs small, guarded shell aliases/functions for daily DevHabits use.
//
// The script only edits a clearly marked block:
//   # >>> devhabits aliases >>>
//   ...
//   # <<< devhabits aliases <<<
//
// Usage:
//   npm run aliases:install
//   npm run aliases:remove
// ─────────────────────────────────────────────────────────────────────────────
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const START = '# >>> devhabits aliases >>>';
const END = '# <<< devhabits aliases <<<';
const remove = process.argv.includes('--remove');

const C = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function stripExistingBlock(text) {
  const pattern = new RegExp(`\\n?${escapeRegex(START)}[\\s\\S]*?${escapeRegex(END)}\\n?`, 'g');
  return text.replace(pattern, '\n').trimEnd();
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function powershellProfilePath() {
  if (process.env.DEVHABITS_ALIAS_PROFILE) return process.env.DEVHABITS_ALIAS_PROFILE;
  const ps = spawnSync(
    'powershell',
    ['-NoProfile', '-Command', '$PROFILE'],
    { encoding: 'utf8' }
  );
  const out = (ps.stdout || '').trim();
  if (ps.status === 0 && out) return out;

  // Fallback for machines where PowerShell isn't on PATH but Node is running
  // on Windows anyway.
  return path.join(os.homedir(), 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1');
}

function unixShellProfilePath() {
  if (process.env.DEVHABITS_ALIAS_PROFILE) return process.env.DEVHABITS_ALIAS_PROFILE;
  const shell = process.env.SHELL || '';
  const home = os.homedir();
  if (shell.includes('zsh')) return path.join(home, '.zshrc');
  if (shell.includes('fish')) return path.join(home, '.config', 'fish', 'config.fish');
  return path.join(home, '.bashrc');
}

function aliasTarget() {
  if (process.platform === 'win32') {
    return {
      file: powershellProfilePath(),
      kind: 'PowerShell',
      block: [
        START,
        '# DevHabits daily-use shortcuts. Re-run `npm run aliases:install` to refresh.',
        'function hl  { habit @args }',
        'function hq  { habit quick @args }',
        'function hm  { habit morning @args }',
        'function hui { habit ui @args }',
        'function hd  { habit done @args }',
        'function hs  { habit skip @args }',
        'function hx  { habit miss @args }',
        'function hw  { habit week @args }',
        'function hy  { habit year @args }',
        '',
        '# Show a compact morning brief when a new shell opens.',
        '# Disable anytime with:  $env:DEVHABITS_NO_MORNING = "1"',
        'if (-not $env:DEVHABITS_NO_MORNING) { habit morning --compact 2>$null }',
        END,
        '',
      ].join('\n'),
      reloadHint: '. $PROFILE',
    };
  }

  const file = unixShellProfilePath();
  const isFish = file.endsWith('config.fish');
  if (isFish) {
    return {
      file,
      kind: 'fish',
      block: [
        START,
        '# DevHabits daily-use shortcuts. Re-run `npm run aliases:install` to refresh.',
        'function hl;  habit $argv; end',
        'function hq;  habit quick $argv; end',
        'function hm;  habit morning $argv; end',
        'function hui; habit ui $argv; end',
        'function hd;  habit done $argv; end',
        'function hs;  habit skip $argv; end',
        'function hx;  habit miss $argv; end',
        'function hw;  habit week $argv; end',
        'function hy;  habit year $argv; end',
        '',
        '# Show a compact morning brief when a new shell opens.',
        '# Disable anytime with:  set -Ux DEVHABITS_NO_MORNING 1',
        'if test -z "$DEVHABITS_NO_MORNING"; and type -q habit',
        '  habit morning --compact 2>/dev/null',
        'end',
        END,
        '',
      ].join('\n'),
      reloadHint: `source ${file}`,
    };
  }

  return {
    file,
    kind: path.basename(file),
    block: [
      START,
      '# DevHabits daily-use shortcuts. Re-run `npm run aliases:install` to refresh.',
      'hl()  { habit "$@"; }',
      'hq()  { habit quick "$@"; }',
      'hm()  { habit morning "$@"; }',
      'hui() { habit ui "$@"; }',
      'hd()  { habit done "$@"; }',
      'hs()  { habit skip "$@"; }',
      'hx()  { habit miss "$@"; }',
      'hw()  { habit week "$@"; }',
      'hy()  { habit year "$@"; }',
      '',
      '# Show a compact morning brief when a new shell opens.',
      '# Disable anytime with:  export DEVHABITS_NO_MORNING=1',
      'if [ -z "$DEVHABITS_NO_MORNING" ] && command -v habit >/dev/null 2>&1; then',
      '  habit morning --compact 2>/dev/null',
      'fi',
      END,
      '',
    ].join('\n'),
    reloadHint: `source ${file}`,
  };
}

function main() {
  const target = aliasTarget();
  ensureDir(target.file);

  const current = fs.existsSync(target.file)
    ? fs.readFileSync(target.file, 'utf8')
    : '';
  const withoutBlock = stripExistingBlock(current);

  if (remove) {
    fs.writeFileSync(target.file, withoutBlock ? withoutBlock + '\n' : '');
    console.log('');
    console.log(`  ${C.green('✓')} Removed DevHabits aliases from ${C.cyan(target.file)}`);
    console.log('');
    return;
  }

  const next = (withoutBlock ? withoutBlock + '\n\n' : '') + target.block;
  fs.writeFileSync(target.file, next);

  console.log('');
  console.log(`  ${C.green('✓')} Installed DevHabits aliases into ${C.cyan(target.file)}`);
  console.log(`  ${C.gray('Shell:')} ${target.kind}`);
  console.log('');
  console.log(`  ${C.bold('Aliases')}`);
  console.log(`    ${C.cyan('hl')}  → habit`);
  console.log(`    ${C.cyan('hq')}  → habit quick`);
  console.log(`    ${C.cyan('hm')}  → habit morning`);
  console.log(`    ${C.cyan('hui')} → habit ui`);
  console.log(`    ${C.cyan('hd')}  → habit done`);
  console.log(`    ${C.cyan('hs')}  → habit skip`);
  console.log(`    ${C.cyan('hx')}  → habit miss`);
  console.log(`    ${C.cyan('hw')}  → habit week`);
  console.log(`    ${C.cyan('hy')}  → habit year`);
  console.log('');
  console.log(`  ${C.bold('Startup')}`);
  console.log(`    Runs ${C.cyan('habit morning --compact')} when a new shell opens.`);
  console.log(`    Disable with ${C.cyan('DEVHABITS_NO_MORNING=1')} or ${C.cyan('npm run aliases:remove')}.`);
  console.log('');
  console.log(`  ${C.yellow('Restart your shell')} or run: ${C.cyan(target.reloadHint)}`);
  console.log('');
}

main();
