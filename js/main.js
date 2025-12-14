/**
 * MAIN.JS - Module coordinateur principal
 * 
 * Responsabilités :
 * - Initialisation de l'application
 * - Coordination des modules
 * - Gestion des événements globaux
 * - Gestion des états de l'application
 * 
 * Pattern : Revealing Module Pattern
 */

const App = (() => {
    // =============================================================================
    // VARIABLES PRIVÉES
    // =============================================================================
    
    let currentSection = 0;
    let isInitialized = false;
    let isLowSpec = false;
    let theme = 'dark';
    let language = 'en';
    
    // Références aux éléments DOM
    const elements = {
        themeToggle: null,
        langToggle: null,
        perfToggle: null,
        navProgress: null,
        sections: [],
        loadingOverlay: null
    };
    
    // =============================================================================
    // INITIALISATION
    // =============================================================================
    
    /**
     * Initialise l'application
     */
    const init = async () => {
        if (isInitialized) return;
        
        console.log('🚀 Initializing Ultimate Showcase V3...');
        
        // Récupérer les éléments DOM
        cacheElements();
        
        // Attendre que les dépendances critiques soient chargées
        try {
            await waitForDependencies();
        } catch (error) {
            console.warn('⚠️ Some dependencies failed to load, continuing with fallback...');
        }
        
        // Initialiser les modules
        initializeModules();
        
        // Configurer les écouteurs d'événements
        bindEvents();
        
        // Restaurer les préférences utilisateur
        restorePreferences();
        
        // Masquer le loading overlay
        hideLoadingOverlay();
        
        isInitialized = true;
        
        console.log('✅ Application initialized successfully');
    };
    
    /**
     * Met en cache les références aux éléments DOM
     */
    const cacheElements = () => {
        elements.themeToggle = document.getElementById('theme-toggle');
        elements.langToggle = document.getElementById('lang-toggle');
        elements.perfToggle = document.getElementById('perf-toggle');
        elements.navProgress = document.querySelector('.progress-bar');
        elements.sections = document.querySelectorAll('.section');
        elements.loadingOverlay = document.getElementById('loading-overlay');
    };
    
    /**
     * Attend que les dépendances critiques soient chargées
     * @returns {Promise<void>}
     */
    const waitForDependencies = () => {
        return new Promise((resolve, reject) => {
            const dependencies = {
                gsap: typeof gsap !== 'undefined',
                THREE: typeof THREE !== 'undefined',
                Chart: typeof Chart !== 'undefined'
            };
            
            const maxWaitTime = 10000; // 10 secondes maximum
            const checkInterval = 100; // Vérifier toutes les 100ms
            let elapsedTime = 0;
            
            const checkDependencies = () => {
                // Mettre à jour les états des dépendances
                dependencies.gsap = typeof gsap !== 'undefined';
                dependencies.THREE = typeof THREE !== 'undefined';
                dependencies.Chart = typeof Chart !== 'undefined';
                
                // Vérifier si toutes les dépendances critiques sont chargées
                if (dependencies.THREE && dependencies.gsap) {
                    console.log('✅ Critical dependencies loaded:', dependencies);
                    resolve();
                    return;
                }
                
                elapsedTime += checkInterval;
                
                // Timeout après le temps maximum
                if (elapsedTime >= maxWaitTime) {
                    console.warn('⚠️ Dependencies loading timeout:', dependencies);
                    // Resolve quand même pour ne pas bloquer l'application
                    resolve();
                    return;
                }
                
                // Continuer à vérifier
                setTimeout(checkDependencies, checkInterval);
            };
            
            // Démarrer la vérification
            setTimeout(checkDependencies, checkInterval);
        });
    };
    
    /**
     * Initialise les modules externes
     */
    const initializeModules = () => {
        // Initialiser les modules dans l'ordre avec des gardes de sécurité
        if (window.Performance && typeof Performance.init === 'function') {
            try {
                Performance.init();
                isLowSpec = Performance.isLowSpec();
            } catch (error) {
                console.error('❌ Failed to initialize Performance module:', error);
            }
        }
        
        if (window.Accessibility && typeof Accessibility.init === 'function') {
            try {
                Accessibility.init();
            } catch (error) {
                console.error('❌ Failed to initialize Accessibility module:', error);
            }
        }
        
        if (window.i18n && typeof i18n.init === 'function') {
            try {
                i18n.init(language);
            } catch (error) {
                console.error('❌ Failed to initialize i18n module:', error);
            }
        }
        
        if (window.Effects && typeof Effects.init === 'function') {
            try {
                Effects.init();
            } catch (error) {
                console.error('❌ Failed to initialize Effects module:', error);
            }
        }
        
        // Initialiser les modules de sections (lazy loading)
        initializeSectionModules();
    };
    
    /**
     * Initialise les modules de sections spécifiques
     */
    const initializeSectionModules = () => {
        // Observer les sections pour le lazy loading
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    loadSectionModule(sectionId);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        // Observer toutes les sections
        elements.sections.forEach(section => {
            observer.observe(section);
        });
    };
    
    /**
     * Charge le module correspondant à une section
     * @param {string} sectionId - ID de la section
     */
    const loadSectionModule = (sectionId) => {
        switch (sectionId) {
            case 'particles':
                if (window.Visuals && typeof Visuals.init === 'function' && !Visuals.isInitialized()) {
                    try {
                        Visuals.init();
                    } catch (error) {
                        console.error('❌ Failed to initialize Visuals module:', error);
                    }
                }
                break;
                
            case 'game':
                if (window.Game && typeof Game.init === 'function' && !Game.isInitialized()) {
                    try {
                        Game.init();
                    } catch (error) {
                        console.error('❌ Failed to initialize Game module:', error);
                    }
                }
                break;
                
            case 'sorting':
                // Le sorting visualizer est géré dans le HTML
                break;
                
            case 'audio':
                if (window.Audio && typeof Audio.init === 'function' && !Audio.isInitialized()) {
                    try {
                        Audio.init();
                    } catch (error) {
                        console.error('❌ Failed to initialize Audio module:', error);
                    }
                }
                break;
                
            case 'ui':
                // L'UI showcase est purement CSS/HTML
                break;
        }
    };
    
    // =============================================================================
    // GESTION DES ÉVÉNEMENTS
    // =============================================================================
    
    /**
     * Configure les écouteurs d'événements
     */
    const bindEvents = () => {
        // Événements de navigation
        window.addEventListener('scroll', throttle(handleScroll, 16));
        window.addEventListener('resize', debounce(handleResize, 250));
        
        // Événements de contrôle
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', handleThemeToggle);
        }
        
        if (elements.langToggle) {
            elements.langToggle.addEventListener('click', handleLangToggle);
        }
        
        if (elements.perfToggle) {
            elements.perfToggle.addEventListener('click', handlePerfToggle);
        }
        
        // Événements personnalisés
        document.addEventListener('lowSpecDetected', handleLowSpecDetected);
        document.addEventListener('themeChanged', handleThemeChanged);
        document.addEventListener('languageChanged', handleLanguageChanged);
        
        // Événements de navigation clavier
        document.addEventListener('keydown', handleKeydown);
    };
    
    /**
     * Gère le scroll de la page
     */
    const handleScroll = () => {
        updateNavigationProgress();
        updateActiveSection();
    };
    
    /**
     * Gère le redimensionnement de la fenêtre
     */
    const handleResize = () => {
        // Notifier les modules de sections avec des gardes de sécurité
        if (window.Visuals && Visuals.isInitialized() && typeof Visuals.handleResize === 'function') {
            try {
                Visuals.handleResize();
            } catch (error) {
                console.error('❌ Error in Visuals.handleResize:', error);
            }
        }
        
        if (window.Game && Game.isInitialized() && typeof Game.handleResize === 'function') {
            try {
                Game.handleResize();
            } catch (error) {
                console.error('❌ Error in Game.handleResize:', error);
            }
        }
        
        if (window.Audio && Audio.isInitialized() && typeof Audio.handleResize === 'function') {
            try {
                Audio.handleResize();
            } catch (error) {
                console.error('❌ Error in Audio.handleResize:', error);
            }
        }
    };
    
    /**
     * Gère le changement de thème
     */
    const handleThemeToggle = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };
    
    /**
     * Gère le changement de langue
     */
    const handleLangToggle = () => {
        const newLang = language === 'en' ? 'fr' : 'en';
        setLanguage(newLang);
    };
    
    /**
     * Gère le toggle du mode performance
     */
    const handlePerfToggle = () => {
        if (window.Performance && typeof Performance.manualToggle === 'function') {
            try {
                Performance.manualToggle();
            } catch (error) {
                console.error('❌ Error in Performance.manualToggle:', error);
            }
        }
    };
    
    /**
     * Gère la détection du mode low-spec
     * @param {CustomEvent} event
     */
    const handleLowSpecDetected = (event) => {
        isLowSpec = true;
        showLowSpecNotification();
    };
    
    /**
     * Gère le changement de thème
     * @param {CustomEvent} event
     */
    const handleThemeChanged = (event) => {
        theme = event.detail.theme;
        updateThemeToggle();
    };
    
    /**
     * Gère le changement de langue
     * @param {CustomEvent} event
     */
    const handleLanguageChanged = (event) => {
        language = event.detail.language;
        updateLangToggle();
    };
    
    /**
     * Gère la navigation au clavier
     * @param {KeyboardEvent} event
     */
    const handleKeydown = (event) => {
        // La navigation clavier est gérée par le module Accessibility
        if (window.Accessibility && typeof Accessibility.handleKeydown === 'function') {
            try {
                Accessibility.handleKeydown(event);
            } catch (error) {
                console.error('❌ Error in Accessibility.handleKeydown:', error);
            }
        }
    };
    
    // =============================================================================
    // GESTION DU THÈME
    // =============================================================================
    
    /**
     * Définit le thème de l'application
     * @param {string} newTheme - 'dark' ou 'light'
     */
    const setTheme = (newTheme) => {
        if (newTheme === theme) return;
        
        // Ajouter une classe pour désactiver les transitions pendant le changement
        document.documentElement.classList.add('theme-changing');
        
        // Mettre à jour l'attribut data-theme
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Mettre à jour le localStorage
        localStorage.setItem('preferredTheme', newTheme);
        
        // Mettre à jour le bouton
        updateThemeToggle();
        
        // Déclencher un événement personnalisé
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: newTheme }
        }));
        
        // Retirer la classe après un court délai
        setTimeout(() => {
            document.documentElement.classList.remove('theme-changing');
        }, 300);
        
        theme = newTheme;
    };
    
    /**
     * Met à jour l'apparence du bouton de thème
     */
    const updateThemeToggle = () => {
        if (!elements.themeToggle) return;
        
        const icon = elements.themeToggle.querySelector('.theme-icon');
        const isPressed = theme === 'dark';
        
        elements.themeToggle.setAttribute('aria-pressed', isPressed.toString());
        
        if (icon) {
            icon.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
    };
    
    // =============================================================================
    // GESTION DE LA LANGUE
    // =============================================================================
    
    /**
     * Définit la langue de l'application
     * @param {string} newLang - 'en' ou 'fr'
     */
    const setLanguage = (newLang) => {
        if (newLang === language) return;
        
        if (window.i18n && typeof i18n.switchLanguage === 'function') {
            try {
                i18n.switchLanguage(newLang);
                language = newLang;
                updateLangToggle();
            } catch (error) {
                console.error('❌ Error in i18n.switchLanguage:', error);
            }
        }
    };
    
    /**
     * Met à jour l'apparence du bouton de langue
     */
    const updateLangToggle = () => {
        if (!elements.langToggle) return;
        
        const langText = elements.langToggle.querySelector('.lang-text');
        if (langText) {
            langText.textContent = language.toUpperCase();
        }
    };
    
    // =============================================================================
    // GESTION DE LA NAVIGATION
    // =============================================================================
    
    /**
     * Met à jour la barre de progression de navigation
     */
    const updateNavigationProgress = () => {
        if (!elements.navProgress) return;
        
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        
        elements.navProgress.style.width = `${scrollPercent}%`;
    };
    
    /**
     * Met à jour la section active
     */
    const updateActiveSection = () => {
        const scrollPosition = window.pageYOffset + window.innerHeight / 2;
        
        elements.sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                if (currentSection !== index) {
                    currentSection = index;
                    highlightNavigationItem(index);
                }
            }
        });
    };
    
    /**
     * Met en évidence l'élément de navigation actif
     * @param {number} sectionIndex
     */
    const highlightNavigationItem = (sectionIndex) => {
        const navLinks = document.querySelectorAll('.nav-menu a');
        
        navLinks.forEach((link, index) => {
            if (index === sectionIndex) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
            }
        });
    };
    
    // =============================================================================
    // GESTION DES PRÉFÉRENCES
    // =============================================================================
    
    /**
     * Restaure les préférences utilisateur depuis le localStorage
     */
    const restorePreferences = () => {
        // Restaurer le thème
        const savedTheme = localStorage.getItem('preferredTheme');
        if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
            setTheme(savedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            setTheme('light');
        }
        
        // Restaurer la langue
        const savedLang = localStorage.getItem('preferredLang');
        if (savedLang && (savedLang === 'en' || savedLang === 'fr')) {
            setLanguage(savedLang);
        } else {
            const browserLang = navigator.language.split('-')[0];
            setLanguage(browserLang === 'fr' ? 'fr' : 'en');
        }
    };
    
    // =============================================================================
    // NOTIFICATIONS
    // =============================================================================
    
    /**
     * Affiche la notification de mode low-spec
     */
    const showLowSpecNotification = () => {
        const notification = document.getElementById('low-spec-notification');
        if (notification) {
            notification.style.display = 'flex';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 5000);
        }
    };
    
    /**
     * Masque le loading overlay
     */
    const hideLoadingOverlay = () => {
        if (elements.loadingOverlay) {
            setTimeout(() => {
                elements.loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    elements.loadingOverlay.style.display = 'none';
                }, 300);
            }, 1000);
        }
    };
    
    // =============================================================================
    // UTILITAIRES
    // =============================================================================
    
    /**
     * Limite la fréquence d'exécution d'une fonction
     * @param {Function} func
     * @param {number} limit
     * @returns {Function}
     */
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Retarde l'exécution d'une fonction
     * @param {Function} func
     * @param {number} delay
     * @returns {Function}
     */
    function debounce(func, delay) {
        let inDebounce;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(inDebounce);
            inDebounce = setTimeout(() => func.apply(context, args), delay);
        };
    }
    
    // =============================================================================
    // API PUBLIQUE
    // =============================================================================
    
    return {
        // Initialisation
        init,
        
        // Getters
        getCurrentSection: () => currentSection,
        getTheme: () => theme,
        getLanguage: () => language,
        isLowSpec: () => isLowSpec,
        isInitialized: () => isInitialized,
        
        // Setters
        setTheme,
        setLanguage,
        
        // Utilitaires
        throttle,
        debounce
    };
})();

// =============================================================================
// INITIALISATION AU CHARGEMENT DU DOM
// =============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
} else {
    App.init();
}

// =============================================================================
// EXPORT POUR LES TESTS ET LA DÉBUGAGE
// =============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
} else {
    window.App = App;
}