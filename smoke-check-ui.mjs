import { chromium } from '/home/lich/.hermes/node/lib/node_modules/playwright/index.mjs';

const BASE = 'http://213.199.56.120:3001';

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext();

  // /studio — check for tabs, prompt, model selector
  {
    const page = await context.newPage();
    await page.goto(BASE + '/studio', { waitUntil: 'load', timeout: 10000 });
    const tabs = await page.locator('[role="tab"], button').allTextContents();
    const hasInput = await page.locator('input[type="text"], textarea').count();
    const bodyText = await page.locator('body').innerText();
    console.log('\n=== /studio UI ===');
    console.log('Interactive elements:', tabs.slice(0, 15).join(', '));
    console.log('Text inputs found:', hasInput);
    console.log('Has "Image" or "Video" or "Prompt":', /Image|Video|Prompt|Create/i.test(bodyText));
    await page.close();
  }

  // /settings — check for API key form
  {
    const page = await context.newPage();
    await page.goto(BASE + '/settings', { waitUntil: 'load', timeout: 10000 });
    const inputs = await page.locator('input[type="password"], input[type="text"]').count();
    const bodyText = await page.locator('body').innerText();
    console.log('\n=== /settings UI ===');
    console.log('Input fields found:', inputs);
    console.log('Has "API" or "key" text:', /API|key|KEY/i.test(bodyText));
    await page.close();
  }

  // /pipeline — check for dashboard elements
  {
    const page = await context.newPage();
    await page.goto(BASE + '/pipeline', { waitUntil: 'load', timeout: 10000 });
    const bodyText = await page.locator('body').innerText();
    console.log('\n=== /pipeline UI ===');
    console.log('Has "pipeline" or "dashboard" or "orchestrat" text:', /pipeline|dashboard|orchestrat|node|flow/i.test(bodyText));
    console.log('Visible text sample:', bodyText.slice(0, 300).replace(/\s+/g, ' '));
    await page.close();
  }

  await browser.close();
})();
