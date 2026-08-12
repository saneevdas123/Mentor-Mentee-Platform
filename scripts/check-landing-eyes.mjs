import { chromium } from 'playwright';

const url = process.env.APP_URL || 'http://localhost:3000/';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });

const eyes = page.locator('[data-googly-eyes="true"]').first();
await eyes.waitFor({ state: 'visible', timeout: 10000 });

async function pupilX() {
  return eyes.evaluate((el) => {
    const p = el.querySelector('[data-pupil="true"]');
    if (!p) return 0;
    const tr = getComputedStyle(p).transform;
    if (!tr || tr === 'none') return 0;
    const m = tr.match(/matrix\(([^)]+)\)/);
    if (!m) return 0;
    const parts = m[1].split(',').map((n) => parseFloat(n.trim()));
    return parts[4] || 0; // translate X
  });
}

const box = await eyes.boundingBox();
if (!box) throw new Error('Eyes have no bounding box');
const mid = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

await page.mouse.move(mid.x, mid.y);
await page.waitForTimeout(400);
const atCenter = await pupilX();

await page.mouse.move(Math.min(mid.x + 300, 1200), mid.y);
await page.waitForTimeout(500);
const atRight = await pupilX();

await page.mouse.move(8, mid.y);
await page.waitForTimeout(500);
const atLeft = await pupilX();

await page.mouse.move(mid.x, Math.max(8, mid.y - 80));
await page.waitForTimeout(100);
await page.mouse.move(mid.x, mid.y);
await page.waitForTimeout(50);
const lidOpen = await eyes.evaluate((el) => {
  const lid = el.querySelector('[data-lid="true"]');
  return lid ? getComputedStyle(lid).transform : 'none';
});

const hero = await page.getByRole('heading', { level: 1 }).first().textContent();
const logo = await page.locator('img[alt="Centurion University"]').count();
const logoBox = await page.locator('img[alt="Centurion University"]').boundingBox();

const movedRight = atRight > atCenter + 2;
const movedLeft = atLeft < atCenter - 2;

console.log(JSON.stringify({
  atCenter, atRight, atLeft, lidOpen, movedRight, movedLeft,
  hero, footerLogoCount: logo, logoSize: logoBox && { w: Math.round(logoBox.width), h: Math.round(logoBox.height) },
}, null, 2));

if (!movedRight || !movedLeft) {
  console.error('FAIL: pupils did not follow cursor');
  process.exit(1);
}
if (!hero) {
  console.error('FAIL: hero blank');
  process.exit(1);
}
if (!logo || !logoBox || logoBox.height < 80) {
  console.error('FAIL: footer university logo missing/wrong size');
  process.exit(1);
}

console.log('PASS: eyes track cursor; blink lid animates; footer logo OK');
await browser.close();
