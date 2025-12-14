/**
 * I18N.JS - Module de gestion de l'internationalisation
 * 
 * Responsabilités :
 * - Chargement des fichiers de traduction
 * - Traduction des textes avec remplacement de paramètres
 * - Mise à jour dynamique de l'interface
 * - Gestion du changement de langue
 * 
 * Pattern : Revealing Module Pattern
 */

const i18n = (() => {
    // =============================================================================
    // VARIABLES PRIVÉES
    // =============================================================================
    
    let currentLang = 'en';
    let translations = {};
    let isInitialized = false;
    
    // =============================================================================
    // INITIALISATION
    // =============================================================================
    
    /**
     * Initialise le module i18n
     * @param {string} lang - Langue par défaut ('en' ou 'fr')
     */
    const init = async (lang = 'en') => {
        if (isInitialized) return;
        
        console.log(`🌍 Initializing i18n with language: ${lang}`);
        
        currentLang = lang;
        await loadTranslations(lang);
        updatePage();
        
        isInitialized = true;
        
        console.log('✅ i18n initialized successfully');
    };
    
    /**
     * Charge les fichiers de traduction
     * @param {string} lang - Langue à charger
     */
    const loadTranslations = async (lang) => {
        try {
            const response = await fetch(`i18n/${lang}.json`);
            
            if (!response.ok) {
                throw new Error(`Failed to load translations for ${lang}`);
            }
            
            translations = await response.json();
            
            console.log(`📝 Translations loaded for ${lang}`);
        } catch (error) {
            console.error('❌ Failed to load translations:', error);
            
            // Fallback vers l'anglais si le chargement échoue
            if (lang !== 'en') {
                console.log('🔄 Falling back to English translations');
                await loadTranslations('en');
            } else {
                // Si même l'anglais échoue, utiliser des traductions vides
                translations = {};
            }
        }
    };
    
    // =============================================================================
    // FONCTIONS DE TRADUCTION
    // =============================================================================
    
    /**
     * Traduit une clé de traduction
     * @param {string} key - Clé de traduction (ex: 'nav.title')
     * @param {Object} params - Paramètres de remplacement (ex: { score: 150 })
     * @returns {string} Texte traduit
     */
    const t = (key, params = {}) => {
        if (!key || typeof key !== 'string') {
            console.warn('⚠️ Invalid translation key:', key);
            return key || '';
        }
        
        // Séparer la clé en segments
        const keys = key.split('.');
        let value = translations;
        
        // Parcourir les segments pour trouver la valeur
        for (const k of keys) {
            if (!value || typeof value !== 'object') {
                break;
            }
            value = value[k];
        }
        
        // Si la traduction n'est pas trouvée, retourner la clé
        if (typeof value !== 'string') {
            console.warn(`⚠️ Translation not found for key: ${key}`);
            return key;
        }
        
        // Remplacer les paramètres dynamiques
        let translatedText = value;
        
        for (const [param, replacement] of Object.entries(params)) {
            const placeholder = new RegExp(`\\{${param}\\}`, 'g');
            translatedText = translatedText.replace(placeholder, replacement);
        }
        
        return translatedText;
    };
    
    /**
     * Traduit plusieurs clés à la fois
     * @param {Array} keys - Tableau de clés de traduction
     * @returns {Object} Objet avec les traductions
     */
    const tMany = (keys) => {
        const result = {};
        
        keys.forEach(key => {
            result[key] = t(key);
        });
        
        return result;
    };
    
    // =============================================================================
    // MISE À JOUR DE L'INTERFACE
    // =============================================================================
    
    /**
     * Met à jour tous les éléments de la page avec les traductions
     */
    const updatePage = () => {
        updateTextElements();
        updateAttributeElements();
        updateSelectOptions();
    };
    
    /**
     * Met à jour les éléments de texte
     */
    const updateTextElements = () => {
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = t(key);
            
            if (text) {
                el.textContent = text;
            }
        });
    };
    
    /**
     * Met à jour les éléments d'attribut
     */
    const updateAttributeElements = () => {
        const elements = document.querySelectorAll('[data-i18n-attr]');
        
        elements.forEach(el => {
            const attrValue = el.getAttribute('data-i18n-attr');
            const [attr, key] = attrValue.split(':');
            const text = t(key);
            
            if (text) {
                el.setAttribute(attr, text);
            }
        });
    };
    
    /**
     * Met à jour les options des selects
     */
    const updateSelectOptions = () => {
        const selects = document.querySelectorAll('select[data-i18n-options]');
        
        selects.forEach(select => {
            const options = select.querySelectorAll('option[data-i18n]');
            
            options.forEach(option => {
                const key = option.getAttribute('data-i18n');
                const text = t(key);
                
                if (text) {
                    option.textContent = text;
                }
            });
        });
    };
    
    // =============================================================================
    // GESTION DU CHANGEMENT DE LANGUE
    // =============================================================================
    
    /**
     * Change la langue de l'application
     * @param {string} lang - Nouvelle langue ('en' ou 'fr')
     */
    const switchLanguage = async (lang) => {
        if (lang === currentLang) return;
        
        console.log(`🔄 Switching language from ${currentLang} to ${lang}`);
        
        // Mettre à jour la direction du texte si nécessaire
        const isRTL = lang === 'ar' || lang === 'he';
        document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
        
        // Charger les nouvelles traductions
        await loadTranslations(lang);
        
        // Mettre à jour la langue courante
        currentLang = lang;
        
        // Mettre à jour la page
        updatePage();
        
        // Sauvegarder la préférence
        localStorage.setItem('preferredLang', lang);
        
        // Déclencher un événement personnalisé
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: lang }
        }));
        
        // Mettre à jour les attributs de langue
        document.documentElement.setAttribute('lang', lang);
        
        console.log(`✅ Language switched to ${lang}`);
    };
    
    /**
     * Obtient la langue actuelle
     * @returns {string} Langue actuelle
     */
    const getCurrentLang = () => currentLang;
    
    /**
     * Obtient la direction du texte
     * @returns {string} 'ltr' ou 'rtl'
     */
    const getTextDirection = () => {
        return document.documentElement.getAttribute('dir') || 'ltr';
    };
    
    // =============================================================================
    // UTILITAIRES
    // =============================================================================
    
    /**
     * Vérifie si une clé de traduction existe
     * @param {string} key - Clé de traduction
     * @returns {boolean} True si la clé existe
     */
    const hasTranslation = (key) => {
        const keys = key.split('.');
        let value = translations;
        
        for (const k of keys) {
            if (!value || typeof value !== 'object' || !(k in value)) {
                return false;
            }
            value = value[k];
        }
        
        return typeof value === 'string';
    };
    
    /**
     * Obtient toutes les traductions disponibles
     * @returns {Object} Objet de traductions
     */
    const getAllTranslations = () => {
        return { ...translations };
    };
    
    /**
     * Ajoute des traductions personnalisées
     * @param {Object} customTranslations - Nouvelles traductions
     */
    const addTranslations = (customTranslations) => {
        translations = {
            ...translations,
            ...customTranslations
        };
        
        updatePage();
    };
    
    /**
     * Formate une date selon la locale
     * @param {Date} date - Date à formater
     * @param {Object} options - Options de formatage
     * @returns {string} Date formatée
     */
    const formatDate = (date, options = {}) => {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        return new Intl.DateTimeFormat(currentLang, finalOptions).format(date);
    };
    
    /**
     * Formate un nombre selon la locale
     * @param {number} number - Nombre à formater
     * @param {Object} options - Options de formatage
     * @returns {string} Nombre formaté
     */
    const formatNumber = (number, options = {}) => {
        const defaultOptions = {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        return new Intl.NumberFormat(currentLang, finalOptions).format(number);
    };
    
    // =============================================================================
    // API PUBLIQUE
    // =============================================================================
    
    return {
        // Initialisation
        init,
        isInitialized: () => isInitialized,
        
        // Traduction
        t,
        tMany,
        hasTranslation,
        
        // Gestion de la langue
        switchLanguage,
        getCurrentLang,
        getTextDirection,
        
        // Utilitaires
        getAllTranslations,
        addTranslations,
        formatDate,
        formatNumber,
        
        // Mise à jour
        updatePage
    };
})();

// =============================================================================
// EXPORT POUR LES TESTS ET LA DÉBUGAGE
// =============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = i18n;
} else {
    window.i18n = i18n;
}