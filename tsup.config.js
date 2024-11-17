import { defineConfig } from 'tsup';
import { readdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';

export default defineConfig({
	entry: ['src/lambda/**/*.ts', '!src/lambda/**/*.test.ts'],
	splitting: false,
	// sourcemap: true,
	clean: true,
	format: ['esm'],
	target: 'node20',
	external: ['aws-lambda'],
	outDir: 'dist',
	noExternal: [
		'zod',
		'@zodios/core',
		'@prisma/client',
		'@aws-sdk',
		'uuid',
		// '@aws-sdk/client-cognito-identity-provider',
		// '@aws-sdk/middleware-host-header',
		// '@aws-sdk/middleware-logger'
	], // Add any libraries you want to bundle here
	minify: true, // Enable minification

	// Prisma client requires special handling
	esbuildOptions: (options) => {
		options.bundle = true;
		options.platform = 'node';
		options.target = 'node20';
		options.treeShaking = true; // Ensure tree shaking is enabled
		options.banner = {
			js: `
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
      import { fileURLToPath } from 'url';
      import path from 'path';
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
     `,
		};
	},
	async onSuccess() {
		// Zip each file in the dist directory

		// Function to zip a file
		async function zipFile(filePath, zipPath, newName) {
			const output = createWriteStream(zipPath);
			const archive = archiver('zip', {
				zlib: { level: 9 }, // Sets the compression level.
			});

			output.on('close', () => {
				console.log(`${zipPath}: ${archive.pointer()} total bytes`);
			});

			archive.on('error', (err) => {
				throw err;
			});

			archive.pipe(output);
			archive.file(filePath, { name: newName || path.basename(filePath) });
			await archive.finalize();
		}

		// Recursive function to traverse directories and zip files
		async function traverseAndZip(dir) {
			const entries = await readdir(dir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);

				if (entry.isDirectory()) {
					await traverseAndZip(fullPath);
				} else {
					const dir = path.dirname(fullPath);
					const baseName = path.basename(fullPath, path.extname(fullPath));
					const zipPath = `${path.join(dir, baseName)}.zip`;
					await zipFile(fullPath, zipPath, 'index.mjs');
				}
			}
		}

		// Start traversing and zipping from the dist directory
		await traverseAndZip('dist');
	},
});
