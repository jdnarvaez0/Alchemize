# 📦 Guía de Publicación - Alchemize

## Parte 1: Publicar en Obsidian Community Plugins

### Requisitos Previos

- [ ] Cuenta de GitHub
- [ ] Plugin funcionando y probado
- [ ] Documentación completa (README.md)
- [ ] Licencia (MIT recomendada)

---

### Paso 1: Preparar el Repositorio

Asegúrate de tener estos archivos en la raíz:

```text
alchemize/
├── manifest.json          # ✅ Metadata del plugin
├── main.js               # ✅ Código compilado (OBLIGATORIO)
├── styles.css            # ✅ Estilos (si aplica)
├── README.md             # ✅ Documentación
├── LICENSE               # ✅ Licencia MIT
└── versions.json         # ✅ Versiones compatibles
```

**IMPORTANTE**: El archivo `main.js` debe estar en la raíz del repo.

---

### Paso 2: Configurar GitHub Actions (Automatización)

Ya he creado el archivo `.github/workflows/release.yml`. Esto permitirá que cada vez que crees un tag, se compile y publique automáticamente.

**Estructura del workflow:**

```yaml
name: Release Alchemize Plugin
on:
  push:
    tags:
      - "v*"    # Se ejecuta en tags tipo v1.0.0
```

---

### Paso 3: Publicar una Nueva Versión (Proceso Automatizado)

Con el workflow configurado, publicar es muy simple:

```bash
# 1. Asegúrate de que todo esté commiteado
git add .
git commit -m "feat: agrega nuevas características"

# 2. Actualiza la versión en manifest.json
# Ejemplo: "1.0.0" → "1.1.0"

# 3. Commitea el cambio de versión
git add manifest.json
git commit -m "chore: bump version to 1.1.0"

# 4. Crea un tag (esto dispara el workflow)
git tag -a v1.1.0 -m "Release v1.1.0"

# 5. Sube todo a GitHub
git push origin main
git push origin v1.1.0
```

**¡Listo!** GitHub Actions hará automáticamente:

- ✅ Compilar el código
- ✅ Crear un Release
- ✅ Adjuntar `main.js`, `manifest.json`, `styles.css`

---

### Paso 4: Publicar en Obsidian Community Plugins (Primera vez)

#### 4.1 Fork del repositorio oficial

Ve a: <https://github.com/obsidianmd/obsidian-releases>

Haz click en **"Fork"** (arriba a la derecha)

#### 4.2 Clona tu fork

```bash
git clone https://github.com/jdnarvaez0/obsidian-releases.git
cd obsidian-releases
```

#### 4.3 Edita community-plugins.json

Abre el archivo `community-plugins.json` y agrega tu plugin al final (mantén orden alfabético por ID):

```json
[
  // ... otros plugins ...
  {
    "id": "alchemize",
    "name": "Alchemize",
    "author": "Juan David Narvaez",
    "description": "Transmuta contenido web en notas Markdown estructuradas. Ideal para estudiar cursos de AWS, Medium, y documentación técnica.",
    "repo": "jdnarvaez0/alchemize"
  }
]
```

#### 4.4 Commitea y sube

```bash
git add community-plugins.json
git commit -m "Add Alchemize plugin"
git push origin master
```

#### 4.5 Crea Pull Request

1. Ve a tu fork en GitHub
2. Click en **"Contribute"** → **"Open pull request"**
3. Título: `Add Alchemize plugin`
4. Descripción:

   ```markdown
   ## Alchemize
   
   Transmuta contenido web (HTML) en notas Markdown estructuradas en Obsidian.
   
   ### Características
   - Smart Transmute: Detecta automáticamente el tipo de contenido
   - Extractores especializados: AWS Skill Builder, Medium, genérico
   - 3 modos de exportación: Estudio, Referencia, Flashcards
   - Descarga automática de imágenes
   - Previsualización en vivo
   
   ### Repo
   https://github.com/TU-USUARIO/alchemize
   
   ### Checklist
   - [x] I have read the community plugin guidelines
   - [x] The plugin is functional and tested
   - [x] I have proper documentation
   - [x] I have a valid license
   ```

5. Click **"Create pull request"**

#### 4.6 Espera aprobación

- Normalmente tarda 1-3 días
- El equipo puede pedir cambios
- Una vez aprobado, aparecerá en Community Plugins

---

## Parte 3: Actualizar Versiones (Después de la primera vez)

Una vez publicado, actualizar es muy fácil:

### Opción A: Automática (Recomendada)

```bash
# 1. Hacer cambios y commitear
git add .
git commit -m "feat: agrega extractor para Medium"

# 2. Actualizar versión en manifest.json
# "version": "1.0.0" → "1.0.1"

# 3. Commitear versión
git add manifest.json
git commit -m "chore: bump version to 1.0.1"

# 4. Crear tag (dispara el workflow)
git tag -a v1.0.1 -m "Release v1.0.1"

# 5. Subir
git push origin main
git push origin v1.0.1
```

**Listo!** El workflow crea el release automáticamente.

### Opción B: Manual (si falla la automática)

1. Compila localmente: `npm run build`
2. Ve a GitHub → Releases → "Create a new release"
3. Selecciona o crea un tag
4. Sube manualmente los archivos

---

## 📋 Checklist Pre-Publicación

Antes de enviar tu PR a Obsidian:

- [ ] `manifest.json` tiene la información correcta
- [ ] `main.js` está compilado y funciona
- [ ] README.md explica bien el plugin
- [ ] Licencia MIT (u otra open source)
- [ ] No hay datos personales en el código
- [ ] El plugin no tiene malware ni código malicioso
- [ ] Respetas las guidelines de Obsidian

---

## 🔧 Solución de Problemas

### El workflow no se ejecuta

- Verifica que el tag empiece con `v` (ej: `v1.0.0`, no `1.0.0`)
- Ve a Actions en tu repo para ver los logs de error

### El release no tiene archivos adjuntos

- Asegúrate de que `npm run build` genere los archivos
- Verifica que los nombres coincidan: `main.js`, `manifest.json`, `styles.css`

### Rechazo en el PR de Obsidian

- Lee el mensaje de rechazo cuidadosamente
- Hace los cambios solicitados
- Actualiza tu PR

---

## 📚 Recursos Útiles

- [Publishing your plugin](https://docs.obsidian.md/Plugins/Releasing/Publish+your+plugin)
- [Obsidian Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)

---

**¡Buena suerte con tu publicación!** ⚗️✨
