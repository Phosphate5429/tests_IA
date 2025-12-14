/**
 * PERFORMANCE.JS - Module de gestion de la performance
 * 
 * Responsabilités :
 * - Détection automatique des appareils low-spec
 * - Optimisation des performances
 * - Monitoring des FPS
 * - Gestion du mode basse consommation
 * 
 * Pattern : Revealing Module Pattern
 */

const Performance = (() => {
    // =============================================================================
    // VARIABLES PRIVÉES
    // =============================================================================
    
    let isLowSpec = false;
    let isManualOverride = false;
    let lowSpecReason = '';
    let currentFPS = 60;
    let frameCount = 0;
    let lastTime = performance.now();
    let fpsMonitorInterval = null;
    
    // Seuils de détection
    const thresholds = {
        cpuCores: 4,
        deviceMemory: 4, // GB
        batteryLevel: 0.2, // 20%
        slowNetworkTypes: ['2g', 'slow-2g'],
        fpsThreshold: 30
    };
    
    // =============================================================================
    // INITIALISATION
    // =============================================================================
    
    /**
     * Initialise le module de performance
     */
    const init = () => {
        console.log('⚡ Initializing Performance Monitor...');
        
        // Détecter si l'appareil est low-spec
        detectLowSpec();
        
        // Démarrer le monitoring des FPS
        startFPSMonitoring();
        
        // Configurer les écouteurs d'événements
        bindEvents();
        
        // Appliquer le mode low-spec si nécessaire
        if (isLowSpec) {
            enableLowSpecMode();
        }
        
        console.log('✅ Performance Monitor initialized');
        console.log(`📊 Device status: ${isLowSpec ? 'Low-spec' : 'Normal'}`);
        if (isLowSpec) {
            console.log(`📋 Reason: ${lowSpecReason}`);
        }
    };
    
    // =============================================================================
    // DÉTECTION LOW-SPEC
    // =============================================================================
    
    /**
     * Détecte si l'appareil est low-spec
     */
    const detectLowSpec = () => {
        const checks = [
            {
                name: 'CPU cores',
                test: () => navigator.hardwareConcurrency < thresholds.cpuCores,
                reason: 'Low CPU core count'
            },
            {
                name: 'RAM',
                test: () => navigator.deviceMemory < thresholds.deviceMemory,
                reason: 'Limited RAM'
            },
            {
                name: 'Network',
                test: () => {
                    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                    return connection && thresholds.slowNetworkTypes.includes(connection.effectiveType);
                },
                reason: 'Slow network connection'
            }
        ];
        
        // Exécuter les vérifications
        for (const check of checks) {
            try {
                if (check.test()) {
                    isLowSpec = true;
                    lowSpecReason = check.reason;
                    break;
                }
            } catch (error) {
                console.warn(`⚠️ Failed to check ${check.name}:`, error);
            }
        }
        
        // Vérifier la batterie (si disponible)
        checkBatteryStatus();
    };
    
    /**
     * Vérifie le statut de la batterie
     */
    const checkBatteryStatus = async () => {
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                
                if (battery.level < thresholds.batteryLevel) {
                    isLowSpec = true;
                    lowSpecReason = 'Low battery';
                }
                
                // Surveiller les changements de batterie
                battery.addEventListener('levelchange', () => {
                    if (battery.level < thresholds.batteryLevel) {
                        if (!isLowSpec) {
                            isLowSpec = true;
                            lowSpecReason = 'Low battery';
                            enableLowSpecMode();
                        }
                    }
                });
            }
        } catch (error) {
            console.warn('⚠️ Failed to check battery status:', error);
        }
    };
    
    // =============================================================================
    // MONITORING DES FPS
    // =============================================================================
    
    /**
     * Démarre le monitoring des FPS
     */
    const startFPSMonitoring = () => {
        fpsMonitorInterval = setInterval(calculateFPS, 1000);
        requestAnimationFrame(updateFrameCount);
    };
    
    /**
     * Met à jour le compteur de frames
     */
    const updateFrameCount = () => {
        // Garde de sécurité : arrêter si le monitoring est désactivé
        if (!fpsMonitorInterval) {
            return;
        }
        
        try {
            frameCount++;
            requestAnimationFrame(updateFrameCount);
        } catch (error) {
            console.error('❌ FPS monitoring error:', error);
            // Ne pas rappeler requestAnimationFrame pour éviter la boucle infinie
        }
    };
    
    /**
     * Calcule les FPS actuels
     */
    const calculateFPS = () => {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastTime;
        
        currentFPS = Math.round((frameCount * 1000) / deltaTime);
        
        // Réinitialiser les compteurs
        frameCount = 0;
        lastTime = currentTime;
        
        // Vérifier si les FPS sont trop bas
        if (currentFPS < thresholds.fpsThreshold && !isLowSpec) {
            console.warn(`⚠️ Low FPS detected: ${currentFPS}, enabling low-spec mode`);
            isLowSpec = true;
            lowSpecReason = 'Low FPS';
            enableLowSpecMode();
        }
        
        // Mettre à jour l'affichage FPS si présent
        updateFPSDisplay();
    };
    
    /**
     * Met à jour l'affichage du compteur FPS
     */
    const updateFPSDisplay = () => {
        const fpsElement = document.getElementById('fps-value');
        if (fpsElement) {
            fpsElement.textContent = currentFPS;
            
            // Changer la couleur en fonction du FPS
            if (currentFPS >= 50) {
                fpsElement.style.color = 'var(--success-color)';
            } else if (currentFPS >= 30) {
                fpsElement.style.color = 'var(--warning-color)';
            } else {
                fpsElement.style.color = 'var(--error-color)';
            }
        }
    };
    
    // =============================================================================
    // GESTION DU MODE LOW-SPEC
    // =============================================================================
    
    /**
     * Active le mode low-spec
     */
    const enableLowSpecMode = () => {
        if (isLowSpec) {
            console.log('🔧 Enabling low-spec optimizations...');
            
            // Ajouter la classe low-spec au body
            document.body.classList.add('low-spec-mode');
            
            // Appliquer les optimisations
            applyLowSpecOptimizations();
            
            // Afficher la notification
            showLowSpecNotification();
            
            // Déclencher l'événement personnalisé
            document.dispatchEvent(new CustomEvent('lowSpecDetected', {
                detail: { reason: lowSpecReason }
            }));
        }
    };
    
    /**
     * Désactive le mode low-spec
     */
    const disableLowSpecMode = () => {
        console.log('🔧 Disabling low-spec optimizations...');
        
        // Retirer la classe low-spec
        document.body.classList.remove('low-spec-mode');
        
        // Restaurer les fonctionnalités
        restoreNormalMode();
        
        isLowSpec = false;
        lowSpecReason = '';
    };
    
    /**
     * Bascule manuellement le mode low-spec
     */
    const manualToggle = () => {
        isManualOverride = true;
        
        if (isLowSpec) {
            disableLowSpecMode();
        } else {
            isLowSpec = true;
            lowSpecReason = 'Manual activation';
            enableLowSpecMode();
        }
    };
    
    /**
     * Applique les optimisations low-spec
     */
    const applyLowSpecOptimizations = () => {
        // Réduire les particules 3D
        if (window.Visuals) {
            Visuals.enableLowSpecMode();
        }
        
        // Désactiver les visualisations audio non essentielles
        if (window.Audio) {
            Audio.disableVisualizations();
        }
        
        // Réduire les animations
        if (window.Effects) {
            Effects.reduceAnimations();
        }
        
        // Réduire la qualité des images
        reduceImageQuality();
        
        // Désactiver les effets coûteux
        disableExpensiveEffects();
    };
    
    /**
     * Restaure le mode normal
     */
    const restoreNormalMode = () => {
        // Restaurer les particules 3D
        if (window.Visuals) {
            Visuals.disableLowSpecMode();
        }
        
        // Restaurer les visualisations audio
        if (window.Audio) {
            Audio.enableVisualizations();
        }
        
        // Restaurer les animations
        if (window.Effects) {
            Effects.restoreAnimations();
        }
        
        // Restaurer la qualité des images
        restoreImageQuality();
        
        // Restaurer les effets
        restoreEffects();
    };
    
    // =============================================================================
    // OPTIMISATIONS SPÉCIFIQUES
    // =============================================================================
    
    /**
     * Réduit la qualité des images
     */
    const reduceImageQuality = () => {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Ajouter un attribut pour marquer l'image optimisée
            img.setAttribute('data-low-spec', 'true');
            
            // Réduire la taille si possible
            if (img.dataset.lowSpecSrc) {
                img.src = img.dataset.lowSpecSrc;
            }
        });
    };
    
    /**
     * Restaure la qualité des images
     */
    const restoreImageQuality = () => {
        const images = document.querySelectorAll('img[data-low-spec="true"]');
        
        images.forEach(img => {
            // Restaurer la source originale
            if (img.dataset.src) {
                img.src = img.dataset.src;
            }
            
            img.removeAttribute('data-low-spec');
        });
    };
    
    /**
     * Désactive les effets coûteux
     */
    const disableExpensiveEffects = () => {
        // Désactiver les filtres coûteux
        document.documentElement.style.setProperty('--blur-md', 'none');
        document.documentElement.style.setProperty('--blur-lg', 'none');
        document.documentElement.style.setProperty('--blur-xl', 'none');
        
        // Réduire les ombres
        document.documentElement.style.setProperty('--shadow-lg', 'var(--shadow-sm)');
        document.documentElement.style.setProperty('--shadow-xl', 'var(--shadow-sm)');
        
        // Désactiver les effets de glow
        document.documentElement.style.setProperty('--glow-intensity', 'none');
    };
    
    /**
     * Restaure les effets
     */
    const restoreEffects = () => {
        // Restaurer les filtres
        document.documentElement.style.removeProperty('--blur-md');
        document.documentElement.style.removeProperty('--blur-lg');
        document.documentElement.style.removeProperty('--blur-xl');
        
        // Restaurer les ombres
        document.documentElement.style.removeProperty('--shadow-lg');
        document.documentElement.style.removeProperty('--shadow-xl');
        
        // Restaurer les effets de glow
        document.documentElement.style.removeProperty('--glow-intensity');
    };
    
    // =============================================================================
    // NOTIFICATIONS
    // =============================================================================
    
    /**
     * Affiche la notification low-spec
     */
    const showLowSpecNotification = () => {
        const notification = document.getElementById('low-spec-notification');
        if (notification) {
            notification.style.display = 'flex';
            
            // Masquer automatiquement après 5 secondes
            setTimeout(() => {
                notification.style.display = 'none';
            }, 5000);
        }
    };
    
    // =============================================================================
    // GESTION DES ÉVÉNEMENTS
    // =============================================================================
    
    /**
     * Configure les écouteurs d'événements
     */
    const bindEvents = () => {
        // Surveiller les changements de connexion réseau
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            
            if (connection) {
                connection.addEventListener('change', () => {
                    const effectiveType = connection.effectiveType;
                    
                    if (thresholds.slowNetworkTypes.includes(effectiveType) && !isLowSpec) {
                        isLowSpec = true;
                        lowSpecReason = 'Network degraded';
                        enableLowSpecMode();
                    }
                });
            }
        }
        
        // Surveiller la visibilité de la page
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Mettre en pause les animations quand la page n'est pas visible
                pauseAnimations();
            } else {
                // Reprendre les animations quand la page redevient visible
                resumeAnimations();
            }
        });
    };
    
    /**
     * Met en pause les animations
     */
    const pauseAnimations = () => {
        document.body.classList.add('pause-animations');
        
        // Mettre en pause les modules actifs
        if (window.Visuals && Visuals.isInitialized()) {
            Visuals.pause();
        }
        
        if (window.Game && Game.isInitialized() && Game.isPlaying()) {
            Game.pause();
        }
    };
    
    /**
     * Reprend les animations
     */
    const resumeAnimations = () => {
        document.body.classList.remove('pause-animations');
        
        // Reprendre les modules actifs
        if (window.Visuals && Visuals.isInitialized()) {
            Visuals.resume();
        }
        
        if (window.Game && Game.isInitialized() && Game.isPaused()) {
            Game.resume();
        }
    };
    
    // =============================================================================
    // UTILITAIRES DE PERFORMANCE
    // =============================================================================
    
    /**
     * Mesure le temps d'exécution d'une fonction
     * @param {string} name - Nom de la mesure
     * @param {Function} fn - Fonction à mesurer
     * @returns {*} Résultat de la fonction
     */
    const measure = (name, fn) => {
        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;
        
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
        
        if (duration > 16) { // Plus de 16ms = moins de 60fps
            console.warn(`⚠️ ${name} took ${duration.toFixed(2)}ms (may affect performance)`);
        }
        
        return result;
    };
    
    /**
     * Crée un profileur de performance
     * @param {string} name - Nom du profil
     * @returns {Object} Objet avec les méthodes start et end
     */
    const createProfiler = (name) => {
        let startTime = null;
        
        return {
            start: () => {
                startTime = performance.now();
                console.log(`📊 Profiling ${name}...`);
            },
            
            end: () => {
                if (startTime === null) {
                    console.warn('⚠️ Profiler not started');
                    return;
                }
                
                const duration = performance.now() - startTime;
                console.log(`📊 ${name} completed in ${duration.toFixed(2)}ms`);
                startTime = null;
            }
        };
    };
    
    // =============================================================================
    // API PUBLIQUE
    // =============================================================================
    
    return {
        // Initialisation
        init,
        
        // Getters
        isLowSpec: () => isLowSpec,
        getLowSpecReason: () => lowSpecReason,
        getCurrentFPS: () => currentFPS,
        isManualOverride: () => isManualOverride,
        
        // Mode low-spec
        enableLowSpecMode,
        disableLowSpecMode,
        manualToggle,
        
        // Utilitaires
        measure,
        createProfiler,
        
        // Gestion des animations
        pauseAnimations,
        resumeAnimations
    };
})();

// =============================================================================
// EXPORT POUR LES TESTS ET LA DÉBUGAGE
// =============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Performance;
} else {
    window.Performance = Performance;
}