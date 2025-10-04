/* eslint-env node */
import { access } from 'node:fs/promises';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const exampleRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(exampleRoot, '../..');
const distPackagePath = path.join(repoRoot, 'dist', 'package.json');

try {
	await access(distPackagePath);
	process.stdout.write(`📦  esri-gl: using local dist from ${path.relative(exampleRoot, distPackagePath)}\n`);
} catch {
	process.stderr.write('⚠️  esri-gl: local dist build not found. Run "npm run build" from the repository root before installing example dependencies.\n');
	process.exit(1);
}
