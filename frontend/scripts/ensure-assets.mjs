import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(scriptDir, '..');
const rootDir = path.resolve(frontendDir, '..');

const requiredAssets = [
  path.join(frontendDir, 'public', 'circuits', 'voting_eligibility.wasm'),
  path.join(frontendDir, 'public', 'circuits', 'voting_eligibility_final.zkey'),
  path.join(frontendDir, 'public', 'circuits', 'verification_key.json'),
  path.join(frontendDir, 'public', 'deployments', 'addresses.json'),
];

const rootSyncScript = path.join(rootDir, 'scripts', 'sync-frontend-assets.mjs');

if (fs.existsSync(rootSyncScript)) {
  const result = spawnSync(process.execPath, [rootSyncScript], { stdio: 'inherit' });
  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}

const missingAssets = requiredAssets.filter((assetPath) => !fs.existsSync(assetPath));

if (missingAssets.length > 0) {
  console.error('Missing frontend asset files:');
  for (const assetPath of missingAssets) {
    console.error(`- ${path.relative(frontendDir, assetPath)}`);
  }
  process.exit(1);
}

console.log('[ensure-assets] Frontend proof and deployment assets are ready.');
