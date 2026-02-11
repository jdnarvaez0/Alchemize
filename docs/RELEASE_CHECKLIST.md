# ✅ Checklist de Publicación - Alchemize

## Resumen Rápido

### 1. Preparar Repo (Una sola vez)

```bash
# Inicializar git
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "⚗️ Initial commit: Alchemize v1.0.0"

# Conectar con GitHub
git remote add origin https://github.com/TU-USUARIO/alchemize.git

# Subir
git push -u origin main
```

### 2. Configurar GitHub Actions (Automático)

Ya está hecho en `.github/workflows/release.yml`. No necesitas hacer nada más.

### 3. Publicar Nueva Versión (Siempre)

#### Opción A: Con Script (Recomendado)

```bash
npm run release 1.1.0 "Agrega extractor para Medium"
```

#### Opción B: Manual

```bash
# 1. Actualizar versión en manifest.json (cambiar "1.0.0" a "1.1.0")

# 2. Commitear
git add .
git commit -m "chore: bump version to 1.1.0"

# 3. Crear tag
git tag -a v1.1.0 -m "Release v1.1.0"

# 4. Subir
git push origin main
git push origin v1.1.0
```

### 4. Primera vez en Community Plugins

1. Fork https://github.com/obsidianmd/obsidian-releases
2. Edita `community-plugins.json` agregando:
   ```json
   {
     "id": "alchemize",
     "name": "Alchemize",
     "author": "Tu Nombre",
     "description": "Transmuta contenido web en notas Markdown estructuradas",
     "repo": "TU-USUARIO/alchemize"
   }
   ```
3. Commit, push, y crea Pull Request

---

## Checklist Completo

### ✅ Antes de la primera publicación

- [ ] Plugin probado y funcionando en Obsidian
- [ ] README.md completo y claro
- [ ] LICENSE (MIT) agregado
- [ ] manifest.json con datos correctos
- [ ] Código limpio sin datos personales
- [ ] Repo en GitHub con todos los archivos
- [ ] GitHub Actions configurado (`.github/workflows/release.yml`)

### ✅ Para cada release

- [ ] Cambios probados localmente
- [ ] `npm run build` funciona sin errores
- [ ] `manifest.json` versión actualizada
- [ ] `CHANGELOG.md` actualizado
- [ ] Commit de cambios
- [ ] Tag creado (ej: `v1.1.0`)
- [ ] Push a GitHub
- [ ] GitHub Actions completó exitosamente
- [ ] Release aparece en GitHub con archivos adjuntos

### ✅ Para Community Plugins (primera vez)

- [ ] Fork de obsidian-releases
- [ ] Editar community-plugins.json
- [ ] Crear Pull Request
- [ ] Esperar aprobación

---

## ¿Qué pasa detrás?

### Al hacer `git push origin v1.1.0`:

1. **GitHub Actions detecta el tag**
2. **Ejecuta el workflow** (`.github/workflows/release.yml`)
3. **Compila el código** (`npm run build`)
4. **Crea un Release** automáticamente
5. **Adjunta los archivos**: `main.js`, `manifest.json`, `styles.css`

### Resultado:

Los usuarios pueden:
- **Instalar manual**: Descargar archivos del release
- **Instalar desde Community Plugins**: Buscar "Alchemize" y click en Install

---

## Estructura Final del Repo

```
alchemize/
├── .github/
│   └── workflows/
│       └── release.yml      # CI/CD automático ✅
├── scripts/
│   └── release.sh           # Script helper ✅
├── src/                     # Código fuente
├── .gitignore
├── CHANGELOG.md             # Registro de cambios ✅
├── LICENSE                  # MIT License ✅
├── PUBLISHING.md            # Esta guía completa ✅
├── README.md                # Documentación
├── manifest.json            # Metadata del plugin
├── package.json
├── versions.json            # Versiones compatibles
├── main.js                  # Build (generado)
└── styles.css               # Estilos
```

---

## Comandos Útiles

```bash
# Ver estado
git status

# Ver historial
git log --oneline

# Ver tags
git tag

# Eliminar tag local
git tag -d v1.0.0

# Eliminar tag remoto
git push --delete origin v1.0.0

# Ver releases
git log --tags --oneline

# Probar build
npm run build

# Desarrollo continuo
npm run dev
```

---

## Recursos

- [Publishing Plugin Guide](https://docs.obsidian.md/Plugins/Releasing/Publish+your+plugin)
- [Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

**¡Listo para transmutar el conocimiento del mundo!** ⚗️🚀
