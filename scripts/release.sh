#!/bin/bash

# Script para crear releases de Alchemize
# Uso: ./scripts/release.sh 1.1.0 "Agrega extractor para Medium"

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar argumentos
if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes especificar una versión${NC}"
    echo "Uso: ./scripts/release.sh <version> [mensaje]"
    echo "Ejemplo: ./scripts/release.sh 1.1.0 'Agrega extractor para Medium'"
    exit 1
fi

VERSION=$1
MESSAGE=${2:-"Release v$VERSION"}
TAG="v$VERSION"

echo -e "${YELLOW}⚗️ Preparando release de Alchemize $VERSION...${NC}"

# Verificar que estamos en la rama main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo -e "${RED}Error: Debes estar en la rama main o master${NC}"
    echo "Rama actual: $CURRENT_BRANCH"
    exit 1
fi

# Verificar que no hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}Error: Hay cambios sin commitear${NC}"
    echo "Por favor, commitea o stashea todos los cambios primero:"
    echo "  git add ."
    echo "  git commit -m 'mensaje'"
    exit 1
fi

# Actualizar versión en manifest.json
echo -e "${YELLOW}📝 Actualizando manifest.json...${NC}"
sed -i "s/\"version\": \"[0-9.]*\"/\"version\": \"$VERSION\"/" manifest.json

# Actualizar versión en versions.json
echo -e "${YELLOW}📝 Actualizando versions.json...${NC}"
# Leer la versión mínima actual
MIN_APP_VERSION=$(grep -o '"[0-9.]*"' versions.json | head -1 | tr -d '"')
# Crear nuevo contenido
echo "{\n\t\"$VERSION\": \"$MIN_APP_VERSION\"\n}" > versions.json

# Compilar
echo -e "${YELLOW}🔨 Compilando plugin...${NC}"
npm run build

# Verificar que se generaron los archivos
if [ ! -f "main.js" ]; then
    echo -e "${RED}Error: No se generó main.js${NC}"
    exit 1
fi

if [ ! -f "manifest.json" ]; then
    echo -e "${RED}Error: No se encontró manifest.json${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Compilación exitosa${NC}"

# Commitear cambios de versión
echo -e "${YELLOW}💾 Commiteando cambios...${NC}"
git add manifest.json versions.json
git commit -m "chore: bump version to $VERSION"

# Crear tag
echo -e "${YELLOW}🏷️ Creando tag $TAG...${NC}"
git tag -a "$TAG" -m "$MESSAGE"

# Subir a GitHub
echo -e "${YELLOW}🚀 Subiendo a GitHub...${NC}"
git push origin main
git push origin "$TAG"

echo ""
echo -e "${GREEN}✅ Release $VERSION creado exitosamente!${NC}"
echo ""
echo "GitHub Actions debería estar compilando automáticamente."
echo "Verifica el progreso en: https://github.com/$(git remote get-url origin | sed 's/.*github.com\///' | sed 's/\.git$//')/actions"
echo ""
echo "El release aparecerá en: https://github.com/$(git remote get-url origin | sed 's/.*github.com\///' | sed 's/\.git$//')/releases"
