# 📦 Setup de GitHub para Alchemize

Guía para publicar tu plugin en GitHub.

## 1. Crear el Repositorio

```bash
# En GitHub, crear nuevo repositorio llamado "alchemize"
# NO inicializar con README (ya tenemos uno)
```

## 2. Inicializar Git Local

```bash
cd alchemize

# Inicializar repositorio
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "⚗️ Initial commit: Alchemize - Fase I completa

- Smart Transmute con detección automática
- Sistema de extractores extensible
- Extractor genérico (Readability.js)
- Extractor AWS Skill Builder
- Manejo de imágenes
- Previsualización en vivo
- 3 modos de cristalización: Estudio, Referencia, Flashcards

Transmuta el plomo (HTML) en oro (Markdown)."

# Conectar con GitHub
git remote add origin https://github.com/tuusuario/alchemize.git

# Subir cambios
git push -u origin main
```

## 3. Archivos a Incluir

### ✅ Sí incluir
```
manifest.json       # Metadata del plugin
main.js            # Bundle compilado (necesario para instalación manual)
styles.css         # Estilos
README.md          # Documentación principal
LICENSE            # MIT License
versions.json      # Versiones compatibles
```

### ❌ No incluir (agregar a .gitignore)
```
node_modules/      # Dependencias (se instalan con npm)
src/               # Código fuente (opcional, pero recomendado)
package.json       # Configuración npm
tsconfig.json      # Config TypeScript
.esbuild.config.mjs # Config build
docs/              # Imágenes de documentación (si son grandes)
```

**Nota**: Decide si quieres incluir el código fuente (`src/`). 
- **Pros**: Transparencia, otros pueden aprender
- **Cons**: Más archivos en el repo

Recomendación: **Sí incluir src/** para proyectos de portfolio.

## 4. Configurar Releases

### Crear Release v1.0.0

```bash
# Tag de versión
git tag -a 1.0.0 -m "⚗️ Release v1.0.0 - El Fundamento"

# Subir tag
git push origin 1.0.0
```

En GitHub:
1. Ve a "Releases" → "Create a new release"
2. Selecciona tag "1.0.0"
3. Título: "⚗️ Alchemize v1.0.0 - El Fundamento"
4. Descripción:

```markdown
## ⚗️ Alchemize v1.0.0 - El Fundamento

Primera versión funcional del transmutador de conocimiento.

### ✨ Características

- **⚗️ Smart Transmute**: Detecta automáticamente el tipo de contenido
- **📚 Extractores especializados**: Soporte para AWS Skill Builder y genérico
- **🖼️ Captura de esencias**: Imágenes descargadas automáticamente
- **👁️ Previsualización**: Observa antes de cristalizar
- **🎨 3 modos**: Estudio, Referencia, Flashcards

### 📦 Archivos

- `main.js` - Plugin compilado
- `styles.css` - Estilos
- `manifest.json` - Metadata

### 🚀 Instalación

1. Descargar los 3 archivos
2. Copiar a `.obsidian/plugins/alchemize/`
3. Activar en Community Plugins

### 📖 Documentación

Ver [README.md](README.md) para guía completa.

---

**Transmuta el conocimiento. Transforma tu aprendizaje.**
```

5. Adjuntar archivos:
   - `main.js`
   - `styles.css` 
   - `manifest.json`

## 5. Estructura Final del Repo

```
alchemize/
├── .git/                      # Control de versiones
├── .gitignore                 # Archivos ignorados
├── src/                       # Código fuente
│   ├── main.ts
│   ├── extractors/
│   ├── core/
│   └── ui/
├── docs/                      # Imágenes para README
│   └── alchemize-demo.gif
├── examples/                  # Ejemplos de salida
│   └── output-example.md
├── manifest.json              # Metadata plugin
├── main.js                    # Build (incluir o no?)
├── styles.css                 # Estilos
├── README.md                  # Documentación
├── SKILL.md                   # Docs técnicas
├── ARCHITECTURE.md            # Arquitectura
├── QUICKSTART.md              # Guía rápida
├── CONTRIBUTING.md            # Contribuciones
├── PROJECT_SUMMARY.md         # Resumen
├── TECHNOLOGIES.md            # Stack
├── LICENSE                    # MIT
├── package.json               # NPM config
├── tsconfig.json              # TS config
├── esbuild.config.mjs         # Build config
└── GITHUB_SETUP.md            # Este archivo
```

## 6. README Principal

El README.md ya está listo con:
- Badge de descargas (placeholder)
- Badge de versión (placeholder)
- Descripción atractiva
- Instrucciones de instalación
- Ejemplos de uso
- Roadmap

**Actualizar URLs**:
- Reemplaza `tuusuario` con tu username de GitHub
- Reemplaza `tu@email.com` con tu email
- Opcional: Agregar Buy Me a Coffee link

## 7. Topics del Repositorio

En GitHub, agregar topics:
```
obsidian-plugin, obsidian, markdown, html-converter, 
web-clipper, note-taking, knowledge-management, 
typescript, aws, study-notes
```

## 8. Issues y Projects (Opcional)

Crear issues para:
- Fase II: Más extractores
- Fase III: Integración AI
- Bugs conocidos

Crear Projects:
- "Alchemize Roadmap" con columnas: To Do, In Progress, Done

## 9. Comandos Útiles

```bash
# Ver estado
git status

# Ver historial
git log --oneline --graph

# Crear rama para feature
git checkout -b feature/medium-extractor

# Subir cambios
git add .
git commit -m "feat: agrega extractor para Medium"
git push origin feature/medium-extractor

# Hacer PR en GitHub, luego merge

# Actualizar main local
git checkout main
git pull origin main

# Crear nueva versión
git tag -a 1.1.0 -m "v1.1.0"
git push origin 1.1.0
```

## 10. Publicar en Obsidian Community Plugins (Futuro)

Cuando estés listo:

1. Fork de [obsidian-releases](https://github.com/obsidianmd/obsidian-releases)
2. Editar `community-plugins.json`
3. Agregar entry:
```json
{
    "id": "alchemize",
    "name": "Alchemize",
    "author": "Tu Nombre",
    "description": "Transmuta contenido web en notas Markdown estructuradas",
    "repo": "tuusuario/alchemize"
}
```
4. Crear Pull Request

Ver [Publishing your plugin](https://docs.obsidian.md/Plugins/Releasing/Publish+your+plugin)

---

## ✅ Checklist Pre-Publicación

- [ ] Probar que funciona en Obsidian limpio
- [ ] Revisar que no hay datos personales en el código
- [ ] Verificar que manifest.json tiene datos correctos
- [ ] README.md tiene URLs correctas
- [ ] LICENSE tiene tu nombre
- [ ] .gitignore está configurado
- [ ] Crear release con los 3 archivos necesarios

---

**¡Listo para transmutar el conocimiento con el mundo!** ⚗️
