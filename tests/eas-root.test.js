import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { prepareInvocation } = require('../scripts/eas-project.cjs');
const root = fs.realpathSync(fileURLToPath(new URL('..', import.meta.url)));

test('EAS força a raiz do aplicativo mesmo com ambiente herdado apontando para outra pasta', () => {
  const result = prepareInvocation(['build'], {
    env: { EAS_NO_VCS: '0', EAS_PROJECT_ROOT: path.dirname(root) },
    npmCli: process.execPath,
  });
  assert.equal(result.options.cwd, root);
  assert.equal(result.options.env.EAS_NO_VCS, '1');
  assert.equal(result.options.env.EAS_PROJECT_ROOT, root);
  assert.equal(result.command, process.execPath);
  assert.ok(result.args.includes('eas-cli@27.2.0') || result.args.includes('--package=eas-cli@27.2.0'));
});

test('o processo filho recebe a raiz e as variáveis corretas', () => {
  const invocation = prepareInvocation(['build'], { env: { ...process.env, EAS_PROJECT_ROOT: '/' }, npmCli: process.execPath });
  const child = spawnSync(process.execPath, ['-e', 'process.stdout.write(JSON.stringify({cwd:process.cwd(),root:process.env.EAS_PROJECT_ROOT,noVcs:process.env.EAS_NO_VCS}))'], { ...invocation.options, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  assert.equal(child.status, 0);
  const result = JSON.parse(child.stdout);
  assert.deepEqual(result, { cwd: root, root, noVcs: '1' });
});

test('EAS recusa pasta sem os arquivos do projeto', () => {
  assert.throws(() => prepareInvocation(['build'], { root: path.dirname(root), npmCli: process.execPath }), /Arquivo obrigatório ausente|não é o projeto/);
});
