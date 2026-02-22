import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import os from 'node:os';

const CONTENT_DIR = 'src/content/posts';
const OUTPUT_FILE = 'src/json/git-history.json';
const MAX_CONCURRENCY = Math.max(1, os.cpus().length - 1); // Leave one core free

// Ensure the directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Recursively find all markdown files
function findMarkdownFiles(dir, baseDir = dir) {
    const files = [];

    if (!fs.existsSync(dir)) {
        return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            // Skip node_modules and hidden directories
            if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
                files.push(...findMarkdownFiles(fullPath, baseDir));
            }
        } else if (entry.isFile()) {
            // Check if file has .md or .mdx extension
            if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
                files.push(fullPath);
            }
        }
    }

    return files;
}

function getGitHistoryAsync(filePath) {
    return new Promise((resolve, reject) => {
        const git = spawn('git', [
            'log',
            '--follow',
            '--pretty=format:%H|%ad|%s',
            '--date=iso',
            '--',
            filePath
        ]);

        let output = '';
        let error = '';

        git.stdout.on('data', (data) => {
            output += data.toString();
        });

        git.stderr.on('data', (data) => {
            error += data.toString();
        });

        git.on('close', (code) => {
            if (code !== 0) {
                console.warn(`Failed to retrieve git history for ${filePath}: ${error}`);
                resolve([]); // Resolve empty on error to keep going
                return;
            }

            if (!output) {
                resolve([]);
                return;
            }

            const history = output
                .split('\n')
                .filter(line => line.trim() !== '')
                .map(line => {
                    // Be careful with split limit, message might contain |
                    // But here we format strict: hash|date|msg
                    const firstPipe = line.indexOf('|');
                    const secondPipe = line.indexOf('|', firstPipe + 1);

                    if (firstPipe === -1 || secondPipe === -1) return null;

                    const hash = line.substring(0, firstPipe);
                    const date = line.substring(firstPipe + 1, secondPipe);
                    const message = line.substring(secondPipe + 1);

                    return { hash, date, message };
                })
                .filter(item => item !== null);

            resolve(history);
        });

        git.on('error', (err) => {
            console.warn(`Git process error for ${filePath}: ${err.message}`);
            resolve([]);
        });
    });
}

async function main() {
    console.log('Generating git history...');
    console.log(`Using concurrency: ${MAX_CONCURRENCY}`);

    // Find all markdown files in the content directory
    const files = findMarkdownFiles(CONTENT_DIR);
    const historyMap = {};
    let processedCount = 0;

    console.log(`Found ${files.length} markdown files.`);

    if (files.length === 0) {
        console.log('No markdown files found. Exiting.');
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify({}, null, 2));
        return;
    }

    // Chunk array for concurrency control
    for (let i = 0; i < files.length; i += MAX_CONCURRENCY) {
        const chunk = files.slice(i, i + MAX_CONCURRENCY);

        const promises = chunk.map(async (file) => {
            // Normalize path to use forward slashes for consistency
            const relativePath = path.relative(CONTENT_DIR, file).replace(/\\/g, '/');

            // Get history
            const history = await getGitHistoryAsync(file);

            // Key by filename/id
            historyMap[relativePath] = history;

            processedCount++;
            if (processedCount % 10 === 0 || processedCount === files.length) {
                process.stdout.write(`\rProcessed ${processedCount}/${files.length} files...`);
            }
        });

        await Promise.all(promises);
    }

    process.stdout.write('\n');

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(historyMap, null, 2));

    console.log(`Git history generated for ${processedCount} files.`);
    console.log(`Output saved to ${OUTPUT_FILE}`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
