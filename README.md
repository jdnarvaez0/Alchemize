# ⚗️ Alchemize

> **Transmuta el contenido web en oro puro: notas Markdown estructuradas en Obsidian**

[![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?color=7e6ad6&label=downloads&query=%24%5B%22alchemize%22%5D.downloads&url=https%3A%2F%2Freleases.obsidian.md%2Fstats%2Fplugin&style=flat-square)](https://obsidian.md/plugins?id=alchemize)
[![GitHub Release](https://img.shields.io/github/v/release/jdnarvaez0/alchemize?style=flat-square&color=gold)](https://github.com/jdnarvaez0/alchemize/releases)
[![License](https://img.shields.io/badge/license-MIT-gold?style=flat-square)](LICENSE)

```
    ⚗️ ALCHEMIZE ⚗️
    ═════════════════
    HTML  ──────►  Markdown
    (Plomo)      (Oro)
```

## ✨ La Transmutación

Alchemize es tu laboratorio digital donde el HTML crudo se transforma en conocimiento organizado. Diseñado para estudiantes, investigadores y curiosos que quieren capturar la sabiduría de la web y convertirla en notas estructuradas.

### 🧪 Capacidades Alquímicas

- 🔮 **Detección Esencial** - Identifica automáticamente la naturaleza del contenido
- ⚗️ **Transmutación Selectiva** - Extractores especializados para cada fuente
- 📚 **Grimorios de Estudio** - Convierte cursos en notas de aprendizaje completas
- 🖼️ **Captura de Esencias Visuales** - Imágenes organizadas automáticamente
- 🔍 **Previsualización del Resultado** - Observa la transmutación antes de cristalizarla
- 🏷️ **Etiquetado Automático** - Identifica tecnologías y conceptos clave

## 🚀 Iniciar la Transmutación

### Desde los Archivos del Saber (Community Plugins)

1. Abre **Settings** → **Community Plugins** en Obsidian
2. Desactiva **Safe Mode**
3. Busca **"Alchemize"** y haz clic en Install
4. Activa el plugin

### Preparación Manual del Laboratorio

```bash
# Clona el grimorio
git clone https://github.com/jdnarvaez0/alchemize.git

# Entra al laboratorio
cd alchemize

# Prepara los componentes
npm install

# Forja el artefacto
npm run build
```

Copia `main.js`, `manifest.json` y `styles.css` a tu vault: `.obsidian/plugins/alchemize/`

## 📝 El Ritual de Transmutación

### Transmutar Contenido Web

1. **Extrae** la esencia de la web (Ctrl+A, Ctrl+C en cualquier página)
2. **Invoca** en Obsidian: Ctrl+P → **"Alchemize: Smart Transmute"**
3. **Observa** la previsualización del resultado
4. **Cristaliza** la nota en tu vault

### Fórmulas Disponibles (Comandos)

| Fórmula | Transmutación | Descripción |
|---------|---------------|-------------|
| `⚗️ Smart Transmute` | Auto-detect | Detecta y transmuta automáticamente |
| `📚 Transmute to Study` | Grimoio de Estudio | Con objetivos y notas de aprendizaje |
| `📖 Transmute to Reference` | Tomo de Referencia | Documentación técnica pura |
| `🎴 Transmute to Flashcards` | Cartas de Saber | Para repetición espaciada |

## 🎓 Ejemplos de Transmutación

### De AWS Skill Builder a Grimorio de Estudio

**Antes (HTML crudo):**

```html
<div class="course-content">
  <h1>DynamoDB Fundamentals</h1>
  <div class="learning-objectives">
    <ul>
      <li>Understand DynamoDB basics</li>
      <li>Configure partition keys</li>
    </ul>
  </div>
  <p>Amazon DynamoDB is a fully managed...</p>
</div>
```

**Después (Oro puro):**

```markdown
---
title: "AWS Developer - DynamoDB Fundamentals"
curso: "AWS Developer Associate"
tags: [aws, dynamodb, nosql, certification]
objetivos:
  - Entender conceptos básicos de DynamoDB
  - Configurar claves de partición
---

## 🎯 Objetivos de Aprendizaje
- [ ] Entender conceptos básicos de DynamoDB
- [ ] Configurar claves de partición

## 📚 Contenido Transmutado
Amazon DynamoDB es un servicio de base de datos NoSQL completamente administrado...

> [!IMPORTANT]
> DynamoDB no requiere un esquema predefinido.

## 🏗️ Diagramas de Arquitectura
![DynamoDB Table Structure](assets/dynamodb-architecture.png)

## 📝 Notas del Aprendiz
### Puntos Clave
- 
- 

### Términos Importantes
| Término | Definición |
|---------|------------|
```

## ⚗️ Configuración del Laboratorio

En **Settings** → **Alchemize**:

```yaml
📁 Carpeta destino: "Grimorios Web"
🎨 Modo de transmutación: "Estudio"
🖼️ Capturar esencias visuales: true
📂 Carpeta de esencias: "assets"
👁️ Mostrar previsualización: true
🏷️ Etiquetado automático: true
```

## 🏛️ Fuentes de Conocimiento Soportadas

| Fuente | Estado | Capacidades |
|--------|--------|-------------|
| **Genérico** | ✅ | Cualquier sitio vía Readability.js |
| **AWS Skill Builder** | ✅ | Objetivos, diagramas, código |
| **Medium** | 🚧 | Limpia paywall |
| **Dev.to** | 🚧 | Syntax highlighting |
| **GitHub Docs** | 📋 | Documentación técnica |

✅ = Transmutación completa | 🚧 = En proceso de refinamiento | 📋 = Planeado

## 🛠️ Desarrollo y Contribución

```bash
# Clonar el grimorio
git clone https://github.com/jdnarvaez0/alchemize.git
cd alchemize

# Preparar componentes
npm install

# Modo alquimista (hot reload)
npm run dev

# Forjar para producción
npm run build
```

### Crear un Nuevo Extractor

```typescript
import { BaseExtractor, ExtractedContent } from './extractors/base';

export class TuFuenteExtractor extends BaseExtractor {
    readonly name = 'tu-fuente';
    
    canHandle(url: string, doc: Document): boolean {
        return url.includes('tufuente.com');
    }
    
    async extract(doc: Document, url?: string): Promise<ExtractedContent> {
        // Tu fórmula de transmutación
        return {
            title: '...',
            markdown: '...',
            tags: [],
            images: [],
            metadata: {}
        };
    }
}
```

## 🗺️ Mapa del Grimorio (Roadmap)

- [x] **Fase I: El Fundamento** - Transmutación básica funcional
- [ ] **Fase II: Expansión** - Más fuentes de conocimiento
- [ ] **Fase III: Sabiduría Artificial** - Integración con LLM
- [ ] **Fase IV: El Vínculo** - Extensión para navegadores

## 🤝 Únete a los Alquimistas

¡Las contribuciones son bienvenidas! Ver [CONTRIBUTING.md](CONTRIBUTING.md)

### Códigos de Contribución

- 🧪 `feat:` - Nueva fórmula alquímica
- 🔧 `fix:` - Corrección de transmutación
- 📚 `docs:` - Actualización de grimorios
- ⚡ `perf:` - Optimización del proceso

## 🐛 Reportar Fallas en la Transmutación

Si la transmutación falla:

1. Verifica que tienes la última versión
2. Revisa los [issues existentes](https://github.com/jdnarvaez0/alchemize/issues)
3. Crea un nuevo issue con:
   - Descripción de la falla
   - Pasos para reproducir
   - Ejemplo de HTML que causa el problema

## 📝 Licencia

Licenciado bajo [MIT License](LICENSE) - Libre para transmutar y compartir.

## 🙏 Agradecimientos

- [Obsidian Team](https://obsidian.md/) por el caldero donde hervimos ideas
- [Mozilla Readability](https://github.com/mozilla/readability) por la esencia extractora
- [Turndown](https://github.com/mixmark-io/turndown) por el catalizador de transformación
- La comunidad de Obsidian por la inspiración

---

<p align="center">
  <strong>⚗️ Transmuta el conocimiento. Transforma tu aprendizaje. ⚗️</strong>
</p>
