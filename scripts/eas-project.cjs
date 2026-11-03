const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function prepareInvocation(args, options = {}) {
  // A raiz vem da localização do código, nunca da raiz descoberta pelo Git.
  const root = fs.realpathSync(options.root || path.resolve(__dirname, '..'));
  for (const name of ['package.json', 'app.json', 'eas.json', '.easignore']) {
    if (!fs.existsSync(path.join(root, name))) throw new Error(`Arquivo obrigatório ausente: ${name}. Extraia o projeto completo.`);
  }
  const packageData = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (packageData.name !== 'ritmo-estudos-poo') throw new Error('Esta pasta não é o projeto ritmo-estudos-poo.');
  const inheritedEnv = options.env || process.env;
  const npmCli = options.npmCli || inheritedEnv.npm_execpath;
  if (!npmCli || !fs.existsSync(npmCli)) throw new Error('Execute pelo npm: npm run apk:build.');
  return {
    command: process.execPath,
    args: [npmCli, 'exec', '--yes', '--package=eas-cli@27.2.0', '--', 'eas', ...args],
    options: {
      cwd: root,
      env: { ...inheritedEnv, EAS_NO_VCS: '1', EAS_PROJECT_ROOT: root },
      stdio: 'inherit',
    },
  };
}

function main() {
  try {
    const invocation = prepareInvocation(process.argv.slice(2));
    console.log(`Pasta do projeto: ${invocation.options.cwd}`);
    console.log('EAS_NO_VCS=1; EAS_PROJECT_ROOT definido para a pasta do aplicativo.');
    const result = spawnSync(invocation.command, invocation.args, invocation.options);
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
if (require.main === module) main();
module.exports = { prepareInvocation };
