#!/bin/bash

# Script de déploiement pour GitHub Pages
# Déploie le projet sur la branche gh-pages

# Configuration
REPO_URL="https://github.com/zesty/tests_IA.git"
BRANCH="gh-pages"
MESSAGE="Deploy to GitHub Pages $(date +'%Y-%m-%d %H:%M:%S')"

# Vérification que git est installé
if ! command -v git &> /dev/null; then
    echo "Erreur: git n'est pas installé. Veuillez installer git d'abord."
    exit 1
fi

# Vérification que le répertoire est un dépôt git
if [ ! -d ".git" ]; then
    echo "Erreur: Ce répertoire n'est pas un dépôt git."
    exit 1
fi

# Création d'un répertoire temporaire pour le déploiement
TEMP_DIR=$(mktemp -d)
echo "Création d'un répertoire temporaire: $TEMP_DIR"

# Clonage de la branche gh-pages
echo "Clonage de la branche gh-pages..."
git clone --branch $BRANCH $REPO_URL $TEMP_DIR

if [ $? -ne 0 ]; then
    echo "La branche gh-pages n'existe pas, création..."
    git checkout --orphan $BRANCH
    git reset --hard
    git commit --allow-empty -m "Initial commit for gh-pages"
    git push origin $BRANCH
    git clone --branch $BRANCH $REPO_URL $TEMP_DIR
fi

# Copie des fichiers (sauf certains fichiers/dossiers)
echo "Copie des fichiers..."
rsync -av --progress --exclude='.git*' --exclude='node_modules' --exclude='*.sh' --exclude='README.md' --exclude='*.log' ./ $TEMP_DIR/

# Commit et push
cd $TEMP_DIR
git add .
git commit -m "$MESSAGE"

echo "Déploiement sur GitHub Pages..."
git push origin $BRANCH

if [ $? -eq 0 ]; then
    echo "Déploiement réussi!"
    echo "Le site sera disponible sur: https://zesty.github.io/tests_IA/"
else
    echo "Erreur lors du déploiement."
    exit 1
fi

# Nettoyage
cd ..
rm -rf $TEMP_DIR