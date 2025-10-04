import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const pkgPath = path.join(rootDir, 'package.json');
const rawPkg = await readFile(pkgPath, 'utf8');
const pkg = JSON.parse(rawPkg);

const transformExports = value => {
	if (!value || typeof value !== 'object') {
		return value;
	}

	if (Array.isArray(value)) {
		return value.map(transformExports);
	}

	return Object.fromEntries(
		Object.entries(value).map(([key, nested]) => [
			key,
			typeof nested === 'string' ? nested.replace('./dist/', './') : transformExports(nested),
		]),
	);
};

const distPackage = {
	name: pkg.name,
	version: pkg.version,
	description: pkg.description,
	type: pkg.type,
	main: 'index.js',
	module: 'index.js',
	browser: 'index.umd.js',
	types: 'index.d.ts',
	exports: transformExports(pkg.exports),
	author: pkg.author,
	license: pkg.license,
	repository: pkg.repository,
	bugs: pkg.bugs,
	homepage: pkg.homepage,
	keywords: pkg.keywords,
	peerDependencies: pkg.peerDependencies,
	peerDependenciesMeta: pkg.peerDependenciesMeta,
	dependencies: pkg.dependencies,
	sideEffects: pkg.sideEffects,
};

await mkdir(distDir, { recursive: true });
await writeFile(path.join(distDir, 'package.json'), `${JSON.stringify(distPackage, null, 2)}\n`, 'utf8');
