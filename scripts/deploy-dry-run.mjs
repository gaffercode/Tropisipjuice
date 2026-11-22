import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const distDir = resolve(process.cwd(), 'dist');
const indexPath = resolve(distDir, 'index.html');

if (!existsSync(distDir) || !existsSync(indexPath)) {
  console.error('Deploy dry-run failed: dist/index.html missing. Run pnpm build first.');
  process.exit(1);
}

const stats = statSync(indexPath);
console.log(`Tropisip deploy dry-run OK: dist/index.html (${stats.size} bytes) ready for static hosting.`);
