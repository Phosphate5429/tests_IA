module.exports = {
  // Configuration pour les tests Playwright
  baseURL: 'https://phosphate5429.github.io/tests_IA/',
  timeout: 30000,
  headless: true,
  slowMo: 50,
  viewport: {
    width: 1280,
    height: 800
  },

  // Pages à tester
  pages: {
    home: '/',
    creativeCoding: '/#creative-coding',
    aimTrainer: '/#aim-trainer',
    sortingVisualizer: '/#sorting-visualizer',
    audioVisualizer: '/#audio-visualizer',
    uiShowcase: '/#ui-showcase'
  },

  // Éléments à vérifier
  elements: {
    header: 'header',
    footer: 'footer',
    mainContent: 'main',
    loadingIndicator: '.loading-indicator',
    creativeCodingCanvas: '#particle-canvas',
    aimTrainerGame: '#aim-trainer-game',
    sortingVisualizer: '#sorting-visualizer',
    audioVisualizer: '#audio-visualizer',
    uiShowcase: '#ui-showcase',
    themeToggle: '#theme-toggle',
    languageSwitcher: '#language-switcher'
  },

  // Tests de performance
  performance: {
    maxLoadTime: 5000, // 5 secondes
    minFPS: 30,
    maxLayoutShift: 0.1
  }
};