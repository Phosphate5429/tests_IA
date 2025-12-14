/**
 * AUDIO.JS - Module de visualisation audio
 * 
 * Responsabilités :
 * - Analyse audio en temps réel
 * - Visualisation avec Canvas et Chart.js
 * - Support microphone et fichiers audio
 * - Effets sonores interactifs
 * - Optimisation des performances
 * 
 * Pattern : Revealing Module Pattern
 */

const Audio = (() => {
    // =============================================================================
    // VARIABLES PRIVÉES
    // =============================================================================
    
    let isInitialized = false;
    let isPlaying = false;
    let isPaused = false;
    let isVisualizing = false;
    let audioContext, analyser, dataArray, bufferLength;
    let source = null;
    let visualizationCanvas, visualizationCtx;
    let chart = null;
    let currentVisualizationType = 'bars';
    let microphoneStream = null;
    
    // Configuration
    const config = {
        fftSize: 2048,
        smoothingTimeConstant: 0.8,
        minDecibels: -90,
        maxDecibels: -10,
        visualizationTypes: ['bars', 'waveform', 'circle', 'particles', 'spectrum'],
        colors: {
            primary: '#00ffff',
            secondary: '#ff00ff',
            accent: '#ffff00',
            background: 'rgba(10, 10, 10, 0.9)'
        }
    };
    
    // Éléments DOM
    let audioFileInput, microphoneButton;
    let playButton, pauseButton, stopButton;
    let visualizationTypeSelect, sensitivitySlider;
    let volumeSlider, frequencyDisplay;
    
    // =============================================================================
    // INITIALISATION
    // =============================================================================
    
    /**
     * Initialise le module audio
     */
    const init = () => {
        if (isInitialized) return;
        
        console.log('🎵 Initializing Audio Module...');
        
        // Obtenir les références DOM
        getDOMElements();
        
        // Initialiser l'audio context
        initializeAudioContext();
        
        // Configurer les écouteurs d'événements
        bindEvents();
        
        // Initialiser le canvas
        setupCanvas();
        
        isInitialized = true;
        
        console.log('✅ Audio Module initialized');
    };
    
    /**
     * Obtient les références des éléments DOM
     */
    const getDOMElements = () => {
        audioFileInput = document.getElementById('audio-file-input');
        microphoneButton = document.getElementById('microphone-button');
        
        playButton = document.getElementById('audio-play');
        pauseButton = document.getElementById('audio-pause');
        stopButton = document.getElementById('audio-stop');
        
        visualizationTypeSelect = document.getElementById('visualization-type');
        sensitivitySlider = document.getElementById('sensitivity-slider');
        volumeSlider = document.getElementById('volume-slider');
        
        frequencyDisplay = document.getElementById('frequency-display');
        visualizationCanvas = document.getElementById('audio-visualization');
    };
    
    /**
     * Initialise l'audio context
     */
    const initializeAudioContext = () => {
        try {
            // Créer l'audio context
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Créer l'analyseur
            analyser = audioContext.createAnalyser();
            analyser.fftSize = config.fftSize;
            analyser.smoothingTimeConstant = config.smoothingTimeConstant;
            analyser.minDecibels = config.minDecibels;
            analyser.maxDecibels = config.maxDecibels;
            
            // Créer le tableau de données
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            dataArray.fill(0);
            
            console.log(`🎵 Audio context initialized with ${bufferLength} frequency bins`);
            
        } catch (error) {
            console.error('❌ Failed to initialize audio context:', error);
        }
    };
    
    /**
     * Configure le canvas
     */
    const setupCanvas = () => {
        if (!visualizationCanvas) return;
        
        visualizationCanvas.width = visualizationCanvas.offsetWidth;
        visualizationCanvas.height = visualizationCanvas.offsetHeight;
        
        visualizationCtx = visualizationCanvas.getContext('2d');
        visualizationCtx.imageSmoothingEnabled = true;
    };
    
    // =============================================================================
    // GESTION DES ÉVÉNEMENTS
    // =============================================================================
    
    /**
     * Configure les écouteurs d'événements
     */
    const bindEvents = () => {
        // Boutons de contrôle
        playButton?.addEventListener('click', play);
        pauseButton?.addEventListener('click', pause);
        stopButton?.addEventListener('click', stop);
        
        // Fichier audio
        audioFileInput?.addEventListener('change', handleFileSelect);
        
        // Microphone
        microphoneButton?.addEventListener('click', toggleMicrophone);
        
        // Contrôles
        visualizationTypeSelect?.addEventListener('change', handleVisualizationChange);
        sensitivitySlider?.addEventListener('input', handleSensitivityChange);
        volumeSlider?.addEventListener('input', handleVolumeChange);
        
        // Redimensionnement
        window.addEventListener('resize', handleResize);
        
        // Visibilité
        document.addEventListener('visibilitychange', handleVisibilityChange);
    };
    
    /**
     * Gère la sélection de fichier
     * @param {Event} event
     */
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        console.log('📁 Loading audio file:', file.name);
        
        // Arrêter le microphone si actif
        if (microphoneStream) {
            stopMicrophone();
        }
        
        // Charger le fichier
        loadAudioFile(file);
    };
    
    /**
     * Gère le changement de type de visualisation
     */
    const handleVisualizationChange = () => {
        if (visualizationTypeSelect) {
            currentVisualizationType = visualizationTypeSelect.value;
            console.log(`🎨 Visualization type changed to: ${currentVisualizationType}`);
        }
    };
    
    /**
     * Gère le changement de sensibilité
     */
    const handleSensitivityChange = () => {
        if (sensitivitySlider && analyser) {
            const value = parseFloat(sensitivitySlider.value);
            analyser.smoothingTimeConstant = value;
        }
    };
    
    /**
     * Gère le changement de volume
     */
    const handleVolumeChange = () => {
        if (volumeSlider && source) {
            const value = parseFloat(volumeSlider.value);
            source.gain.value = value;
        }
    };
    
    /**
     * Gère le redimensionnement
     */
    const handleResize = () => {
        if (visualizationCanvas) {
            visualizationCanvas.width = visualizationCanvas.offsetWidth;
            visualizationCanvas.height = visualizationCanvas.offsetHeight;
        }
    };
    
    /**
     * Gère le changement de visibilité
     */
    const handleVisibilityChange = () => {
        if (document.hidden && isVisualizing) {
            pauseVisualization();
        } else if (!document.hidden && isPlaying && !isPaused) {
            resumeVisualization();
        }
    };
    
    // =============================================================================
    // CHARGEMENT AUDIO
    // =============================================================================
    
    /**
     * Charge un fichier audio
     * @param {File} file
     */
    const loadAudioFile = (file) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const arrayBuffer = event.target.result;
            
            // Décoder les données audio
            audioContext.decodeAudioData(arrayBuffer)
                .then((audioBuffer) => {
                    console.log('✅ Audio file loaded successfully');
                    createSourceFromBuffer(audioBuffer);
                })
                .catch((error) => {
                    console.error('❌ Failed to decode audio data:', error);
                });
        };
        
        reader.readAsArrayBuffer(file);
    };
    
    /**
     * Crée une source à partir d'un buffer audio
     * @param {AudioBuffer} audioBuffer
     */
    const createSourceFromBuffer = (audioBuffer) => {
        // Arrêter la source actuelle
        if (source) {
            source.stop();
            source.disconnect();
        }
        
        // Créer une nouvelle source
        const bufferSource = audioContext.createBufferSource();
        bufferSource.buffer = audioBuffer;
        
        // Créer un nœud de gain pour le volume
        const gainNode = audioContext.createGain();
        gainNode.gain.value = volumeSlider ? parseFloat(volumeSlider.value) : 0.5;
        
        // Connecter les nœuds
        bufferSource.connect(gainNode);
        gainNode.connect(analyser);
        analyser.connect(audioContext.destination);
        
        source = {
            node: bufferSource,
            gain: gainNode,
            type: 'buffer'
        };
        
        // Gérer la fin de la lecture
        bufferSource.onended = () => {
            console.log('⏹️ Audio finished playing');
            stop();
        };
        
        // Mettre à jour l'UI
        updateUI();
    };
    
    // =============================================================================
    // MICROPHONE
    // =============================================================================
    
    /**
     * Bascule le microphone
     */
    const toggleMicrophone = async () => {
        if (microphoneStream) {
            stopMicrophone();
        } else {
            await startMicrophone();
        }
    };
    
    /**
     * Démarre le microphone
     */
    const startMicrophone = async () => {
        try {
            console.log('🎤 Starting microphone...');
            
            // Demander l'accès au microphone
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: false 
            });
            
            microphoneStream = stream;
            
            // Arrêter la source actuelle
            if (source) {
                source.node.stop();
                source.disconnect();
            }
            
            // Créer une source microphone
            const mediaStreamSource = audioContext.createMediaStreamSource(stream);
            
            // Créer un nœud de gain
            const gainNode = audioContext.createGain();
            gainNode.gain.value = volumeSlider ? parseFloat(volumeSlider.value) : 0.5;
            
            // Connecter les nœuds
            mediaStreamSource.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(audioContext.destination);
            
            source = {
                node: mediaStreamSource,
                gain: gainNode,
                stream: stream,
                type: 'microphone'
            };
            
            // Mettre à jour l'UI
            updateUI();
            
            // Démarrer la visualisation
            if (!isVisualizing) {
                startVisualization();
            }
            
            console.log('✅ Microphone started');
            
        } catch (error) {
            console.error('❌ Failed to start microphone:', error);
            
            // Annoncer l'erreur
            if (window.Accessibility) {
                window.Accessibility.announceStatusChange('Microphone access denied');
            }
        }
    };
    
    /**
     * Arrête le microphone
     */
    const stopMicrophone = () => {
        if (!microphoneStream) return;
        
        console.log('🎤 Stopping microphone...');
        
        // Arrêter les pistes
        microphoneStream.getTracks().forEach(track => track.stop());
        microphoneStream = null;
        
        // Déconnecter la source
        if (source) {
            source.node.disconnect();
            source = null;
        }
        
        // Arrêter la visualisation
        stopVisualization();
        
        // Mettre à jour l'UI
        updateUI();
        
        console.log('✅ Microphone stopped');
    };
    
    // =============================================================================
    // CONTRÔLE DE LA LECTURE
    // =============================================================================
    
    /**
     * Joue l'audio
     */
    const play = () => {
        if (isPlaying && !isPaused) return;
        
        console.log('▶️ Playing audio...');
        
        if (isPaused) {
            // Reprendre
            audioContext.resume();
            isPaused = false;
        } else {
            // Démarrer
            if (source && source.type === 'buffer') {
                source.node.start();
                isPlaying = true;
            }
        }
        
        // Démarrer la visualisation
        if (!isVisualizing) {
            startVisualization();
        }
        
        // Mettre à jour l'UI
        updateUI();
    };
    
    /**
     * Met en pause l'audio
     */
    const pause = () => {
        if (!isPlaying || isPaused) return;
        
        console.log('⏸️ Pausing audio...');
        
        audioContext.suspend();
        isPaused = true;
        
        // Mettre à jour l'UI
        updateUI();
    };
    
    /**
     * Arrête l'audio
     */
    const stop = () => {
        console.log('⏹️ Stopping audio...');
        
        if (source && source.type === 'buffer') {
            source.node.stop();
            source.node.disconnect();
            source = null;
        }
        
        isPlaying = false;
        isPaused = false;
        
        // Arrêter la visualisation
        stopVisualization();
        
        // Mettre à jour l'UI
        updateUI();
    };
    
    // =============================================================================
    // VISUALISATION
    // =============================================================================
    
    /**
     * Démarre la visualisation
     */
    const startVisualization = () => {
        if (isVisualizing) return;
        
        console.log('🎨 Starting visualization...');
        
        isVisualizing = true;
        
        // Démarrer la boucle de rendu
        visualize();
    };
    
    /**
     * Arrête la visualisation
     */
    const stopVisualization = () => {
        if (!isVisualizing) return;
        
        console.log('🎨 Stopping visualization...');
        
        isVisualizing = false;
        
        // Effacer le canvas
        if (visualizationCtx) {
            visualizationCtx.clearRect(0, 0, visualizationCanvas.width, visualizationCanvas.height);
        }
    };
    
    /**
     * Met en pause la visualisation
     */
    const pauseVisualization = () => {
        isVisualizing = false;
    };
    
    /**
     * Reprend la visualisation
     */
    const resumeVisualization = () => {
        if (isPlaying && !isPaused) {
            isVisualizing = true;
            visualize();
        }
    };
    
    /**
     * Boucle de visualisation
     */
    const visualize = () => {
        // Garde de sécurité : arrêter si le module n'est pas initialisé
        if (!isInitialized || !isVisualizing || !analyser || !visualizationCanvas) {
            console.warn('⚠️ Visualization stopped: module not properly initialized');
            return;
        }
        
        try {
            // Obtenir les données de fréquence
            analyser.getByteFrequencyData(dataArray);
            
            // Mettre à jour l'affichage de fréquence
            updateFrequencyDisplay();
            
            // Dessiner la visualisation
            drawVisualization();
            
            // Continuer la boucle
            requestAnimationFrame(visualize);
        } catch (error) {
            console.error('❌ Visualization error:', error);
            // Ne pas rappeler requestAnimationFrame pour éviter la boucle infinie
        }
    };
    
    /**
     * Dessine la visualisation
     */
    const drawVisualization = () => {
        if (!visualizationCtx || !visualizationCanvas) return;
        
        const width = visualizationCanvas.width;
        const height = visualizationCanvas.height;
        
        // Effacer le canvas
        visualizationCtx.fillStyle = config.colors.background;
        visualizationCtx.fillRect(0, 0, width, height);
        
        // Dessiner en fonction du type
        switch (currentVisualizationType) {
            case 'bars':
                drawBars();
                break;
            case 'waveform':
                drawWaveform();
                break;
            case 'circle':
                drawCircle();
                break;
            case 'particles':
                drawParticles();
                break;
            case 'spectrum':
                drawSpectrum();
                break;
        }
    };
    
    /**
     * Dessine les barres de fréquence
     */
    const drawBars = () => {
        const width = visualizationCanvas.width;
        const height = visualizationCanvas.height;
        const barWidth = (width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * height;
            
            // Couleur en fonction de la fréquence
            const hue = (i / bufferLength) * 360;
            visualizationCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            
            // Dessiner la barre
            visualizationCtx.fillRect(
                x, 
                height - barHeight, 
                barWidth, 
                barHeight
            );
            
            x += barWidth + 1;
        }
    };
    
    /**
     * Dessine la forme d'onde
     */
    const drawWaveform = () => {
        const width = visualizationCanvas.width;
        const height = visualizationCanvas.height;
        const centerY = height / 2;
        
        visualizationCtx.beginPath();
        visualizationCtx.strokeStyle = config.colors.primary;
        visualizationCtx.lineWidth = 2;
        
        const sliceWidth = width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 255;
            const y = v * height;
            
            if (i === 0) {
                visualizationCtx.moveTo(x, y);
            } else {
                visualizationCtx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        visualizationCtx.lineTo(width, centerY);
        visualizationCtx.stroke();
    };
    
    /**
     * Dessine le cercle de fréquence
     */
    const drawCircle = () => {
        const width = visualizationCanvas.width;
        const height = visualizationCanvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;
        
        visualizationCtx.beginPath();
        visualizationCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        visualizationCtx.strokeStyle = config.colors.secondary;
        visualizationCtx.lineWidth = 2;
        visualizationCtx.stroke();
        
        // Dessiner les barres radiales
        for (let i = 0; i < bufferLength; i += 4) {
            const angle = (i / bufferLength) * Math.PI * 2;
            const barLength = (dataArray[i] / 255) * radius;
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barLength);
            const y2 = centerY + Math.sin(angle) * (radius + barLength);
            
            visualizationCtx.beginPath();
            visualizationCtx.moveTo(x1, y1);
            visualizationCtx.lineTo(x2, y2);
            
            const hue = (i / bufferLength) * 360;
            visualizationCtx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
            visualizationCtx.lineWidth = 2;
            visualizationCtx.stroke();
        }
    };
    
    /**
     * Dessine les particules
     */
    const drawParticles = () => {
        const width = visualizationCanvas.width;
        const height = visualizationCanvas.height;
        
        for (let i = 0; i < bufferLength; i += 8) {
            const x = (i / bufferLength) * width;
            const y = height / 2;
            const size = (dataArray[i] / 255) * 20;
            
            visualizationCtx.beginPath();
            visualizationCtx.arc(x, y, size, 0, Math.PI * 2);
            
            const hue = (i / bufferLength) * 360;
            visualizationCtx.fillStyle = `hsla(${hue}, 100%, 50%, 0.7)`;
            visualizationCtx.fill();
        }
    };
    
    /**
     * Dessine le spectre
     */
    const drawSpectrum = () => {
        const width = visualizationCanvas.width;
        const height = visualizationCanvas.height;
        
        visualizationCtx.beginPath();
        
        const sliceWidth = width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 255;
            const y = (1 - v) * height;
            
            if (i === 0) {
                visualizationCtx.moveTo(x, y);
            } else {
                visualizationCtx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        visualizationCtx.lineTo(width, height);
        visualizationCtx.lineTo(0, height);
        visualizationCtx.closePath();
        
        const gradient = visualizationCtx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, config.colors.primary);
        gradient.addColorStop(1, config.colors.secondary);
        
        visualizationCtx.fillStyle = gradient;
        visualizationCtx.fill();
    };
    
    /**
     * Met à jour l'affichage de fréquence
     */
    const updateFrequencyDisplay = () => {
        if (!frequencyDisplay) return;
        
        // Calculer la fréquence dominante
        let maxValue = 0;
        let maxIndex = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            if (dataArray[i] > maxValue) {
                maxValue = dataArray[i];
                maxIndex = i;
            }
        }
        
        // Convertir l'index en fréquence
        const frequency = (maxIndex * audioContext.sampleRate) / config.fftSize;
        
        // Mettre à jour l'affichage
        frequencyDisplay.textContent = `${Math.round(frequency)} Hz`;
    };
    
    // =============================================================================
    // GESTION DE L'UI
    // =============================================================================
    
    /**
     * Met à jour l'UI
     */
    const updateUI = () => {
        // Boutons
        if (playButton) {
            playButton.style.display = !isPlaying || isPaused ? 'block' : 'none';
        }
        
        if (pauseButton) {
            pauseButton.style.display = isPlaying && !isPaused ? 'block' : 'none';
        }
        
        if (stopButton) {
            stopButton.style.display = isPlaying ? 'block' : 'none';
        }
        
        // Microphone
        if (microphoneButton) {
            microphoneButton.textContent = microphoneStream ? 'Stop Mic' : 'Start Mic';
            microphoneButton.classList.toggle('active', microphoneStream !== null);
        }
    };
    
    // =============================================================================
    // EFFETS SONORES
    // =============================================================================
    
    /**
     * Joue un son de notification
     * @param {number} frequency
     * @param {number} duration
     */
    const playNotificationSound = (frequency = 440, duration = 0.1) => {
        // Créer un oscillateur
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    };
    
    // =============================================================================
    // API PUBLIQUE
    // =============================================================================
    
    return {
        // Initialisation
        init,
        isInitialized: () => isInitialized,
        
        // Contrôle audio
        play,
        pause,
        stop,
        isPlaying: () => isPlaying,
        isPaused: () => isPaused,
        
        // Microphone
        startMicrophone,
        stopMicrophone,
        toggleMicrophone,
        
        // Visualisation
        startVisualization,
        stopVisualization,
        isVisualizing: () => isVisualizing,
        
        // Effets sonores
        playNotificationSound,
        
        // Configuration
        getConfig: () => ({ ...config }),
        
        // Données
        getFrequencyData: () => dataArray ? [...dataArray] : []
    };
})();

// =============================================================================
// EXPORT POUR LES TESTS ET LA DÉBUGAGE
// =============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Audio;
} else {
    window.Audio = Audio;
}