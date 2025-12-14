#!/bin/bash

# Script de synchronisation pour le déploiement sur le serveur de développement
# Utilise rclone pour transférer les fichiers vers le serveur distant

# Configuration rclone (à adapter selon votre configuration)
RCLONE_REMOTE="dev_server"
RCLONE_PATH="website"

# Vérification que rclone est installé
if ! command -v rclone &> /dev/null; then
    echo "Erreur: rclone n'est pas installé. Veuillez installer rclone d'abord."
    echo "Installation: sudo apt-get install rclone"
    exit 1
fi

# Vérification de la configuration rclone
if ! rclone listremotes | grep -q "$RCLONE_REMOTE"; then
    echo "Erreur: Le remote rclone '$RCLONE_REMOTE' n'est pas configuré."
    echo "Veuillez configurer rclone avec: rclone config"
    exit 1
fi

# Synchronisation des fichiers
echo "Début de la synchronisation avec le serveur de développement..."
rclone sync ./ "$RCLONE_REMOTE:$RCLONE_PATH" \
    --progress \
    --exclude=".git*" \
    --exclude="node_modules" \
    --exclude="*.log" \
    --exclude="sync_rclone.sh"

if [ $? -eq 0 ]; then
    echo "Synchronisation terminée avec succès!"
    echo "Le site est maintenant déployé sur https://dev.website.com"
else
    echo "Erreur lors de la synchronisation."
    exit 1
fi