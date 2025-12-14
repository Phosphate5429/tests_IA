const { test, expect } = require('@playwright/test');
const config = require('../config');

test.describe('Tests de performance', () => {
  test('La page devrait se charger rapidement', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(config.baseURL);
    const loadTime = Date.now() - startTime;

    console.log(`Temps de chargement: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(config.performance.maxLoadTime);
  });

  test('Les animations devraient fonctionner correctement', async ({ page }) => {
    await page.goto(config.baseURL + config.pages.creativeCoding);

    // Vérifier que le canvas est présent et actif
    const canvas = page.locator(config.elements.creativeCodingCanvas);
    await expect(canvas).toBeVisible();

    // Vérifier que les animations ne provoquent pas de saccades
    // (test basique - une vérification plus approfondie nécessiterait des outils de profiling)
    await page.waitForTimeout(2000); // Laisser le temps aux animations de se stabiliser

    // Vérifier que le canvas est toujours visible et actif
    await expect(canvas).toBeVisible();
  });

  test('Le site devrait être réactif', async ({ page }) => {
    // Tester le changement de thème
    await page.goto(config.baseURL);
    const themeToggle = page.locator(config.elements.themeToggle);
    await themeToggle.click();
    await page.waitForTimeout(500);

    // Tester le changement de langue
    const languageSwitcher = page.locator(config.elements.languageSwitcher);
    await languageSwitcher.click();
    await page.waitForTimeout(500);

    // Vérifier que le site est toujours fonctionnel
    await expect(page.locator(config.elements.mainContent)).toBeVisible();
  });
});