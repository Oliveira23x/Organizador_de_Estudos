const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

async function main() {
  const root = path.resolve(__dirname, '..');
  const config = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
  if (!/^\d+\.\d+\.\d+$/.test(config.version))
    throw new Error('A versão precisa usar o formato 2.0.0.');
  if (!/^[a-zA-Z][a-zA-Z0-9_.]+$/.test(config.android.package))
    throw new Error('Identificador Android inválido.');
  const args = [
    '--yes',
    'eas-cli@27.2.0',
    'build:list',
    '--platform',
    'android',
    '--status',
    'finished',
    '--build-profile',
    'preview',
    '--app-version',
    config.version,
    '--app-identifier',
    config.android.package,
    '--limit',
    '1',
    '--json',
    '--non-interactive',
  ];
  const options = {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    timeout: 120000,
    maxBuffer: 8 * 1024 * 1024,
  };
  // Somente argumentos fixos e os dois valores validados acima chegam ao cmd.exe.
  const stdout =
    process.platform === 'win32'
      ? execFileSync('cmd.exe', ['/d', '/s', '/c', `npx ${args.join(' ')}`], options)
      : execFileSync('npx', args, options);
  const builds = JSON.parse(stdout);
  const build = builds[0];
  if (!build || build.status !== 'FINISHED')
    throw new Error('Não há um build Android concluído para esta versão. Aguarde o EAS terminar.');
  const url = build.artifacts?.applicationArchiveUrl || build.artifacts?.buildUrl;
  if (!url || new URL(url).protocol !== 'https:')
    throw new Error('O EAS não retornou um endereço HTTPS para o APK.');
  const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`O download falhou: HTTP ${response.status}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.readUInt32LE(0) !== 0x04034b50 || !bytes.includes(Buffer.from('AndroidManifest.xml')))
    throw new Error('O artefato recebido não tem a estrutura esperada de um APK.');
  const destination = path.join(root, 'evidencias', 'apk');
  fs.mkdirSync(destination, { recursive: true });
  const filename = `Ritmo-${config.version}.apk`;
  const apkPath = path.join(destination, filename);
  fs.writeFileSync(apkPath, bytes);
  const evidence = {
    generatedBy: 'EAS Build',
    buildId: build.id,
    projectId: build.project?.id || config.extra?.eas?.projectId || null,
    platform: build.platform,
    profile: 'preview',
    appVersion: build.appVersion,
    appIdentifier: config.android.package,
    status: build.status,
    createdAt: build.createdAt,
    completedAt: build.completedAt,
    filename,
    sizeBytes: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    downloadedAt: new Date().toISOString(),
    installationStatus: 'A verificar no dispositivo Android',
  };
  fs.writeFileSync(
    path.join(root, 'evidencias', 'BUILD_EAS.json'),
    JSON.stringify(evidence, null, 2) + '\n',
  );
  console.log(`APK salvo: ${apkPath}`);
  console.log(`Build EAS: ${build.id}`);
  console.log(`SHA-256: ${evidence.sha256}`);
  console.log(
    'Agora instale o APK e preencha evidencias/REGISTRO_DA_INSTALACAO.md com evidências reais.',
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
