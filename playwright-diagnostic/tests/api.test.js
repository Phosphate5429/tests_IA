const { test, expect } = require('@playwright/test');
const config = require('../config');
const axios = require('axios');

test.describe('Tests API du site (sans navigateur)', () => {
  test('Le site devrait être accessible', async () => {
    try {
      const response = await axios.get(config.baseURL, {
        timeout: config.performance.maxLoadTime
      });

      expect(response.status).toBe(200);
      expect(response.data).toContain('Ultimate Showcase');
      console.log('✓ Site accessible avec succès');
    } catch (error) {
      console.error('✗ Erreur lors de l\'accès au site:', error.message);
      throw error;
    }
  });

  test('Les ressources statiques devraient se charger', async () => {
    const resources = [
      config.baseURL + 'css/style.css',
      config.baseURL + 'js/main.js',
      config.baseURL + 'i18n/en.json',
      config.baseURL + 'i18n/fr.json'
    ];

    for (const resource of resources) {
      try {
        const response = await axios.head(resource, {
          timeout: config.performance.maxLoadTime
        });
        expect(response.status).toBe(200);
        console.log(`✓ Ressource chargée: ${resource}`);
      } catch (error) {
        console.error(`✗ Erreur lors du chargement de ${resource}:`, error.message);
        throw error;
      }
    }
  });

  test('Le site ne devrait pas avoir de loading infini', async () => {
    const startTime = Date.now();

    try {
      const response = await axios.get(config.baseURL, {
        timeout: config.performance.maxLoadTime
      });

      const loadTime = Date.now() - startTime;
      console.log(`Temps de chargement: ${loadTime}ms`);

      expect(loadTime).toBeLessThan(config.performance.maxLoadTime);
      expect(response.data).not.toContain('loading="true"');
      console.log('✓ Pas de loading infini détecté');
    } catch (error) {
      console.error('✗ Loading infini ou erreur de chargement:', error.message);
      throw error;
    }
  });
});