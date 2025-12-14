const { test, expect } = require('@playwright/test');
const config = require('../config');

test.describe('Tests de base du site', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.baseURL);
  });

  test('La page devrait se charger sans erreur', async ({ page }) => {
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('Les éléments principaux devraient être présents', async ({ page }) => {
    await expect(page.locator(config.elements.header)).toBeVisible();
    await expect(page.locator(config.elements.mainContent)).toBeVisible();
    await expect(page.locator(config.elements.footer)).toBeVisible();
  });

  test('Le chargement ne devrait pas être infini', async ({ page }) => {
    // Vérifier que l'indicateur de chargement disparaît
    await page.waitForSelector(config.elements.loadingIndicator, { state: 'hidden' }, {
      timeout: config.performance.maxLoadTime
    });

    // Vérifier que le contenu principal est chargé
    const mainContent = await page.locator(config.elements.mainContent);
    await expect(mainContent).toBeVisible();
    await expect(mainContent).not.toBeEmpty();
  });

  test('Les sections principales devraient être accessibles', async ({ page }) => {
    // Naviguer vers chaque section et vérifier qu'elle se charge
    for (const [name, path] of Object.entries(config.pages)) {
      if (name === 'home') continue;

      await page.goto(config.baseURL + path);
      await page.waitForLoadState('networkidle');

      // Vérifier que la section est visible
      const sectionSelector = config.elements[name.replace(/\s+/g, '') + 'Section'] || `#${name}`;
      await expect(page.locator(sectionSelector)).toBeVisible();
    }
  });
});