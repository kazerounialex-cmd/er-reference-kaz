// Run against a local server with Chromium, Playwright and pdftotext installed.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdirSync, mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const dir = process.env.NOREPI_REVIEW_DIR || mkdtempSync(join(tmpdir(), 'norepi-review-'));
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      // The bare development server has no favicon. Check all app resources.
      if (message.type() === 'error' && !message.location().url.endsWith('/favicon.ico')) {
        errors.push(message.text());
      }
    });
    const base = process.env.ER_REFERENCE_TEST_URL || 'http://127.0.0.1:8000';
    await page.goto(base + '/cri-norepinephrine.html');
    const el = id => page.locator('#' + id);
    const text = id => el(id).innerText();
    const print = async name => {
      const path = join(dir, name + '.pdf');
      await page.pdf({ path, format: 'Letter' });
      return execFileSync('pdftotext', [path, '-'], { encoding: 'utf8' }).replace(/\s+/g, ' ');
    };
    assert.match(await text('prepResult'), /0\.192 mL[\s\S]*11\.808 mL/);
    assert(await page.locator('.norepi-amounts dd').first().evaluate(node => parseFloat(getComputedStyle(node).fontSize)) >= 26);
    assert.equal(await el('norepiPump').inputValue(), '');
    assert.equal(await el('printNorepiChart').isDisabled(), true);

    await el('masterWeight').fill('20');
    assert.match(await text('norepiDelivery'), /3\.75 mL\/hr/);
    await el('norepiConcentrationPreset').focus();
    await page.keyboard.press('ArrowUp');
    assert.equal(await el('norepiConcentrationPreset').inputValue(), '8');
    assert.match(await text('norepiDelivery'), /7\.5 mL\/hr/);
    await el('norepiConcentrationPreset').selectOption('16');
    await el('norepiChartShortcut').focus();
    await page.keyboard.press('Enter');
    assert.equal(await el('previewNorepiChart').getAttribute('aria-expanded'), 'true');
    assert.equal(await el('norepiChartPreview').isVisible(), true);
    const pdf = await print('norepi-titration');
    for (const value of ['Patient weight: 20 kg', 'Stock: 1000 mcg/mL', '0.192 mL', '11.808 mL', '3.75 mL/hr', 'Reference target']) {
      assert(pdf.includes(value), value);
    }
    assert(!pdf.includes('Syringe preparation reference'));
    await page.screenshot({ path: join(dir, 'norepi-desktop.png'), fullPage: true });

    assert.equal(await el('norepiPreset32').evaluate(option => option.disabled), true);
    await el('norepiCentral').focus();
    await page.keyboard.press('Space');
    await el('norepiConcentrationPreset').selectOption('32');
    assert.match(await text('norepiDelivery'), /1\.875 mL\/hr/);
    assert.match(await text('norepiDelivery'), /6\.40 hr/);
    await el('norepiCentral').uncheck();
    assert.equal(await el('norepiConcentrationPreset').inputValue(), '32');
    assert.equal(await el('norepiPump').inputValue(), '');
    assert.equal(await el('printNorepiChart').isDisabled(), true);
    assert.equal(await el('norepiChartPreview').isVisible(), false);
    const blocked = await print('norepi-blocked');
    assert.match(blocked, /Chart unavailable.*Central|Chart unavailable.*Review the concentration/);
    assert.doesNotMatch(blocked, /Reference target|mL\/hr|Norepinephrine stock/);

    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: join(dir, 'norepi-mobile-locked.png'), fullPage: true });
    await el('norepiSwitch').click();
    assert.equal(await el('norepiConcentrationPreset').inputValue(), '16');
    assert.equal(await el('printNorepiChart').isEnabled(), true);

    await page.screenshot({ path: join(dir, 'norepi-mobile.png'), fullPage: true });
    await el('norepiConcentrationPreset').selectOption('custom');
    await el('prepConcentration').fill('32');
    assert.equal(await el('printNorepiChart').isDisabled(), true);
    await el('norepiCentral').check();
    assert.equal(await el('printNorepiChart').isEnabled(), true);
    await el('clearPatient').click();
    assert.equal(await el('norepiCentral').isChecked(), false);
    assert.equal(await el('norepiConcentrationPreset').inputValue(), '16');
    assert.equal(await el('norepiPump').inputValue(), '');
    assert.equal(await el('printNorepiChart').isDisabled(), true);
    assert.deepEqual(errors, []);
    console.log('Norepinephrine Chromium checks passed. Review artifacts: ' + dir);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
