import { chromium } from '/home/lich/.hermes/node/lib/node_modules/playwright/index.mjs';

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
