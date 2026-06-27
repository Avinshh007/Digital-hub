const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const binName = process.platform === 'win32' ? 'ng.cmd' : 'ng';
const angularCliBin = join(__dirname, '..', 'node_modules', '.bin', binName);

if (existsSync(angularCliBin)) {
  process.exit(0);
}

const installCommand = existsSync(join(__dirname, '..', 'package-lock.json'))
  ? ['npm', ['ci', '--include=dev']]
  : ['npm', ['install', '--include=dev']];

const result = spawnSync(installCommand[0], installCommand[1], {
  cwd: join(__dirname, '..'),
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
