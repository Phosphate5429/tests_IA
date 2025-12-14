/**
 * VISUALS.JS - Module de visualisation 3D avec Three.js
 * 
 * Responsabilités :
 * - Système de particules 3D interactif
 * - Effets visuels avancés
 * - Gestion du rendu WebGL
 * - Optimisation des performances
 * - Mode low-spec automatique
 * 
 * Pattern : Revealing Module Pattern
 */

const Visuals = (() => {
    // =============================================================================
    // VARIABLES PRIVÉES
    // =============================================================================
    
    let isInitialized = false;
    let isLowSpecMode = false;
    let isPaused = false;
    let scene, camera, renderer;
    let particles, particleGeometry, particleMaterial;
    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;
    let time = 0;
    let animationId = null;
    
    // Configuration des particules
    const config = {
        particleCount: {
            normal: 5000,
            lowSpec: 1000
        },
        particleSize: {
            normal: 2.0,
            lowSpec: 1.5
        },
        animationSpeed: {
            normal: 1.0,
            lowSpec: 0.5
        },
        colors: {
            primary: 0x00ffff,
            secondary: 0xff00ff,
            accent: 0xffff00,
            background: 0x0a0a0a
        }
    };
    
    // =============================================================================
    // INITIALISATION
    // =============================================================================
    
    /**
     * Initialise le module de visualisation
     */
    const init = () => {
        if (isInitialized) return;
        
        console.log('🎨 Initializing Visuals Module...');
        
        // Vérifier si Three.js est chargé
        if (typeof THREE === 'undefined') {
            console.error('❌ Three.js not loaded. Visuals module cannot initialize.');
            return;
        }
        
        // Initialiser la scène
        setupScene();
        
        // Initialiser la caméra
        setupCamera();
        
        // Initialiser le rendu
        setupRenderer();
        
        // Créer les particules
        createParticles();
        
        // Configurer les lumières
        setupLights();
        
        // Configurer les écouteurs d'événements
        bindEvents();
        
        // Démarrer l'animation
        startAnimation();
        
        isInitialized = true;
        
        console.log('✅ Visuals Module initialized');
    };
    
    /**
     * Initialise la scène Three.js
     */
    const setupScene = () => {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(config.colors.background);
        scene.fog = new THREE.Fog(config.colors.background, 100, 1000);
    };
    
    /**
     * Initialise la caméra
     */
    const setupCamera = () => {
        const aspect = window.innerWidth / window.innerHeight;
        camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 2000);
        camera.position.z = 200;
    };
    
    /**
     * Initialise le renderer
     */
    const setupRenderer = () => {
        const container = document.getElementById('particles-canvas');
        if (!container) {
            console.error('❌ Particles canvas container not found');
            return;
        }
        
        renderer = new THREE.WebGLRenderer({
            antialias: !isLowSpecMode,
            alpha: true,
            powerPreference: isLowSpecMode ? 'low-power' : 'high-performance'
        });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowSpecMode ? 1 : 2));
        
        container.appendChild(renderer.domElement);
        
        // Gérer le redimensionnement
        window.addEventListener('resize', handleResize);
    };
    
    /**
     * Configure les lumières
     */
    const setupLights = () => {
        // Lumière ambiante
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);
        
        // Lumière directionnelle
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        // Lumière ponctuelle colorée
        const pointLight1 = new THREE.PointLight(config.colors.primary, 1, 100);
        pointLight1.position.set(50, 50, 50);
        scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(config.colors.secondary, 1, 100);
        pointLight2.position.set(-50, -50, 50);
        scene.add(pointLight2);
    };
    
    // =============================================================================
    // SYSTÈME DE PARTICULES
    // =============================================================================
    
    /**
     * Crée le système de particules
     */
    const createParticles = () => {
        const particleCount = isLowSpecMode ? 
            config.particleCount.lowSpec : 
            config.particleCount.normal;
        
        // Créer la géométrie des particules
        particleGeometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const velocities = new Float32Array(particleCount * 3);
        
        // Initialiser les particules
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Positions aléatoires dans une sphère
            const radius = Math.random() * 200;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Couleurs aléatoires
            const colorChoice = Math.random();
            let r, g, b;
            
            if (colorChoice < 0.33) {
                // Cyan
                r = 0; g = 1; b = 1;
            } else if (colorChoice < 0.66) {
                // Magenta
                r = 1; g = 0; b = 1;
            } else {
                // Jaune
                r = 1; g = 1; b = 0;
            }
            
            colors[i3] = r;
            colors[i3 + 1] = g;
            colors[i3 + 2] = b;
            
            // Tailles aléatoires
            sizes[i] = Math.random() * (isLowSpecMode ? 
                config.particleSize.lowSpec : 
                config.particleSize.normal);
            
            // Vitesses aléatoires
            velocities[i3] = (Math.random() - 0.5) * 0.5;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.5;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
        }
        
        // Définir les attributs
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        // Créer le matériau des particules
        particleMaterial = new THREE.PointsMaterial({
            size: isLowSpecMode ? config.particleSize.lowSpec : config.particleSize.normal,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            depthWrite: false
        });
        
        // Créer le système de particules
        particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);
        
        console.log(`✨ Created ${particleCount} particles`);
    };
    
    /**
     * Met à jour les particules
     */
    const updateParticles = () => {
        if (!particles || isPaused) return;
        
        const positions = particleGeometry.attributes.position.array;
        const velocities = particleGeometry.attributes.velocity.array;
        const colors = particleGeometry.attributes.color.array;
        
        const particleCount = positions.length / 3;
        const speed = isLowSpecMode ? 
            config.animationSpeed.lowSpec : 
            config.animationSpeed.normal;
        
        // Mettre à jour chaque particule
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Appliquer la vélocité
            positions[i3] += velocities[i3] * speed;
            positions[i3 + 1] += velocities[i3 + 1] * speed;
            positions[i3 + 2] += velocities[i3 + 2] * speed;
            
            // Rebondir sur les bords de la sphère virtuelle
            const radius = Math.sqrt(
                positions[i3] * positions[i3] +
                positions[i3 + 1] * positions[i3 + 1] +
                positions[i3 + 2] * positions[i3 + 2]
            );
            
            if (radius > 200) {
                // Inverser la vélocité
                velocities[i3] *= -1;
                velocities[i3 + 1] *= -1;
                velocities[i3 + 2] *= -1;
            }
            
            // Effet de vague basé sur le temps
            const wave = Math.sin(time * 0.001 + i * 0.01) * 0.5 + 0.5;
            
            // Modifier la couleur en fonction du temps
            colors[i3] = wave;
            colors[i3 + 1] = 1 - wave * 0.5;
            colors[i3 + 2] = 0.5 + wave * 0.5;
            
            // Modifier la taille en fonction de la position
            const sizeAttribute = particleGeometry.attributes.size;
            sizeAttribute.array[i] = (1 - radius / 200) * 
                (isLowSpecMode ? config.particleSize.lowSpec : config.particleSize.normal);
        }
        
        // Marquer les attributs comme modifiés
        particleGeometry.attributes.position.needsUpdate = true;
        particleGeometry.attributes.color.needsUpdate = true;
        particleGeometry.attributes.size.needsUpdate = true;
        
        // Rotation des particules
        particles.rotation.x = time * 0.0001;
        particles.rotation.y = time * 0.0002;
        particles.rotation.z = time * 0.00005;
    };
    
    // =============================================================================
    // ANIMATION
    // =============================================================================
    
    /**
     * Démarre l'animation
     */
    const startAnimation = () => {
        if (animationId) return;
        
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            
            // Garde de sécurité : arrêter si le module n'est pas initialisé
            if (!isInitialized || !scene || !camera || !renderer) {
                console.warn('⚠️ Animation stopped: module not properly initialized');
                stopAnimation();
                return;
            }
            
            if (!isPaused) {
                time += 16; // ~60fps
                
                // Mettre à jour les particules
                updateParticles();
                
                // Mettre à jour la position de la caméra en fonction de la souris
                updateCameraPosition();
                
                // Rendu avec garde de sécurité
                try {
                    renderer.render(scene, camera);
                } catch (error) {
                    console.error('❌ Render error:', error);
                    stopAnimation();
                }
            }
        };
        
        animate();
    };
    
    /**
     * Met à jour la position de la caméra en fonction de la souris
     */
    const updateCameraPosition = () => {
        // Interpolation douce de la position de la souris
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;
        
        // Mettre à jour la position de la caméra
        camera.position.x = mouseX * 0.5;
        camera.position.y = -mouseY * 0.5;
        camera.lookAt(scene.position);
    };
    
    /**
     * Arrête l'animation
     */
    const stopAnimation = () => {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    };
    
    // =============================================================================
    // GESTION DES ÉVÉNEMENTS
    // =============================================================================
    
    /**
     * Configure les écouteurs d'événements
     */
    const bindEvents = () => {
        // Mouvement de la souris
        document.addEventListener('mousemove', handleMouseMove);
        
        // Touch events pour mobile
        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove);
        
        // Redimensionnement de la fenêtre
        window.addEventListener('resize', handleResize);
        
        // Visibilité de la page
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Mode low-spec
        document.addEventListener('lowSpecDetected', () => {
            enableLowSpecMode();
        });
    };
    
    /**
     * Gère le mouvement de la souris
     * @param {MouseEvent} event
     */
    const handleMouseMove = (event) => {
        targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    
    /**
     * Gère le touch start
     * @param {TouchEvent} event
     */
    const handleTouchStart = (event) => {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            handleMouseMove(touch);
        }
    };
    
    /**
     * Gère le touch move
     * @param {TouchEvent} event
     */
    const handleTouchMove = (event) => {
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            handleMouseMove(touch);
        }
    };
    
    /**
     * Gère le redimensionnement
     */
    const handleResize = () => {
        const container = document.getElementById('particles-canvas');
        if (!container || !camera || !renderer) return;
        
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        
        renderer.setSize(container.clientWidth, container.clientHeight);
    };
    
    /**
     * Gère le changement de visibilité
     */
    const handleVisibilityChange = () => {
        if (document.hidden) {
            pause();
        } else {
            resume();
        }
    };
    
    // =============================================================================
    // GESTION DU MODE LOW-SPEC
    // =============================================================================
    
    /**
     * Active le mode low-spec
     */
    const enableLowSpecMode = () => {
        if (isLowSpecMode) return;
        
        console.log('🔧 Enabling low-spec mode for Visuals...');
        
        isLowSpecMode = true;
        
        // Réduire le nombre de particules
        if (particles) {
            scene.remove(particles);
            createParticles();
        }
        
        // Désactiver l'antialiasing
        if (renderer) {
            renderer.dispose();
            const container = document.getElementById('particles-canvas');
            
            renderer = new THREE.WebGLRenderer({
                antialias: false,
                alpha: true,
                powerPreference: 'low-power'
            });
            
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(1);
            
            container.innerHTML = '';
            container.appendChild(renderer.domElement);
        }
        
        // Réduire la qualité des matériaux
        if (particleMaterial) {
            particleMaterial.size = config.particleSize.lowSpec;
            particleMaterial.needsUpdate = true;
        }
    };
    
    /**
     * Désactive le mode low-spec
     */
    const disableLowSpecMode = () => {
        if (!isLowSpecMode) return;
        
        console.log('🔧 Disabling low-spec mode for Visuals...');
        
        isLowSpecMode = false;
        
        // Restaurer le nombre de particules
        if (particles) {
            scene.remove(particles);
            createParticles();
        }
        
        // Restaurer l'antialiasing
        if (renderer) {
            renderer.dispose();
            const container = document.getElementById('particles-canvas');
            
            renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance'
            });
            
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            
            container.innerHTML = '';
            container.appendChild(renderer.domElement);
        }
        
        // Restaurer la qualité des matériaux
        if (particleMaterial) {
            particleMaterial.size = config.particleSize.normal;
            particleMaterial.needsUpdate = true;
        }
    };
    
    // =============================================================================
    // EFFETS SPÉCIAUX
    // =============================================================================
    
    /**
     * Crée un effet d'explosion
     */
    const createExplosion = () => {
        if (!particles || isLowSpecMode) return;
        
        const positions = particleGeometry.attributes.position.array;
        const velocities = particleGeometry.attributes.velocity.array;
        const particleCount = positions.length / 3;
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Donner une vélocité aléatoire (explosion)
            const force = 5;
            velocities[i3] = (Math.random() - 0.5) * force;
            velocities[i3 + 1] = (Math.random() - 0.5) * force;
            velocities[i3 + 2] = (Math.random() - 0.5) * force;
        }
        
        particleGeometry.attributes.velocity.needsUpdate = true;
        
        // Réinitialiser les vélocités après 2 secondes
        setTimeout(() => {
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                velocities[i3] = (Math.random() - 0.5) * 0.5;
                velocities[i3 + 1] = (Math.random() - 0.5) * 0.5;
                velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
            }
            particleGeometry.attributes.velocity.needsUpdate = true;
        }, 2000);
    };
    
    /**
     * Crée un effet d'implosion
     */
    const createImplosion = () => {
        if (!particles || isLowSpecMode) return;
        
        const positions = particleGeometry.attributes.position.array;
        const velocities = particleGeometry.attributes.velocity.array;
        const particleCount = positions.length / 3;
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Calculer la direction vers le centre
            const dx = -positions[i3];
            const dy = -positions[i3 + 1];
            const dz = -positions[i3 + 2];
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Appliquer une vélocité vers le centre
            const force = 2;
            velocities[i3] = (dx / distance) * force;
            velocities[i3 + 1] = (dy / distance) * force;
            velocities[i3 + 2] = (dz / distance) * force;
        }
        
        particleGeometry.attributes.velocity.needsUpdate = true;
        
        // Réinitialiser les vélocités après 2 secondes
        setTimeout(() => {
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                velocities[i3] = (Math.random() - 0.5) * 0.5;
                velocities[i3 + 1] = (Math.random() - 0.5) * 0.5;
                velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
            }
            particleGeometry.attributes.velocity.needsUpdate = true;
        }, 2000);
    };
    
    /**
     * Crée un effet de vortex
     */
    const createVortex = () => {
        if (!particles || isLowSpecMode) return;
        
        const positions = particleGeometry.attributes.position.array;
        const velocities = particleGeometry.attributes.velocity.array;
        const particleCount = positions.length / 3;
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Calculer la distance radiale
            const x = positions[i3];
            const z = positions[i3 + 2];
            const radius = Math.sqrt(x * x + z * z);
            
            // Appliquer une vélocité tangentielle (vortex)
            const angularVelocity = 0.1;
            velocities[i3] = -z * angularVelocity;
            velocities[i3 + 2] = x * angularVelocity;
            velocities[i3 + 1] = 0.5; // Légèrement vers le haut
        }
        
        particleGeometry.attributes.velocity.needsUpdate = true;
        
        // Réinitialiser les vélocités après 3 secondes
        setTimeout(() => {
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                velocities[i3] = (Math.random() - 0.5) * 0.5;
                velocities[i3 + 1] = (Math.random() - 0.5) * 0.5;
                velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
            }
            particleGeometry.attributes.velocity.needsUpdate = true;
        }, 3000);
    };
    
    // =============================================================================
    // GESTION DE L'ÉTAT
    // =============================================================================
    
    /**
     * Met en pause l'animation
     */
    const pause = () => {
        isPaused = true;
    };
    
    /**
     * Reprend l'animation
     */
    const resume = () => {
        isPaused = false;
    };
    
    /**
     * Nettoie et détruit le module
     */
    const destroy = () => {
        stopAnimation();
        
        if (renderer) {
            renderer.dispose();
            renderer.domElement.remove();
        }
        
        if (scene) {
            scene.clear();
        }
        
        particles = null;
        particleGeometry = null;
        particleMaterial = null;
        scene = null;
        camera = null;
        renderer = null;
        
        isInitialized = false;
        
        console.log('🗑️ Visuals Module destroyed');
    };
    
    // =============================================================================
    // API PUBLIQUE
    // =============================================================================
    
    return {
        // Initialisation
        init,
        isInitialized: () => isInitialized,
        
        // Gestion de l'état
        pause,
        resume,
        isPaused: () => isPaused,
        destroy,
        
        // Mode low-spec
        enableLowSpecMode,
        disableLowSpecMode,
        isLowSpecMode: () => isLowSpecMode,
        
        // Effets spéciaux
        createExplosion,
        createImplosion,
        createVortex,
        
        // Utilitaires
        getParticleCount: () => {
            if (!particleGeometry) return 0;
            return particleGeometry.attributes.position.array.length / 3;
        },
        
        getTime: () => time
    };
})();

// =============================================================================
// EXPORT POUR LES TESTS ET LA DÉBUGAGE
// =============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Visuals;
} else {
    window.Visuals = Visuals;
}