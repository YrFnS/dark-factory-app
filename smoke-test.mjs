import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolvePlaywright() {
  if (process.env.PLAYWRIGHT_PATH) {
    return process.env.PLAYWRIGHT_PATH;
  }
  // Walk up from this file's directory looking for playwright
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, 'node_modules', 'playwright', 'index.mjs');
    try {
      const { existsSync } = await import('fs');
      if (existsSync(candidate)) {
        return candidate;
      }
    } catch {}
    const parent = join(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('Could not resolve playwright. Set PLAYWRIGHT_PATH env var.');
}

const playwrightPath = await resolvePlaywright();
const { chromium } = await import(playwrightPath);

const BASE = 'http://213.199.56.120:3001';
const pages = ['/studio', '/settings', '/pipeline'];

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext();
  let allOk = true;

  for (const path of pages) {
    const page = await context.newPage();
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(`[pageerror] ${err.message}`));

    let status = null;
    try {
      const res = await page.goto(BASE + path, { waitUntil: 'load', timeout: 10000 });
      status = res?.status();
    } catch (e) {
      status = 'timeout';
    }

    const title = await page.title().catch(() => 'N/A');

    console.log(`\n=== ${path} ===`);
    console.log(`Status: ${status}`);
    console.log(`Title: ${title}`);
    if (errors.length) {
      console.log(`ERRORS: ${errors.join(' | ')}`);
      allOk = false;
    } else {
      console.log('Console errors: none');
    }

    await page.close();
  }

  await browser.close();
  process.exit(allOk ? 0 : 1);
})();
