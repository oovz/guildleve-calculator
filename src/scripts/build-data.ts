
import { execSync } from 'child_process';
import path from 'path';

const SCRIPTS_DIR = path.join(process.cwd(), 'scripts');

function runScript(scriptName: string) {
    console.log(`\n>>> Running ${scriptName}...`);
    try {
        execSync(`pnpm exec tsx ${path.join(SCRIPTS_DIR, scriptName)}`, { stdio: 'inherit' });
    } catch {
        console.error(`Failed to run ${scriptName}`);
        process.exit(1);
    }
}

async function main() {
    console.log('Starting Data Build Pipeline...');

    // 1. Fetch Leves (and references)
    runScript('fetch-leves.ts');

    // 2. Fetch Recipes (reads leves.json, writes recipes.json)
    runScript('fetch-recipes.ts');

    // 3. Fetch Items (reads leves.json AND recipes.json, writes items.json)
    runScript('fetch-items.ts');

    console.log('\n✅ Data Build Complete!');
}

main().catch(console.error);
