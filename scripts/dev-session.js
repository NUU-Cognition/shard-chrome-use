#!/usr/bin/env node
// flint shard cu session [list|assign|release] [args]
//   list                              show live chrome-use sessions and which Orbh session holds each
//   assign <name> [--session <id>]    claim a chrome-use session name for an Orbh session (default: this one)
//   release [--session <id>]          drop the Orbh session's claim
//
// A "chrome-use session" is a name passed as `--session <name>`. It maps to one coloured
// Chrome tab group and one daemon worker, so two agents on one name clobber each other.
// The claim is the `chrome-use` key on the Orbh session interface — visible in
// `flint orbh inspect`, gone when the session ends. This script only records the claim;
// driving is unwrapped (`chrome-use --session <name> ...`). See knw-cu-shared_chrome.
'use strict';
const { spawnSync } = require('child_process');

const CLAIM_KEY = 'chrome-use';

// `out` is stdout ONLY — anything on stderr (node warnings, NO_COLOR notices) would
// otherwise be concatenated into a parsed value and silently break comparisons.
function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  const out = (r.stdout || '').trim();
  const err = (r.stderr || '').trim();
  return { ok: r.status === 0, out, err, msg: [out, err].filter(Boolean).join('\n') };
}

function liveSessions() {
  const r = run('chrome-use', ['session', 'list', '--json']);
  if (!r.ok) return [];
  try {
    const d = JSON.parse(r.out);
    return Array.isArray(d.sessions) ? d.sessions : [];
  } catch {
    return [];
  }
}

function orbhSessions() {
  const r = run('flint', ['orbh', 'active', '--json']);
  if (!r.ok) return [];
  try { const d = JSON.parse(r.out); return d.sessions || d || []; } catch { return []; }
}

function claimOf(sessionId) {
  const r = run('flint', ['orbh', 'session', sessionId, 'get', CLAIM_KEY]);
  return r.ok ? r.out : '';
}

function claims() {
  const out = [];
  for (const s of orbhSessions()) {
    const name = claimOf(s.id);
    if (name) out.push({ session: s, name });
  }
  return out;
}

function list() {
  const live = liveSessions();
  const held = claims();
  const holder = (name) => held.filter(c => c.name === name)
    .map(c => `${c.session.shortId} "${c.session.title}"`).join(', ');

  console.log('chrome-use sessions\n');
  if (!live.length) {
    console.log('  (none running — start one with `chrome-use --session <name> open <url>`)');
  } else {
    for (const s of live) {
      const h = holder(s.name);
      const owner = s.owner === 'user' ? '  [HANDED OFF TO THE OPERATOR]' : '';
      console.log(`  ${s.name}  (pid ${s.pid})  ${h ? `→ claimed by ${h}` : '(unclaimed)'}${owner}`);
    }
  }

  const stale = held.filter(c => !live.some(s => s.name === c.name));
  for (const c of stale) {
    console.log(`  ⚠ ${c.session.shortId} "${c.session.title}" claims "${c.name}" but no such session is running`);
  }
}

function assign(name, target) {
  if (!name) { console.error('Usage: flint shard cu session assign <name> [--session <orbh-id>]'); process.exit(1); }
  if (!target) { console.error('No target session — pass --session <orbh-id> or run inside an Orbh session.'); process.exit(1); }

  if (!liveSessions().some(s => s.name === name)) {
    console.log(`⚠ "${name}" is not running — claiming anyway (start it with \`chrome-use --session ${name} open <url>\`).`);
  }
  for (const c of claims()) {
    if (c.name === name && c.session.id !== target && !c.session.id.startsWith(target)) {
      console.log(`⚠ "${name}" is already claimed by ${c.session.shortId} "${c.session.title}" — reclaiming. Coordinate if that session is live.`);
    }
  }

  const r = run('flint', ['orbh', 'session', target, 'set', CLAIM_KEY, name]);
  if (!r.ok) { console.error(`failed to set the ${CLAIM_KEY} key: ${r.msg}`); process.exit(1); }
  console.log(`✓ claimed "${name}" for session ${target}`);
  console.log(`  drive it with:  chrome-use --session ${name} <command>`);
}

function release(target) {
  if (!target) { console.error('No target session — pass --session <orbh-id> or run inside an Orbh session.'); process.exit(1); }
  const had = claimOf(target);
  const r = run('flint', ['orbh', 'session', target, 'set', CLAIM_KEY, '']);
  if (!r.ok) { console.error(`failed to clear the ${CLAIM_KEY} key: ${r.msg}`); process.exit(1); }
  console.log(had ? `✓ released "${had}" from session ${target}` : `session ${target} held no claim — nothing to release`);
}

const argv = process.argv.slice(2);
let sessionFlag = null;
const pos = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--session') sessionFlag = argv[++i];
  else pos.push(argv[i]);
}
const cmd = (pos[0] || 'list').toLowerCase();
const target = sessionFlag || process.env.ORBH_SESSION_ID || null;

if (cmd === 'list') list();
else if (cmd === 'assign') assign(pos[1], target);
else if (cmd === 'release') release(target);
else {
  console.error(`Unknown command "${cmd}". Use: list | assign <name> [--session <id>] | release [--session <id>]`);
  process.exit(1);
}
