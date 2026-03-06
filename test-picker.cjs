const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 900 });

  // Navigate to the app
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  // Take initial screenshot
  await page.screenshot({ path: '/tmp/01_initial.png', fullPage: true });
  console.log('✅ Initial page loaded');

  // Find and click the code style button
  const codeStyleButton = page.locator('button:has-text("代码样式")').first();
  await codeStyleButton.click();
  await page.waitForTimeout(500);
  console.log('✅ Clicked code style button');

  // Wait for modal to appear
  await page.waitForSelector('.theme-picker-modal', { timeout: 5000 });
  await page.waitForTimeout(500);

  // Take screenshot of the modal
  await page.screenshot({ path: '/tmp/02_code_style_modal.png', fullPage: true });
  console.log('✅ Code style modal opened');

  // Get all code style cards
  const cards = await page.locator('.theme-card').all();
  console.log(`\n✅ Found ${cards.length} code style cards`);

  // Check each card's preview element
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const cardName = await card.locator('.theme-card-name').innerText();
    const preview = card.locator('.code-style-preview');

    // Check if preview has content by checking its innerHTML
    const previewHTML = await preview.evaluate(el => el.innerHTML);
    console.log(`\nCard ${i + 1}: ${cardName}`);
    console.log(`  Preview HTML length: ${previewHTML.length} chars`);

    // Check if shadow root exists and has content
    const shadowContent = await preview.evaluate(el => {
      if (el.shadowRoot) {
        return {
          hasShadowRoot: true,
          innerHTML: el.shadowRoot.innerHTML.substring(0, 200)
        };
      }
      return { hasShadowRoot: false };
    });
    console.log(`  Has Shadow DOM: ${shadowContent.hasShadowRoot}`);
    if (shadowContent.hasShadowRoot) {
      console.log(`  Shadow content preview: ${shadowContent.innerHTML.substring(0, 100)}...`);
    }
  }

  // Take a focused screenshot of just the modal
  const modal = page.locator('.theme-picker-modal');
  await modal.screenshot({ path: '/tmp/03_modal_focused.png' });
  console.log('\n✅ Saved focused modal screenshot');

  // Close modal with ESC
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/04_after_close.png', fullPage: true });
  console.log('✅ Modal closed with ESC');

  await browser.close();
}

main().then(() => {
  console.log('\n📸 Screenshots saved to /tmp/:');
  console.log('  - 01_initial.png');
  console.log('  - 02_code_style_modal.png');
  console.log('  - 03_modal_focused.png');
  console.log('  - 04_after_close.png');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
