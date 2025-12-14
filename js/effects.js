/**
 * EFFECTS.JS - Module de gestion des animations et effets visuels
 * 
 * Responsabilités :
 * - Animations GSAP avancées
 * - Transitions fluides
 * - Effets UI interactifs
 * - Gestion des timelines
 * - Optimisation des performances
 * 
 * Pattern : Revealing Module Pattern
 */

const Effects = (() => {
    // =============================================================================
    // VARIABLES PRIVÉES
    // =============================================================================
    
    let isInitialized = false;
    let isLowSpecMode = false;
    let animations = new Map();
    let timelines = new Map();
    let scrollTriggers = new Map();
    
    // Configuration des animations
    const config = {
        duration: {
            fast: 0.3,
            normal: 0.5,
            slow: 1.0
        },
        ease: {
            power1: 'power1.out',
            power2: 'power2.out',
            power3: 'power3.out',
            back: 'back.out(1.4)',
            elastic: 'elastic.out(1, 0.5)',
            bounce: 'bounce.out'
        },
        stagger: {
            small: 0.1,
            medium: 0.2,
            large: 0.3
        }
    };
    
    // =============================================================================
    // INITIALISATION
    // =============================================================================
    
    /**
     * Initialise le module d'effets
     */
    const init = () => {
        if (isInitialized) return;
        
        console.log('✨ Initializing Effects Module...');
        
        // Vérifier si GSAP est chargé
        if (typeof gsap === 'undefined') {
            console.error('❌ GSAP not loaded. Effects module cannot initialize.');
            return;
        }
        
        // Vérifier si ScrollTrigger est chargé
        if (typeof ScrollTrigger === 'undefined') {
            console.warn('⚠️ ScrollTrigger not loaded. Scroll-based animations disabled.');
        }
        
        // Configurer GSAP
        setupGSAP();
        
        // Créer les animations de base
        createBaseAnimations();
        
        // Configurer les écouteurs d'événements
        bindEvents();
        
        isInitialized = true;
        
        console.log('✅ Effects Module initialized');
    };
    
    /**
     * Configure GSAP avec les paramètres par défaut
     */
    const setupGSAP = () => {
        // Enregistrer les plugins
        gsap.registerPlugin(ScrollTrigger);
        
        // Configurer les paramètres globaux
        gsap.defaults({
            ease: config.ease.power2,
            duration: config.duration.normal
        });
        
        // Configurer le mode low-spec si nécessaire
        if (isLowSpecMode) {
            gsap.ticker.lagSmoothing(0);
            gsap.ticker.sleep(100);
        }
    };
    
    /**
     * Crée les animations de base
     */
    const createBaseAnimations = () => {
        // Animation de fade in
        animations.set('fadeIn', (element, duration = config.duration.normal) => {
            return gsap.fromTo(element, 
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration, ease: config.ease.power2 }
            );
        });
        
        // Animation de fade out
        animations.set('fadeOut', (element, duration = config.duration.normal) => {
            return gsap.to(element, {
                opacity: 0,
                y: -30,
                duration,
                ease: config.ease.power2
            });
        });
        
        // Animation de slide in from left
        animations.set('slideInLeft', (element, duration = config.duration.normal) => {
            return gsap.fromTo(element,
                { x: -100, opacity: 0 },
                { x: 0, opacity: 1, duration, ease: config.ease.back }
            );
        });
        
        // Animation de slide in from right
        animations.set('slideInRight', (element, duration = config.duration.normal) => {
            return gsap.fromTo(element,
                { x: 100, opacity: 0 },
                { x: 0, opacity: 1, duration, ease: config.ease.back }
            );
        });
        
        // Animation de scale in
        animations.set('scaleIn', (element, duration = config.duration.normal) => {
            return gsap.fromTo(element,
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration, ease: config.ease.back }
            );
        });
        
        // Animation de bounce
        animations.set('bounce', (element, duration = config.duration.normal) => {
            return gsap.fromTo(element,
                { y: -50, scale: 1.2 },
                { y: 0, scale: 1, duration, ease: config.ease.bounce }
            );
        });
        
        // Animation de pulse
        animations.set('pulse', (element, duration = config.duration.fast) => {
            return gsap.to(element, {
                scale: 1.1,
                duration: duration / 2,
                yoyo: true,
                repeat: 1,
                ease: config.ease.power2
            });
        });
        
        // Animation de shake
        animations.set('shake', (element, duration = config.duration.fast) => {
            return gsap.to(element, {
                x: '+=10',
                duration: duration / 5,
                yoyo: true,
                repeat: 4,
                ease: 'none'
            });
        });
        
        // Animation de spin
        animations.set('spin', (element, duration = config.duration.slow) => {
            return gsap.to(element, {
                rotation: 360,
                duration,
                ease: 'none',
                repeat: -1
            });
        });
        
        // Animation de glow
        animations.set('glow', (element, duration = config.duration.normal) => {
            return gsap.to(element, {
                boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)',
                duration: duration / 2,
                yoyo: true,
                repeat: 1,
                ease: config.ease.power2
            });
        });
    };
    
    // =============================================================================
    // GESTION DES ÉVÉNEMENTS
    // =============================================================================
    
    /**
     * Configure les écouteurs d'événements
     */
    const bindEvents = () => {
        // Surveiller les changements de mode low-spec
        document.addEventListener('lowSpecDetected', () => {
            isLowSpecMode = true;
            reduceAnimations();
        });
        
        // Surveiller la visibilité de la page
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pauseAllAnimations();
            } else {
                resumeAllAnimations();
            }
        });
        
        // Surveiller les préférences de mouvement réduit
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        motionQuery.addEventListener('change', (e) => {
            if (e.matches) {
                reduceAnimations();
            }
        });
    };
    
    // =============================================================================
    // ANIMATIONS DE PAGE
    // =============================================================================
    
    /**
     * Anime l'entrée d'une section
     * @param {HTMLElement} section
     * @param {string} direction
     */
    const animateSectionIn = (section, direction = 'up') => {
        const elements = section.querySelectorAll('[data-animate]');
        
        const timeline = gsap.timeline({
            defaults: {
                ease: config.ease.power2,
                duration: config.duration.normal
            }
        });
        
        // Animation du conteneur principal
        switch (direction) {
            case 'up':
                timeline.fromTo(section,
                    { y: 100, opacity: 0 },
                    { y: 0, opacity: 1 },
                    0
                );
                break;
            case 'down':
                timeline.fromTo(section,
                    { y: -100, opacity: 0 },
                    { y: 0, opacity: 1 },
                    0
                );
                break;
            case 'left':
                timeline.fromTo(section,
                    { x: 100, opacity: 0 },
                    { x: 0, opacity: 1 },
                    0
                );
                break;
            case 'right':
                timeline.fromTo(section,
                    { x: -100, opacity: 0 },
                    { x: 0, opacity: 1 },
                    0
                );
                break;
        }
        
        // Animation des éléments enfants
        elements.forEach((element, index) => {
            const delay = index * config.stagger.medium;
            const animationType = element.dataset.animate;
            
            switch (animationType) {
                case 'fade':
                    timeline.fromTo(element,
                        { opacity: 0 },
                        { opacity: 1 },
                        delay
                    );
                    break;
                    
                case 'slide-up':
                    timeline.fromTo(element,
                        { y: 30, opacity: 0 },
                        { y: 0, opacity: 1 },
                        delay
                    );
                    break;
                    
                case 'slide-down':
                    timeline.fromTo(element,
                        { y: -30, opacity: 0 },
                        { y: 0, opacity: 1 },
                        delay
                    );
                    break;
                    
                case 'scale':
                    timeline.fromTo(element,
                        { scale: 0.8, opacity: 0 },
                        { scale: 1, opacity: 1 },
                        delay
                    );
                    break;
                    
                case 'rotate':
                    timeline.fromTo(element,
                        { rotation: -180, opacity: 0 },
                        { rotation: 0, opacity: 1 },
                        delay
                    );
                    break;
            }
        });
        
        // Stocker la timeline pour référence future
        timelines.set(section.id, timeline);
        
        return timeline;
    };
    
    /**
     * Anime la sortie d'une section
     * @param {HTMLElement} section
     * @param {string} direction
     */
    const animateSectionOut = (section, direction = 'down') => {
        const timeline = gsap.timeline({
            defaults: {
                ease: config.ease.power2,
                duration: config.duration.fast
            }
        });
        
        switch (direction) {
            case 'up':
                timeline.to(section, { y: -100, opacity: 0 });
                break;
            case 'down':
                timeline.to(section, { y: 100, opacity: 0 });
                break;
            case 'left':
                timeline.to(section, { x: -100, opacity: 0 });
                break;
            case 'right':
                timeline.to(section, { x: 100, opacity: 0 });
                break;
        }
        
        return timeline;
    };
    
    // =============================================================================
    // ANIMATIONS D'ÉLÉMENTS
    // =============================================================================
    
    /**
     * Anime un élément avec un effet spécifique
     * @param {HTMLElement|string} element
     * @param {string} effect
     * @param {Object} options
     */
    const animateElement = (element, effect, options = {}) => {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (!target) return null;
        
        const animation = animations.get(effect);
        if (!animation) {
            console.warn(`⚠️ Animation effect "${effect}" not found`);
            return null;
        }
        
        return animation(target, options.duration);
    };
    
    /**
     * Crée une animation de stagger pour un groupe d'éléments
     * @param {NodeList|Array} elements
     * @param {Object} animationProps
     * @param {Object} options
     */
    const staggerAnimation = (elements, animationProps, options = {}) => {
        const fromVars = animationProps.from || {};
        const toVars = animationProps.to || {};
        
        return gsap.fromTo(elements, fromVars, {
            ...toVars,
            stagger: options.stagger || config.stagger.medium,
            duration: options.duration || config.duration.normal,
            ease: options.ease || config.ease.power2
        });
    };
    
    /**
     * Crée une animation de type "morph" entre deux états
     * @param {HTMLElement} element
     * @param {Object} fromState
     * @param {Object} toState
     * @param {Object} options
     */
    const morph = (element, fromState, toState, options = {}) => {
        return gsap.fromTo(element, fromState, {
            ...toState,
            duration: options.duration || config.duration.normal,
            ease: options.ease || config.ease.power2
        });
    };
    
    // =============================================================================
    // ANIMATIONS SCROLL-BASED
    // =============================================================================
    
    /**
     * Crée une animation déclenchée par le scroll
     * @param {HTMLElement|string} element
     * @param {Object} animationProps
     * @param {Object} triggerProps
     */
    const createScrollAnimation = (element, animationProps, triggerProps = {}) => {
        if (typeof ScrollTrigger === 'undefined') {
            console.warn('⚠️ ScrollTrigger not available');
            return null;
        }
        
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (!target) return null;
        
        const animation = gsap.to(target, {
            ...animationProps,
            scrollTrigger: {
                trigger: target,
                start: triggerProps.start || 'top 80%',
                end: triggerProps.end || 'bottom 20%',
                toggleActions: triggerProps.toggleActions || 'play none none reverse',
                markers: triggerProps.markers || false,
                scrub: triggerProps.scrub || false,
                pin: triggerProps.pin || false,
                anticipatePin: triggerProps.anticipatePin || 1
            }
        });
        
        scrollTriggers.set(target.id || `scroll-${Date.now()}`, animation.scrollTrigger);
        
        return animation;
    };
    
    /**
     * Crée un effet de parallaxe
     * @param {HTMLElement|string} element
     * @param {Object} options
     */
    const createParallax = (element, options = {}) => {
        if (typeof ScrollTrigger === 'undefined') {
            console.warn('⚠️ ScrollTrigger not available');
            return null;
        }
        
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (!target) return null;
        
        return gsap.to(target, {
            y: options.y || '-50%',
            x: options.x || '0%',
            scale: options.scale || 1,
            rotation: options.rotation || 0,
            ease: 'none',
            scrollTrigger: {
                trigger: target,
                start: options.start || 'top bottom',
                end: options.end || 'bottom top',
                scrub: options.scrub || 1,
                markers: options.markers || false
            }
        });
    };
    
    /**
     * Crée un effet de reveal (dévoilement)
     * @param {HTMLElement|string} element
     * @param {Object} options
     */
    const createReveal = (element, options = {}) => {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (!target) return null;
        
        // Créer un masque si nécessaire
        let mask = target.querySelector('.reveal-mask');
        if (!mask) {
            mask = document.createElement('div');
            mask.className = 'reveal-mask';
            mask.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--bg-primary);
                transform: scaleX(0);
                transform-origin: left;
                z-index: 10;
            `;
            target.style.position = 'relative';
            target.appendChild(mask);
        }
        
        return createScrollAnimation(target, {
            '--reveal-progress': 1
        }, {
            start: options.start || 'top 80%',
            end: options.end || 'top 20%',
            scrub: options.scrub || 1,
            onUpdate: (self) => {
                const progress = self.progress;
                gsap.to(mask, {
                    scaleX: 1 - progress,
                    duration: 0.1,
                    ease: 'none'
                });
            }
        });
    };
    
    // =============================================================================
    // ANIMATIONS INTERACTIVES
    // =============================================================================
    
    /**
     * Crée une animation au hover
     * @param {HTMLElement|string} element
     * @param {Object} hoverProps
     * @param {Object} normalProps
     */
    const createHoverAnimation = (element, hoverProps, normalProps = {}) => {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (!target) return null;
        
        const timeline = gsap.timeline({ paused: true });
        
        timeline.to(target, hoverProps);
        
        target.addEventListener('mouseenter', () => {
            if (!isLowSpecMode) {
                timeline.play();
            }
        });
        
        target.addEventListener('mouseleave', () => {
            if (normalProps && Object.keys(normalProps).length > 0) {
                gsap.to(target, normalProps);
            } else {
                timeline.reverse();
            }
        });
        
        return timeline;
    };
    
    /**
     * Crée une animation au click
     * @param {HTMLElement|string} element
     * @param {Object} clickProps
     * @param {Object} options
     */
    const createClickAnimation = (element, clickProps, options = {}) => {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (!target) return null;
        
        target.addEventListener('click', (e) => {
            if (options.preventDefault) {
                e.preventDefault();
            }
            
            const animation = gsap.to(target, {
                ...clickProps,
                duration: options.duration || config.duration.fast,
                ease: options.ease || config.ease.power2,
                yoyo: options.yoyo || true,
                repeat: options.repeat || 1
            });
            
            if (options.onComplete) {
                animation.eventCallback('onComplete', options.onComplete);
            }
        });
    };
    
    /**
     * Crée une animation de type "ripple" (ondulation)
     * @param {HTMLElement|string} element
     * @param {Object} options
     */
    const createRipple = (element, options = {}) => {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (!target) return null;
        
        target.addEventListener('click', (e) => {
            const rect = target.getBoundingClientRect();
            const ripple = document.createElement('div');
            
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: ${options.color || 'rgba(255, 255, 255, 0.6)'};
                transform: scale(0);
                animation: ripple ${options.duration || 600}ms linear;
                left: ${e.clientX - rect.left}px;
                top: ${e.clientY - rect.top}px;
                width: ${options.size || 20}px;
                height: ${options.size || 20}px;
                margin-left: -${(options.size || 20) / 2}px;
                margin-top: -${(options.size || 20) / 2}px;
                pointer-events: none;
            `;
            
            target.style.position = 'relative';
            target.style.overflow = 'hidden';
            target.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, options.duration || 600);
            
            gsap.to(ripple, {
                scale: options.maxScale || 4,
                opacity: 0,
                duration: (options.duration || 600) / 1000,
                ease: 'power2.out'
            });
        });
    };
    
    // =============================================================================
    // GESTION DES ANIMATIONS
    // =============================================================================
    
    /**
     * Met en pause toutes les animations
     */
    const pauseAllAnimations = () => {
        gsap.globalTimeline.pause();
        timelines.forEach(timeline => timeline.pause());
    };
    
    /**
     * Reprend toutes les animations
     */
    const resumeAllAnimations = () => {
        gsap.globalTimeline.resume();
        timelines.forEach(timeline => timeline.resume());
    };
    
    /**
     * Arrête toutes les animations
     */
    const killAllAnimations = () => {
        gsap.killTweensOf('*');
        timelines.forEach(timeline => timeline.kill());
        scrollTriggers.forEach(trigger => trigger.kill());
        
        animations.clear();
        timelines.clear();
        scrollTriggers.clear();
    };
    
    /**
     * Réduit les animations pour le mode low-spec
     */
    const reduceAnimations = () => {
        isLowSpecMode = true;
        
        // Réduire la durée des animations
        gsap.globalTimeline.timeScale(2);
        
        // Désactiver les animations complexes
        document.body.classList.add('reduce-motion');
        
        // Tuer les animations non essentielles
        scrollTriggers.forEach((trigger, key) => {
            if (!trigger.vars.essential) {
                trigger.kill();
                scrollTriggers.delete(key);
            }
        });
        
        console.log('🔧 Animations reduced for low-spec mode');
    };
    
    /**
     * Restaure les animations normales
     */
    const restoreAnimations = () => {
        isLowSpecMode = false;
        
        // Restaurer la vitesse normale
        gsap.globalTimeline.timeScale(1);
        
        // Retirer la classe reduce-motion
        document.body.classList.remove('reduce-motion');
        
        console.log('🔧 Animations restored to normal');
    };
    
    // =============================================================================
    // UTILITAIRES
    // =============================================================================
    
    /**
     * Crée une timeline séquentielle
     * @param {Array} steps
     */
    const createSequence = (steps) => {
        const timeline = gsap.timeline();
        
        steps.forEach(step => {
            const { element, animation, vars, position } = step;
            const target = typeof element === 'string' ? document.querySelector(element) : element;
            
            if (target) {
                timeline.to(target, vars || {}, position);
            }
        });
        
        return timeline;
    };
    
    /**
     * Crée une animation de type "breath" (respiration)
     * @param {HTMLElement|string} element
     * @param {Object} options
     */
    const createBreath = (element, options = {}) => {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (!target) return null;
        
        return gsap.to(target, {
            opacity: options.minOpacity || 0.6,
            scale: options.minScale || 0.95,
            duration: options.duration || 2,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true
        });
    };
    
    /**
     * Crée une animation de type "float" (flottement)
     * @param {HTMLElement|string} element
     * @param {Object} options
     */
    const createFloat = (element, options = {}) => {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (!target) return null;
        
        return gsap.to(target, {
            y: options.distance || -20,
            duration: options.duration || 3,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true
        });
    };
    
    // =============================================================================
    // API PUBLIQUE
    // =============================================================================
    
    return {
        // Initialisation
        init,
        isInitialized: () => isInitialized,
        
        // Animations de page
        animateSectionIn,
        animateSectionOut,
        
        // Animations d'éléments
        animateElement,
        staggerAnimation,
        morph,
        
        // Animations scroll-based
        createScrollAnimation,
        createParallax,
        createReveal,
        
        // Animations interactives
        createHoverAnimation,
        createClickAnimation,
        createRipple,
        
        // Gestion des animations
        pauseAllAnimations,
        resumeAllAnimations,
        killAllAnimations,
        reduceAnimations,
        restoreAnimations,
        
        // Utilitaires
        createSequence,
        createBreath,
        createFloat,
        
        // Configuration
        config: () => ({ ...config })
    };
})();

// =============================================================================
// EXPORT POUR LES TESTS ET LA DÉBUGAGE
// =============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Effects;
} else {
    window.Effects = Effects;
}