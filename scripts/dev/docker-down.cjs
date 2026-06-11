const { join } = require('path');
const { spawnSync } = require('child_process');

const root = join(__dirname, '..', '..');
const compose = spawnSync('docker', ['compose', 'down'], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
});
process.exit(compose.status ?? 0);
