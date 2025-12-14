/**
 * ACCESSIBILITY.JS - Module de gestion de l'accessibilité
 * 
 * Responsabilités :
 * - Navigation au clavier complète
 * - Gestion du focus
 * - Support des lecteurs d'écran
 * - Contraste et couleurs
 * - Annonces vocales
 * 
 * Pattern : Revealing Module Pattern
 */

const Accessibility = (() => {
    // =============================================================================
    // VARIABLES PRIVÉES
    // =============================================================================
    
    let isInitialized = false;
    let currentFocus = 0;
    let focusableElements = [];
    let isKeyboardUser = false;
    let isHighContrast = false;
    
    // Sélecteurs des éléments focusables
    const FOCUSABLE_SELECTORS = `
        a, button, input, textarea, select, details,
        [tabindex]:not([tabindex="-1"]),
        [contenteditable]:not([contenteditable="false"])
    `;
    
    // =============================================================================
    // INITIALISATION
    // =============================================================================
    
    /**
     * Initialise le module d'accessibilité
     */
    const init = () => {
        if (isInitialized) return;
        
        console.log('♿ Initializing Accessibility Module...');
        
        // Mettre à jour les éléments focusables
        updateFocusableElements();
        
        // Détecter les préférences utilisateur
        detectUserPreferences();
        
        // Configurer les écouteurs d'événements
        bindEvents();
        
        // Appliquer les styles d'accessibilité
        applyAccessibilityStyles();
        
        isInitialized = true;
        
        console.log('✅ Accessibility Module initialized');
    };
    
    /**
     * Met à jour la liste des éléments focusables
     */
    const updateFocusableElements = () => {
        focusableElements = Array.from(document.querySelectorAll(FOCUSABLE_SELECTORS))
            .filter(el => {
                // Filtrer les éléments désactivés et cachés
                return !el.disabled && 
                       el.offsetParent !== null && 
                       window.getComputedStyle(el).visibility !== 'hidden';
            });
        
        console.log(`📋 Found ${focusableElements.length} focusable elements`);
    };
    
    /**
     * Détecte les préférences utilisateur
     */
    const detectUserPreferences = () => {
        // Détecter le mode high contrast
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            isHighContrast = true;
            document.body.classList.add('high-contrast');
        }
        
        // Détecter la préférence de mouvement réduit
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduce-motion');
        }
        
        // Détecter la préférence de couleur
        if (window.matchMedia('(prefers-color-scheme: light)').matches) {
            // Le thème est géré par le module principal
        }
    };
    
    // =============================================================================
    // GESTION DES ÉVÉNEMENTS
    // =============================================================================
    
    /**
     * Configure les écouteurs d'événements
     */
    const bindEvents = () => {
        // Détecter l'utilisation du clavier
        document.addEventListener('keydown', handleFirstTab);
        document.addEventListener('mousedown', handleFirstMouse);
        
        // Navigation au clavier
        document.addEventListener('keydown', handleKeydown);
        
        // Gestion du focus
        document.addEventListener('focus', handleFocus, true);
        document.addEventListener('blur', handleBlur, true);
        
        // Mise à jour des éléments focusables
        const observer = new MutationObserver(() => {
            updateFocusableElements();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['tabindex', 'disabled', 'hidden']
        });
        
        // Surveiller les changements de préférences
        const mediaQueries = [
            '(prefers-contrast: high)',
            '(prefers-reduced-motion: reduce)',
            '(prefers-color-scheme: light)'
        ];
        
        mediaQueries.forEach(query => {
            const mediaQuery = window.matchMedia(query);
            mediaQuery.addEventListener('change', handlePreferenceChange);
        });
    };
    
    /**
     * Détecte la première utilisation du clavier
     * @param {KeyboardEvent} event
     */
    const handleFirstTab = (event) => {
        if (event.key === 'Tab' && !isKeyboardUser) {
            isKeyboardUser = true;
            document.body.classList.add('keyboard-user');
            document.removeEventListener('keydown', handleFirstTab);
        }
    };
    
    /**
     * Détecte la première utilisation de la souris
     */
    const handleFirstMouse = () => {
        if (isKeyboardUser) {
            isKeyboardUser = false;
            document.body.classList.remove('keyboard-user');
            document.addEventListener('keydown', handleFirstTab);
        }
    };
    
    /**
     * Gère la navigation au clavier
     * @param {KeyboardEvent} event
     */
    const handleKeydown = (event) => {
        switch (event.key) {
            case 'Tab':
                handleTabNavigation(event);
                break;
                
            case 'Escape':
                handleEscapeKey(event);
                break;
                
            case 'Enter':
            case ' ':
                handleActionKey(event);
                break;
                
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                handleArrowKeys(event);
                break;
                
            case 'Home':
                handleHomeKey(event);
                break;
                
            case 'End':
                handleEndKey(event);
                break;
        }
    };
    
    /**
     * Gère la navigation avec Tab
     * @param {KeyboardEvent} event
     */
    const handleTabNavigation = (event) => {
        event.preventDefault();
        
        const direction = event.shiftKey ? -1 : 1;
        currentFocus = (currentFocus + direction + focusableElements.length) % focusableElements.length;
        
        const element = focusableElements[currentFocus];
        if (element) {
            element.focus();
            scrollIntoViewIfNeeded(element);
        }
    };
    
    /**
     * Gère la touche Escape
     * @param {KeyboardEvent} event
     */
    const handleEscapeKey = (event) => {
        // Fermer les modals, menus, etc.
        closeAllModals();
        closeAllDropdowns();
        
        // Annuler les actions en cours
        const activeElement = document.activeElement;
        if (activeElement && activeElement.blur) {
            activeElement.blur();
        }
    };
    
    /**
     * Gère les touches d'action (Enter, Espace)
     * @param {KeyboardEvent} event
     */
    const handleActionKey = (event) => {
        const activeElement = document.activeElement;
        
        // Ne pas interférer avec les champs de formulaire
        if (activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.tagName === 'SELECT') {
            return;
        }
        
        // Simuler un clic sur les éléments focusables
        if (activeElement.tagName === 'BUTTON' ||
            activeElement.tagName === 'A' ||
            activeElement.hasAttribute('role')) {
            event.preventDefault();
            activeElement.click();
        }
    };
    
    /**
     * Gère les touches de direction
     * @param {KeyboardEvent} event
     */
    const handleArrowKeys = (event) => {
        const activeElement = document.activeElement;
        
        // Navigation dans les menus
        if (activeElement.closest('[role="menubar"]')) {
            handleMenuNavigation(event);
        }
        
        // Navigation dans les listbox
        if (activeElement.closest('[role="listbox"]')) {
            handleListboxNavigation(event);
        }
        
        // Navigation dans les radiogroup
        if (activeElement.closest('[role="radiogroup"]')) {
            handleRadiogroupNavigation(event);
        }
    };
    
    /**
     * Gère la touche Home
     * @param {KeyboardEvent} event
     */
    const handleHomeKey = (event) => {
        event.preventDefault();
        currentFocus = 0;
        focusableElements[currentFocus]?.focus();
    };
    
    /**
     * Gère la touche End
     * @param {KeyboardEvent} event
     */
    const handleEndKey = (event) => {
        event.preventDefault();
        currentFocus = focusableElements.length - 1;
        focusableElements[currentFocus]?.focus();
    };
    
    /**
     * Gère le focus sur un élément
     * @param {FocusEvent} event
     */
    const handleFocus = (event) => {
        const element = event.target;
        
        // Ajouter la classe de focus clavier
        if (isKeyboardUser) {
            element.classList.add('keyboard-focus');
        }
        
        // Mettre à jour l'indicateur de focus
        updateFocusIndicator(element);
        
        // Annoncer le focus aux lecteurs d'écran
        announceFocus(element);
    };
    
    /**
     * Gère la perte de focus
     * @param {FocusEvent} event
     */
    const handleBlur = (event) => {
        const element = event.target;
        element.classList.remove('keyboard-focus');
    };
    
    /**
     * Gère les changements de préférences utilisateur
     * @param {MediaQueryListEvent} event
     */
    const handlePreferenceChange = (event) => {
        if (event.media.includes('prefers-contrast')) {
            isHighContrast = event.matches;
            document.body.classList.toggle('high-contrast', isHighContrast);
        }
        
        if (event.media.includes('prefers-reduced-motion')) {
            document.body.classList.toggle('reduce-motion', event.matches);
        }
    };
    
    // =============================================================================
    // NAVIGATION SPÉCIALISÉE
    // =============================================================================
    
    /**
     * Gère la navigation dans les menus
     * @param {KeyboardEvent} event
     */
    const handleMenuNavigation = (event) => {
        event.preventDefault();
        
        const menu = event.target.closest('[role="menubar"]');
        const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
        const currentIndex = items.indexOf(event.target);
        
        let newIndex = currentIndex;
        
        switch (event.key) {
            case 'ArrowRight':
                newIndex = (currentIndex + 1) % items.length;
                break;
            case 'ArrowLeft':
                newIndex = (currentIndex - 1 + items.length) % items.length;
                break;
            case 'ArrowDown':
                // Ouvrir le sous-menu si présent
                openSubmenu(event.target);
                return;
        }
        
        items[newIndex]?.focus();
    };
    
    /**
     * Gère la navigation dans les listbox
     * @param {KeyboardEvent} event
     */
    const handleListboxNavigation = (event) => {
        event.preventDefault();
        
        const listbox = event.target.closest('[role="listbox"]');
        const options = Array.from(listbox.querySelectorAll('[role="option"]'));
        const currentIndex = options.indexOf(event.target);
        
        let newIndex = currentIndex;
        
        switch (event.key) {
            case 'ArrowDown':
                newIndex = Math.min(currentIndex + 1, options.length - 1);
                break;
            case 'ArrowUp':
                newIndex = Math.max(currentIndex - 1, 0);
                break;
        }
        
        options[newIndex]?.focus();
        selectOption(options[newIndex]);
    };
    
    /**
     * Gère la navigation dans les radiogroup
     * @param {KeyboardEvent} event
     */
    const handleRadiogroupNavigation = (event) => {
        event.preventDefault();
        
        const group = event.target.closest('[role="radiogroup"]');
        const radios = Array.from(group.querySelectorAll('[role="radio"]'));
        const currentIndex = radios.indexOf(event.target);
        
        let newIndex = currentIndex;
        
        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                newIndex = (currentIndex + 1) % radios.length;
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                newIndex = (currentIndex - 1 + radios.length) % radios.length;
                break;
        }
        
        radios[newIndex]?.focus();
        selectRadio(radios[newIndex]);
    };
    
    // =============================================================================
    // UTILITAIRES DE FOCUS
    // =============================================================================
    
    /**
     * Fait défiler l'élément dans la vue si nécessaire
     * @param {HTMLElement} element
     */
    const scrollIntoViewIfNeeded = (element) => {
        const rect = element.getBoundingClientRect();
        const isVisible = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
        
        if (!isVisible) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });
        }
    };
    
    /**
     * Met à jour l'indicateur de focus
     * @param {HTMLElement} element
     */
    const updateFocusIndicator = (element) => {
        // Mettre à jour l'indicateur visuel si présent
        const indicator = document.querySelector('.focus-indicator');
        if (indicator) {
            const rect = element.getBoundingClientRect();
            indicator.style.left = `${rect.left + window.scrollX}px`;
            indicator.style.top = `${rect.top + window.scrollY}px`;
            indicator.style.width = `${rect.width}px`;
            indicator.style.height = `${rect.height}px`;
        }
    };
    
    /**
     * Annonce le focus aux lecteurs d'écran
     * @param {HTMLElement} element
     */
    const announceFocus = (element) => {
        // Créer une annonce pour les lecteurs d'écran
        const announcement = element.getAttribute('aria-label') || 
                            element.getAttribute('alt') ||
                            element.textContent?.trim();
        
        if (announcement) {
            speakToScreenReader(announcement);
        }
    };
    
    // =============================================================================
    // ANNONCES VOCALES
    // =============================================================================
    
    /**
     * Parle au lecteur d'écran
     * @param {string} text
     */
    const speakToScreenReader = (text) => {
        // Créer un élément pour les annonces vocales
        let announcementElement = document.getElementById('screen-reader-announcements');
        
        if (!announcementElement) {
            announcementElement = document.createElement('div');
            announcementElement.id = 'screen-reader-announcements';
            announcementElement.setAttribute('aria-live', 'polite');
            announcementElement.setAttribute('aria-atomic', 'true');
            announcementElement.className = 'sr-only';
            document.body.appendChild(announcementElement);
        }
        
        // Mettre à jour le texte
        announcementElement.textContent = text;
        
        // Effacer après un court délai
        setTimeout(() => {
            announcementElement.textContent = '';
        }, 1000);
    };
    
    /**
     * Annonce un changement d'état
     * @param {string} message
     */
    const announceStatusChange = (message) => {
        const statusElement = document.getElementById('status-announcements');
        
        if (!statusElement) {
            const newStatusElement = document.createElement('div');
            newStatusElement.id = 'status-announcements';
            newStatusElement.setAttribute('aria-live', 'assertive');
            newStatusElement.setAttribute('aria-atomic', 'true');
            newStatusElement.className = 'sr-only';
            document.body.appendChild(newStatusElement);
        }
        
        statusElement.textContent = message;
        
        setTimeout(() => {
            statusElement.textContent = '';
        }, 1000);
    };
    
    // =============================================================================
    // GESTION DES MODALS ET MENUS
    // =============================================================================
    
    /**
     * Ferme tous les modals ouverts
     */
    const closeAllModals = () => {
        const modals = document.querySelectorAll('.modal[aria-hidden="false"]');
        modals.forEach(modal => {
            modal.setAttribute('aria-hidden', 'true');
            const closeButton = modal.querySelector('[data-dismiss="modal"]');
            closeButton?.focus();
        });
    };
    
    /**
     * Ferme tous les dropdowns ouverts
     */
    const closeAllDropdowns = () => {
        const dropdowns = document.querySelectorAll('[aria-expanded="true"]');
        dropdowns.forEach(dropdown => {
            dropdown.setAttribute('aria-expanded', 'false');
            dropdown.focus();
        });
    };
    
    /**
     * Ouvre un sous-menu
     * @param {HTMLElement} menuItem
     */
    const openSubmenu = (menuItem) => {
        const submenu = menuItem.nextElementSibling;
        if (submenu && submenu.getAttribute('role') === 'menu') {
            submenu.setAttribute('aria-hidden', 'false');
            const firstItem = submenu.querySelector('[role="menuitem"]');
            firstItem?.focus();
        }
    };
    
    /**
     * Sélectionne une option dans une listbox
     * @param {HTMLElement} option
     */
    const selectOption = (option) => {
        const listbox = option.closest('[role="listbox"]');
        const options = listbox.querySelectorAll('[role="option"]');
        
        options.forEach(opt => {
            opt.setAttribute('aria-selected', 'false');
        });
        
        option.setAttribute('aria-selected', 'true');
    };
    
    /**
     * Sélectionne un radio button
     * @param {HTMLElement} radio
     */
    const selectRadio = (radio) => {
        const group = radio.closest('[role="radiogroup"]');
        const radios = group.querySelectorAll('[role="radio"]');
        
        radios.forEach(r => {
            r.setAttribute('aria-checked', 'false');
        });
        
        radio.setAttribute('aria-checked', 'true');
    };
    
    // =============================================================================
    // STYLES D'ACCESSIBILITÉ
    // =============================================================================
    
    /**
     * Applique les styles d'accessibilité
     */
    const applyAccessibilityStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            .keyboard-user *:focus {
                outline: 2px solid var(--border-focus);
                outline-offset: 2px;
            }
            
            .keyboard-focus {
                box-shadow: 0 0 0 3px rgba(0, 255, 255, 0.5);
            }
            
            .high-contrast {
                --primary-color: #00ffff;
                --secondary-color: #ff00ff;
                --text-primary: #ffffff;
                --text-secondary: #cccccc;
                --border-color: #ffffff;
            }
            
            .reduce-motion * {
                animation-duration: 0.01s !important;
                transition-duration: 0.01s !important;
            }
            
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
        `;
        document.head.appendChild(style);
    };
    
    // =============================================================================
    // VALIDATION
    // =============================================================================
    
    /**
     * Valide l'accessibilité de la page
     */
    const validateAccessibility = () => {
        const issues = [];
        
        // Vérifier les images sans alt
        const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
        if (imagesWithoutAlt.length > 0) {
            issues.push(`Found ${imagesWithoutAlt.length} images without alt attribute`);
        }
        
        // Vérifier les boutons sans texte
        const buttonsWithoutText = document.querySelectorAll('button:not([aria-label]):empty');
        if (buttonsWithoutText.length > 0) {
            issues.push(`Found ${buttonsWithoutText.length} buttons without text or aria-label`);
        }
        
        // Vérifier les liens sans texte
        const linksWithoutText = document.querySelectorAll('a:not([aria-label]):empty');
        if (linksWithoutText.length > 0) {
            issues.push(`Found ${linksWithoutText.length} links without text or aria-label`);
        }
        
        // Vérifier les contrastes de couleurs
        const lowContrastElements = checkColorContrast();
        if (lowContrastElements.length > 0) {
            issues.push(`Found ${lowContrastElements.length} elements with low color contrast`);
        }
        
        if (issues.length > 0) {
            console.warn('⚠️ Accessibility issues found:');
            issues.forEach(issue => console.warn(`  - ${issue}`));
        } else {
            console.log('✅ No accessibility issues found');
        }
        
        return issues;
    };
    
    /**
     * Vérifie les contrastes de couleurs
     */
    const checkColorContrast = () => {
        const elements = [];
        // Implémentation simplifiée - en production, utiliser une librairie dédiée
        return elements;
    };
    
    // =============================================================================
    // API PUBLIQUE
    // =============================================================================
    
    return {
        // Initialisation
        init,
        isInitialized: () => isInitialized,
        
        // Gestion du focus
        updateFocusableElements,
        focusElement: (element) => element?.focus(),
        
        // Annonces
        speakToScreenReader,
        announceStatusChange,
        
        // Validation
        validateAccessibility,
        
        // Utilitaires
        isKeyboardUser: () => isKeyboardUser,
        isHighContrast: () => isHighContrast,
        
        // Gestion des événements
        handleKeydown
    };
})();

// =============================================================================
// EXPORT POUR LES TESTS ET LA DÉBUGAGE
// =============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Accessibility;
} else {
    window.Accessibility = Accessibility;
}