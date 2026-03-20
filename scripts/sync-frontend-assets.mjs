import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const frontendPublicDir = path.join(rootDir, 'frontend', 'public');
const circuitsPublicDir = path.join(frontendPublicDir, 'circuits');
const deploymentsPublicDir = path.join(frontendPublicDir, 'deployments');

const assetsToCopy = [
  [
    path.join(rootDir, 'circuits', 'build', 'voting_eligibility_js', 'voting_eligibility.wasm'),
    path.join(circuitsPublicDir, 'voting_eligibility.wasm'),
  ],
  [
    path.join(rootDir, 'circuits', 'build', 'voting_eligibility_final.zkey'),
    path.join(circuitsPublicDir, 'voting_eligibility_final.zkey'),
  ],
  [
    path.join(rootDir, 'circuits', 'build', 'verification_key.json'),
    path.join(circuitsPublicDir, 'verification_key.json'),
  ],
  [
    path.join(rootDir, 'contracts', 'broadcast', 'addresses.json'),
    path.join(deploymentsPublicDir, 'addresses.json'),
  ],
];

fs.mkdirSync(circuitsPublicDir, { recursive: true });
fs.mkdirSync(deploymentsPublicDir, { recursive: true });

for (const [source, destination] of assetsToCopy) {
  if (!fs.existsSync(source)) {
    console.warn(`[sync-frontend-assets] Missing asset: ${source}`);
    continue;
  }

  fs.copyFileSync(source, destination);
  console.log(`[sync-frontend-assets] Copied ${path.relative(rootDir, source)} -> ${path.relative(rootDir, destination)}`);
}
