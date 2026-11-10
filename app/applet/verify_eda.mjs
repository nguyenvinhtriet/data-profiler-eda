import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  
  // Take screenshot of main app
  await page.screenshot({ path: '/tmp/main_app.png' });
  console.log('Main app loaded.');
  
  // Open EDA Suite modal
  const edaBtn = page.locator('header button:has-text("EDA Suite")');
  await edaBtn.click();
  await page.waitForTimeout(500);
  
  // Click Tab 4: Bivariate & Visual Chart Suite
  const tab4Btn = page.locator('button:has-text("Bivariate & Charts")');
  await tab4Btn.click();
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: '/tmp/eda_tab4_default.png' });
  console.log('Tab 4 default screenshot captured.');
  
  // Test Sort Axis toggle
  const sortCategoryBtn = page.locator('button:has-text("Tên nhóm (X)")');
  if (await sortCategoryBtn.isVisible()) {
    await sortCategoryBtn.click();
    await page.waitForTimeout(300);
    console.log('Clicked Sort by Category');
  }
  
  const sortDirAscBtn = page.locator('button:has-text("Thấp → Cao (A-Z)")');
  if (await sortDirAscBtn.isVisible()) {
    await sortDirAscBtn.click();
    await page.waitForTimeout(300);
    console.log('Clicked Sort Ascending');
  }
  
  await page.screenshot({ path: '/tmp/eda_tab4_sorted.png' });
  
  // Switch to Bar Chart (Horizontal)
  const barChartTab = page.locator('button:has-text("Bar Chart")');
  await barChartTab.click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/eda_tab4_horizontal_bar.png' });
  console.log('Horizontal bar chart captured.');
  
  // Switch to Scatter Plot and select two numeric fields
  const scatterTab = page.locator('button:has-text("Scatter Plot")');
  await scatterTab.click();
  await page.waitForTimeout(300);
  
  // Select numeric X if not numeric
  const xSelect = page.locator('select').first();
  await xSelect.selectOption('Sales');
  await page.waitForTimeout(300);
  
  const ySelect = page.locator('select').nth(1);
  await ySelect.selectOption('Profit');
  await page.waitForTimeout(300);
  
  await page.screenshot({ path: '/tmp/eda_tab4_scatter.png' });
  console.log('Scatter plot captured.');

  await browser.close();
  console.log('All verification steps finished successfully!');
}

run().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
