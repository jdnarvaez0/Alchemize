# ⚗️ Guía Rápida - Alchemize

## Transmuta el Plomo en Oro

Alchemize transforma tu contenido web en notas Markdown estructuradas y valiosas.

## 🚀 Instalación Rápida

### Opción 1: Community Plugins (Próximamente)

1. Settings → Community Plugins
2. Buscar **"Alchemize"**
3. Install → Enable

### Opción 2: Manual

```bash
# Clonar el grimorio
git clone https://github.com/tuusuario/alchemize.git
cd alchemize

# Preparar componentes
npm install
npm run build
```

Copia `main.js`, `manifest.json`, `styles.css` a:  `.obsidian/plugins/alchemize/`

---

## 🧪 El Ritual de Transmutación

### 1. Extraer la Esencia

Copia el contenido web que quieres transmutar:
```
Ctrl+A (seleccionar todo)
Ctrl+C (copiar)
```

### 2. Invocar Alchemize

En Obsidian:
```
Ctrl+P (Command Palette)
Escribe: "Alchemize"
Selecciona: "⚗️ Smart Transmute"
```

### 3. Observar la Previsualización

- Edita el título si es necesario
- Revisa las tags detectadas
- Elige la carpeta destino
- Selecciona el modo de cristalización

### 4. Cristalizar

Haz clic en **"💎 Cristalizar"** y ¡listo!

---

## 📚 Modos de Cristalización

| Modo | Resultado | Ideal para |
|------|-----------|------------|
| **📖 Referencia** | Documentación limpia | Documentación técnica, artículos |
| **📚 Estudio** | Notas con objetivos y preguntas | Cursos, tutoriales, AWS |
| **🎴 Flashcards** | Estructura para memorización | Repetición espaciada |

---

## 🎯 Ejemplos de Uso

### Curso AWS Skill Builder → Grimoio de Estudio

**Input:** Página de AWS copiada

**Output:**
```markdown
---
title: "AWS - DynamoDB"
tags: [aws, dynamodb, certification]
objetivos:
  - Entender DynamoDB
  - Configurar tablas
---

## 🎯 Objetivos de Aprendizaje
- [ ] Entender DynamoDB
- [ ] Configurar tablas

## 📚 Contenido
[...]

## 📝 Notas del Aprendiz
### Puntos Clave
- 
```

### Artículo Medium → Tomo de Referencia

**Input:** Artículo de blog copiado

**Output:**
```markdown
---
title: "Advanced React Patterns"
author: "Dan Abramov"
tags: [react, javascript, frontend]
---

[Contenido limpio...]
```

---

## ⚗️ Configuración

Settings → **Alchemize**

```yaml
📁 Grimoio de destino: "Grimorios Web"
🎨 Modo de cristalización: "Estudio"
💎 Capturar esencias visuales: true
📂 Repositorio de esencias: "assets"
👁️ Mostrar visión previa: true
🏷️ Etiquetado automático: true
```

---

## 🔮 Fuentes Soportadas

| Fuente | Estado | Transmutación |
|--------|--------|---------------|
| **Genérico** | ✅ | Cualquier sitio web |
| **AWS Skill Builder** | ✅ | Cursos con objetivos y diagramas |
| **Medium** | 🚧 | Artículos limpios |
| **Dev.to** | 🚧 | Código con syntax |

✅ = Listo | 🚧 = En desarrollo

---

## 🐛 Solución de Problemas

### "El caldero está vacío"
- Asegúrate de copiar el contenido primero (Ctrl+A, Ctrl+C)

### "No se pudo identificar la esencia"
- Intenta copiar más contenido (página completa)
- Usa un comando específico en lugar de Smart Transmute

### Las imágenes no se capturan
- Algunas imágenes están protegidas por login
- Revisa la consola (Ctrl+Shift+I) para errores

---

## 🎓 Para Alquimistas Avanzados

### Crear tu Propio Extractor

```typescript
import { BaseExtractor, ExtractedContent } from './extractors/base';

export class MiFuenteExtractor extends BaseExtractor {
    readonly name = 'mi-fuente';
    
    canHandle(url: string, doc: Document): boolean {
        return url.includes('misitio.com');
    }
    
    async extract(doc: Document, url?: string): Promise<ExtractedContent> {
        return {
            title: 'Título extraído',
            markdown: '# Contenido',
            tags: ['tag1'],
            images: [],
            metadata: { fuente: url }
        };
    }
}
```

---

## 📖 Documentación Completa

- [README.md](README.md) - Introducción y filosofía
- [SKILL.md](SKILL.md) - Documentación técnica completa
- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitectura y patrones

---

**⚗️ Transmuta el conocimiento. Transforma tu aprendizaje.**

Hecho con 💜 para la comunidad de Obsidian.
