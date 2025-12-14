/**
 * GAME.JS - Module du jeu Aim Trainer
 * 
 * Responsabilités :
 * - Jeu de précision avec cibles
 * - Système de score et timer
 * - Leaderboard persistant
 * - Différents modes de jeu
 * - Feedback visuel et sonore
 * 
 * Pattern : Revealing Module Pattern
 */

const Game = (() => {
    // =============================================================================
    // VARIABLES PRIVÉES
    // =============================================================================
    
    let isInitialized = false;
    let isPlaying = false;
    let isPaused = false;
    let score = 0;
    let timeLeft = 30;
    let targetsHit = 0;
    let targetsMissed = 0;
    let accuracy = 100;
    let gameTimer = null;
    let targetSpawnTimer = null;
    let currentDifficulty = 'normal';
    let currentMode = 'timed';
    let leaderboard = [];
    
    // Éléments DOM
    let gameCanvas, scoreDisplay, timerDisplay, accuracyDisplay;
    let startButton, pauseButton, resetButton;
    let difficultySelect, modeSelect;
    let gameOverModal, finalScoreDisplay;
    
    // Configuration du jeu
    const config = {
        gameDuration: {
            timed: 30,
            endless: 999999
        },
        targetSpawnRate: {
            easy: 1500,
            normal: 1000,
            hard: 700,
            expert: 500
        },
        targetSize: {
            easy: 60,
            normal: 50,
            hard: 40,
            expert: 30
        },
        targetLifetime: {
            easy: 3000,
            normal: 2000,
            hard: 1500,
            expert: 1000
        },
        scoreMultiplier: {
            easy: 1,
            normal: 2,
            hard: 3,
            expert: 5
        },
        colors: {
            target: '#00ffff',
            targetHover: '#ff00ff',
            targetMiss: '#ff0000',
            background: 'rgba(10, 10, 10, 0.8)'
        }
    };
    
    // Cibles actives
    let activeTargets = [];
    
    // =============================================================================
    // INITIALISATION
    // =============================================================================
    
    /**
     * Initialise le module du jeu
     */
    const init = () => {
        if (isInitialized) return;
        
        console.log('🎮 Initializing Game Module...');
        
        // Obtenir les références DOM
        getDOMElements();
        
        // Charger le leaderboard
        loadLeaderboard();
        
        // Configurer les écouteurs d'événements
        bindEvents();
        
        // Initialiser le canvas
        setupCanvas();
        
        isInitialized = true;
        
        console.log('✅ Game Module initialized');
    };
    
    /**
     * Obtient les références des éléments DOM
     */
    const getDOMElements = () => {
        gameCanvas = document.getElementById('aim-trainer-canvas');
        scoreDisplay = document.getElementById('game-score');
        timerDisplay = document.getElementById('game-timer');
        accuracyDisplay = document.getElementById('game-accuracy');
        
        startButton = document.getElementById('game-start');
        pauseButton = document.getElementById('game-pause');
        resetButton = document.getElementById('game-reset');
        
        difficultySelect = document.getElementById('game-difficulty');
        modeSelect = document.getElementById('game-mode');
        
        gameOverModal = document.getElementById('game-over-modal');
        finalScoreDisplay = document.getElementById('final-score');
    };
    
    /**
     * Configure le canvas de jeu
     */
    const setupCanvas = () => {
        if (!gameCanvas) return;
        
        // Définir la taille du canvas
        gameCanvas.width = gameCanvas.offsetWidth;
        gameCanvas.height = gameCanvas.offsetHeight;
        
        // Configurer le contexte
        const ctx = gameCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
    };
    
    // =============================================================================
    // GESTION DES ÉVÉNEMENTS
    // =============================================================================
    
    /**
     * Configure les écouteurs d'événements
     */
    const bindEvents = () => {
        // Boutons de contrôle
        startButton?.addEventListener('click', startGame);
        pauseButton?.addEventListener('click', togglePause);
        resetButton?.addEventListener('click', resetGame);
        
        // Sélecteurs
        difficultySelect?.addEventListener('change', handleDifficultyChange);
        modeSelect?.addEventListener('change', handleModeChange);
        
        // Canvas
        gameCanvas?.addEventListener('click', handleCanvasClick);
        gameCanvas?.addEventListener('mousemove', handleCanvasMouseMove);
        
        // Clavier
        document.addEventListener('keydown', handleKeydown);
        
        // Visibilité
        document.addEventListener('visibilitychange', handleVisibilityChange);
    };
    
    /**
     * Gère le clic sur le canvas
     * @param {MouseEvent} event
     */
    const handleCanvasClick = (event) => {
        if (!isPlaying || isPaused) return;
        
        const rect = gameCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Vérifier si une cible a été touchée
        const hitTarget = checkTargetHit(x, y);
        
        if (hitTarget) {
            hitTarget(hitTarget);
        } else {
            // Miss
            targetsMissed++;
            updateAccuracy();
            playMissSound();
            showMissEffect(x, y);
        }
    };
    
    /**
     * Gère le mouvement de la souris sur le canvas
     * @param {MouseEvent} event
     */
    const handleCanvasMouseMove = (event) => {
        if (!isPlaying || isPaused) return;
        
        const rect = gameCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Vérifier si la souris est sur une cible
        const hoverTarget = checkTargetHit(x, y);
        
        // Changer le curseur
        gameCanvas.style.cursor = hoverTarget ? 'crosshair' : 'default';
        
        // Mettre à jour l'état de hover des cibles
        activeTargets.forEach(target => {
            target.isHover = target === hoverTarget;
        });
    };
    
    /**
     * Gère les touches du clavier
     * @param {KeyboardEvent} event
     */
    const handleKeydown = (event) => {
        switch (event.key) {
            case ' ':
                event.preventDefault();
                if (isPlaying) {
                    togglePause();
                } else {
                    startGame();
                }
                break;
                
            case 'Escape':
                if (isPlaying && !isPaused) {
                    togglePause();
                }
                break;
                
            case 'r':
            case 'R':
                if (!isPlaying) {
                    resetGame();
                }
                break;
        }
    };
    
    /**
     * Gère le changement de visibilité
     */
    const handleVisibilityChange = () => {
        if (document.hidden && isPlaying && !isPaused) {
            togglePause();
        }
    };
    
    /**
     * Gère le changement de difficulté
     */
    const handleDifficultyChange = () => {
        if (!isPlaying) {
            currentDifficulty = difficultySelect.value;
        }
    };
    
    /**
     * Gère le changement de mode
     */
    const handleModeChange = () => {
        if (!isPlaying) {
            currentMode = modeSelect.value;
            updateTimerDisplay();
        }
    };
    
    // =============================================================================
    // LOGIQUE DU JEU
    // =============================================================================
    
    /**
     * Démarre le jeu
     */
    const startGame = () => {
        if (isPlaying) return;
        
        console.log('🚀 Starting game...');
        
        // Réinitialiser les variables
        resetGameState();
        
        // Mettre à jour l'état
        isPlaying = true;
        isPaused = false;
        
        // Mettre à jour l'UI
        updateUI();
        
        // Démarrer le timer
        startTimer();
        
        // Démarrer le spawn des cibles
        startTargetSpawning();
        
        // Démarrer le rendu
        startRendering();
        
        // Jouer le son de début
        playStartSound();
        
        // Annoncer le début du jeu
        if (window.Accessibility) {
            window.Accessibility.announceStatusChange('Game started');
        }
    };
    
    /**
     * Bascule la pause
     */
    const togglePause = () => {
        if (!isPlaying) return;
        
        isPaused = !isPaused;
        
        if (isPaused) {
            pauseGame();
        } else {
            resumeGame();
        }
        
        updateUI();
    };
    
    /**
     * Met le jeu en pause
     */
    const pauseGame = () => {
        console.log('⏸️ Game paused');
        
        // Arrêter les timers
        clearInterval(gameTimer);
        clearInterval(targetSpawnTimer);
        
        // Annoncer la pause
        if (window.Accessibility) {
            window.Accessibility.announceStatusChange('Game paused');
        }
    };
    
    /**
     * Reprend le jeu
     */
    const resumeGame = () => {
        console.log('▶️ Game resumed');
        
        // Redémarrer les timers
        startTimer();
        startTargetSpawning();
        
        // Annoncer la reprise
        if (window.Accessibility) {
            window.Accessibility.announceStatusChange('Game resumed');
        }
    };
    
    /**
     * Réinitialise le jeu
     */
    const resetGame = () => {
        console.log('🔄 Resetting game...');
        
        // Arrêter le jeu
        stopGame();
        
        // Réinitialiser l'état
        resetGameState();
        
        // Mettre à jour l'UI
        updateUI();
        
        // Redessiner le canvas
        render();
    };
    
    /**
     * Arrête le jeu
     */
    const stopGame = () => {
        if (!isPlaying) return;
        
        console.log('🛑 Stopping game...');
        
        isPlaying = false;
        isPaused = false;
        
        // Arrêter les timers
        clearInterval(gameTimer);
        clearInterval(targetSpawnTimer);
        
        // Vider les cibles
        activeTargets = [];
    };
    
    /**
     * Termine le jeu
     */
    const endGame = () => {
        console.log('🏁 Game ended');
        
        stopGame();
        
        // Calculer le score final
        calculateFinalScore();
        
        // Afficher le modal de fin
        showGameOverModal();
        
        // Sauvegarder le score
        saveToLeaderboard();
        
        // Jouer le son de fin
        playEndSound();
        
        // Annoncer la fin du jeu
        if (window.Accessibility) {
            window.Accessibility.announceStatusChange(`Game over. Final score: ${score}`);
        }
    };
    
    // =============================================================================
    // GESTION DES CIBLES
    // =============================================================================
    
    /**
     * Vérifie si une cible est touchée
     * @param {number} x
     * @param {number} y
     */
    const checkTargetHit = (x, y) => {
        for (let i = activeTargets.length - 1; i >= 0; i--) {
            const target = activeTargets[i];
            const distance = Math.sqrt(
                Math.pow(x - target.x, 2) + 
                Math.pow(y - target.y, 2)
            );
            
            if (distance <= target.radius) {
                return target;
            }
        }
        
        return null;
    };
    
    /**
     * Fait apparaître une cible
     */
    const spawnTarget = () => {
        if (!isPlaying || isPaused) return;
        
        const target = {
            id: Date.now() + Math.random(),
            x: Math.random() * (gameCanvas.width - config.targetSize[currentDifficulty] * 2) + 
               config.targetSize[currentDifficulty],
            y: Math.random() * (gameCanvas.height - config.targetSize[currentDifficulty] * 2) + 
               config.targetSize[currentDifficulty],
            radius: config.targetSize[currentDifficulty],
            spawnTime: Date.now(),
            lifetime: config.targetLifetime[currentDifficulty],
            isHover: false,
            opacity: 1
        };
        
        activeTargets.push(target);
        
        // Supprimer la cible après sa durée de vie
        setTimeout(() => {
            const index = activeTargets.findIndex(t => t.id === target.id);
            if (index !== -1) {
                activeTargets.splice(index, 1);
                targetsMissed++;
                updateAccuracy();
            }
        }, target.lifetime);
    };
    
    /**
     * Gère le hit d'une cible
     * @param {Object} target
     */
    const hitTarget = (target) => {
        // Supprimer la cible
        const index = activeTargets.findIndex(t => t.id === target.id);
        if (index !== -1) {
            activeTargets.splice(index, 1);
        }
        
        // Mettre à jour les statistiques
        targetsHit++;
        score += 10 * config.scoreMultiplier[currentDifficulty];
        updateAccuracy();
        
        // Mettre à jour l'affichage
        updateScoreDisplay();
        
        // Effets visuels
        showHitEffect(target.x, target.y);
        
        // Son
        playHitSound();
        
        // Feedback haptique (si supporté)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    };
    
    /**
     * Démarre le spawn des cibles
     */
    const startTargetSpawning = () => {
        targetSpawnTimer = setInterval(() => {
            spawnTarget();
        }, config.targetSpawnRate[currentDifficulty]);
    };
    
    // =============================================================================
    // TIMER ET SCORE
    // =============================================================================
    
    /**
     * Démarre le timer
     */
    const startTimer = () => {
        gameTimer = setInterval(() => {
            if (currentMode === 'timed') {
                timeLeft--;
                updateTimerDisplay();
                
                if (timeLeft <= 0) {
                    endGame();
                }
            } else {
                // Mode endless - incrémenter le temps
                timeLeft++;
                updateTimerDisplay();
            }
        }, 1000);
    };
    
    /**
     * Met à jour l'affichage du score
     */
    const updateScoreDisplay = () => {
        if (scoreDisplay) {
            scoreDisplay.textContent = score;
        }
    };
    
    /**
     * Met à jour l'affichage du timer
     */
    const updateTimerDisplay = () => {
        if (timerDisplay) {
            if (currentMode === 'timed') {
                timerDisplay.textContent = timeLeft;
            } else {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }
    };
    
    /**
     * Met à jour l'affichage de la précision
     */
    const updateAccuracy = () => {
        const total = targetsHit + targetsMissed;
        accuracy = total > 0 ? Math.round((targetsHit / total) * 100) : 100;
        
        if (accuracyDisplay) {
            accuracyDisplay.textContent = `${accuracy}%`;
        }
    };
    
    /**
     * Calcule le score final
     */
    const calculateFinalScore = () => {
        // Bonus de précision
        const accuracyBonus = accuracy * 10;
        score += accuracyBonus;
        
        // Multiplicateur de difficulté
        score *= config.scoreMultiplier[currentDifficulty];
    };
    
    // =============================================================================
    // RENDU
    // =============================================================================
    
    /**
     * Démarre le rendu
     */
    const startRendering = () => {
        const render = () => {
            // Garde de sécurité : arrêter si le module n'est pas initialisé
            if (!isInitialized || !gameCanvas) {
                console.warn('⚠️ Rendering stopped: module not properly initialized');
                return;
            }
            
            if (isPlaying && !isPaused) {
                try {
                    draw();
                    requestAnimationFrame(render);
                } catch (error) {
                    console.error('❌ Render error:', error);
                    // Ne pas rappeler requestAnimationFrame pour éviter la boucle infinie
                }
            }
        };
        
        render();
    };
    
    /**
     * Dessine le jeu
     */
    const draw = () => {
        const ctx = gameCanvas.getContext('2d');
        
        // Effacer le canvas
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        // Dessiner l'arrière-plan
        ctx.fillStyle = config.colors.background;
        ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        // Dessiner les cibles
        activeTargets.forEach(target => {
            drawTarget(ctx, target);
        });
        
        // Dessiner les effets
        drawEffects(ctx);
    };
    
    /**
     * Dessine une cible
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} target
     */
    const drawTarget = (ctx, target) => {
        const opacity = 1 - ((Date.now() - target.spawnTime) / target.lifetime) * 0.5;
        
        // Cercle extérieur
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        ctx.strokeStyle = target.isHover ? 
            config.colors.targetHover : 
            config.colors.target;
        ctx.lineWidth = 3;
        ctx.globalAlpha = opacity;
        ctx.stroke();
        
        // Cercle moyen
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = target.isHover ? 
            config.colors.targetHover : 
            config.colors.target;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Cercle intérieur
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = target.isHover ? 
            config.colors.targetHover : 
            config.colors.target;
        ctx.fill();
        
        ctx.globalAlpha = 1;
    };
    
    /**
     * Dessine les effets
     * @param {CanvasRenderingContext2D} ctx
     */
    const drawEffects = (ctx) => {
        // À implémenter : particules, traînées, etc.
    };
    
    // =============================================================================
    // EFFETS VISUELS
    // =============================================================================
    
    /**
     * Affiche l'effet de hit
     * @param {number} x
     * @param {number} y
     */
    const showHitEffect = (x, y) => {
        // Créer des particules d'explosion
        if (window.Effects) {
            // À implémenter avec GSAP
        }
    };
    
    /**
     * Affiche l'effet de miss
     * @param {number} x
     * @param {number} y
     */
    const showMissEffect = (x, y) => {
        // Effet visuel de miss
        const ctx = gameCanvas.getContext('2d');
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.strokeStyle = config.colors.targetMiss;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        setTimeout(() => {
            draw(); // Redessiner pour effacer
        }, 200);
    };
    
    // =============================================================================
    // SONS
    // =============================================================================
    
    /**
     * Joue le son de début
     */
    const playStartSound = () => {
        // À implémenter avec Web Audio API
    };
    
    /**
     * Joue le son de hit
     */
    const playHitSound = () => {
        // À implémenter avec Web Audio API
    };
    
    /**
     * Joue le son de miss
     */
    const playMissSound = () => {
        // À implémenter avec Web Audio API
    };
    
    /**
     * Joue le son de fin
     */
    const playEndSound = () => {
        // À implémenter avec Web Audio API
    };
    
    // =============================================================================
    // LEADERBOARD
    // =============================================================================
    
    /**
     * Charge le leaderboard
     */
    const loadLeaderboard = () => {
        const saved = localStorage.getItem('aimTrainerLeaderboard');
        if (saved) {
            leaderboard = JSON.parse(saved);
        }
    };
    
    /**
     * Sauvegarde dans le leaderboard
     */
    const saveToLeaderboard = () => {
        const entry = {
            score: score,
            accuracy: accuracy,
            difficulty: currentDifficulty,
            mode: currentMode,
            date: new Date().toISOString()
        };
        
        leaderboard.push(entry);
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10); // Garder les 10 meilleurs
        
        localStorage.setItem('aimTrainerLeaderboard', JSON.stringify(leaderboard));
    };
    
    /**
     * Affiche le leaderboard
     */
    const showLeaderboard = () => {
        // À implémenter : modal avec le classement
    };
    
    // =============================================================================
    // UTILITAIRES
    // =============================================================================
    
    /**
     * Réinitialise l'état du jeu
     */
    const resetGameState = () => {
        score = 0;
        timeLeft = config.gameDuration[currentMode];
        targetsHit = 0;
        targetsMissed = 0;
        accuracy = 100;
        activeTargets = [];
        
        updateScoreDisplay();
        updateTimerDisplay();
        updateAccuracy();
    };
    
    /**
     * Met à jour l'UI
     */
    const updateUI = () => {
        // Boutons
        if (startButton) {
            startButton.style.display = isPlaying ? 'none' : 'block';
        }
        
        if (pauseButton) {
            pauseButton.style.display = isPlaying ? 'block' : 'none';
            pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
        }
        
        if (resetButton) {
            resetButton.style.display = !isPlaying ? 'block' : 'none';
        }
        
        // Sélecteurs
        if (difficultySelect) {
            difficultySelect.disabled = isPlaying;
        }
        
        if (modeSelect) {
            modeSelect.disabled = isPlaying;
        }
    };
    
    /**
     * Affiche le modal de fin de jeu
     */
    const showGameOverModal = () => {
        if (gameOverModal && finalScoreDisplay) {
            finalScoreDisplay.textContent = score;
            gameOverModal.style.display = 'flex';
            
            // Focus sur le bouton de fermeture
            const closeButton = gameOverModal.querySelector('[data-dismiss="modal"]');
            closeButton?.focus();
        }
    };
    
    // =============================================================================
    // API PUBLIQUE
    // =============================================================================
    
    return {
        // Initialisation
        init,
        isInitialized: () => isInitialized,
        
        // Contrôle du jeu
        startGame,
        pauseGame,
        resumeGame,
        isPaused: () => isPaused,
        isPlaying: () => isPlaying,
        resetGame,
        endGame,
        togglePause,
        
        // Statistiques
        getScore: () => score,
        getAccuracy: () => accuracy,
        getTimeLeft: () => timeLeft,
        
        // Leaderboard
        getLeaderboard: () => [...leaderboard],
        showLeaderboard,
        
        // Configuration
        getConfig: () => ({ ...config })
    };
})();

// =============================================================================
// EXPORT POUR LES TESTS ET LA DÉBUGAGE
// =============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
} else {
    window.Game = Game;
}