# Tecnologías del Proyecto

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                     OBSIDIAN (Electron)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              PLUGIN WEB IMPORTER                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │  │
│  │  │ Extractores │  │   Core      │  │      UI       │  │  │
│  │  │  (Parser)   │  │ (Converter) │  │  (Modals)     │  │  │
│  │  └─────────────┘  └─────────────┘  └───────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                         │                                    │
│                    Obsidian API                             │
│                         │                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Vault (File System)  │  Clipboard API  │  DOM API    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Nota importante**: La Fase 1 es 100% frontend. No requiere backend.

---

## Stack Tecnológico - Fase 1 (MVP)

### 1. Lenguaje Principal
| Tecnología | Uso | Justificación |
|------------|-----|---------------|
| **TypeScript** | 100% del código | Tipado estático, mejor DX, compatible con Obsidian API |

### 2. Frontend / Plugin Obsidian
| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Obsidian API** | ^1.4.11 | Interfaz con el editor, comandos, settings, vault |
| **DOM API** | Nativa | Parsear HTML, crear UI (sin frameworks externos) |
| **Clipboard API** | Nativa | Leer contenido del portapapeles |

### 3. Parsing y Conversión
| Tecnología | Uso | Por qué |
|------------|-----|---------|
| **Turndown** | HTML → Markdown | Estándar de facto, extensible con reglas |
| **Mozilla Readability** | Extraer artículos | Usada en Firefox, muy robusta |
| **DOMParser** (nativo) | Parsear HTML crudo | Built-in, no requiere librería |

### 4. Build y Desarrollo
| Tecnología | Uso |
|------------|-----|
| **Node.js** | Runtime y paquetes |
| **esbuild** | Bundling rápido |
| **npm** | Gestión de dependencias |

---

## ¿Backend? ¿Cuándo y por qué?

### Fase 1 (MVP): ❌ NO hay backend
Todo ocurre en el cliente:
- El usuario copia HTML al clipboard
- El plugin lo parsea con DOMParser
- Convierte con Turndown
- Guarda en el vault de Obsidian

### Cuándo SÍ necesitaríamos backend:

| Escenario | Solución sin backend | Solución con backend | Prioridad |
|-----------|---------------------|---------------------|-----------|
| **CORS** | Copiar HTML manualmente | Proxy server para fetch URLs | Media |
| **SVG→PNG** | No implementar | Servicio de conversión | Baja |
| **LLM/AI** | Ollama local | API (OpenAI/Claude) | Media |
| **Web Scraping** | Clipboard | Puppeteer/Playwright | Media |

### Posible Backend para Fase 3 (AI Integration)

Si en el futuro queremos:
- Generar resúmenes automáticos
- Extraer flashcards con AI
- Importar directamente desde URLs (sin CORS)

**Stack sugerido:**
```
Backend (Opcional para Fase 3):
├── Node.js + Express / Fastify
├── Puppeteer (para scraping real)
├── OpenAI API / Ollama integration
└── Serverless functions (Vercel/Netlify Functions)
```

---

## Flujo de Datos

```
Usuario copia HTML (Ctrl+C)
         │
         ▼
┌────────────────────┐
│ Clipboard API      │  ← Nativo del navegador
└────────────────────┘
         │
         ▼
┌────────────────────┐
│ DOMParser          │  ← Nativo, parsea HTML
│ (crea Document)    │
└────────────────────┘
         │
         ▼
┌────────────────────┐
│ ExtractorRegistry  │  ← Encuentra extractor apropiado
│ (patrón Strategy)  │
└────────────────────┘
         │
         ▼
┌────────────────────┐
│ BaseExtractor      │  ← Extrae contenido estructurado
│ + Readability.js   │
└────────────────────┘
         │
         ▼
┌────────────────────┐
│ Turndown           │  ← Convierte a Markdown
│ (reglas custom)    │
└────────────────────┘
         │
         ▼
┌────────────────────┐
│ Preview Modal      │  ← UI nativa de Obsidian
│ (Opcional)         │
└────────────────────┘
         │
         ▼
┌────────────────────┐
│ Obsidian API       │  ← Guarda en el vault
│ (vault.create)     │
└────────────────────┘
         │
         ▼
┌────────────────────┐
│ Archivo .md        │  ← Resultado final
│ en el vault        │
└────────────────────┘
```

---

## Dependencias del Proyecto

### Producción (Runtime)
```json
{
  "obsidian": "1.4.11"  // API de Obsidian
}
```

### Desarrollo (Build-time)
```json
{
  "turndown": "^7.1.2",           // HTML → Markdown
  "@mozilla/readability": "^0.4.4", // Extracción de artículos
  "jsdom": "^23.0.1",             // DOM para testing
  "@types/turndown": "^5.0.4",    // Tipos
  "esbuild": "^0.19.8",           // Bundler
  "typescript": "^5.3.3"          // Lenguaje
}
```

---

## Ventajas de esta arquitectura

1. **Sin backend**: Más simple, sin costos de hosting, funciona offline
2. **Sin framework UI**: Menos dependencias, más ligero, integración nativa con Obsidian
3. **Clipboard-based**: Funciona con cualquier sitio, incluso con login
4. **Extensible**: Patrón de extractores permite agregar soporte para nuevos sitios

## Limitaciones conocidas

1. **CORS**: No podemos fetchear URLs directamente (solución: copiar HTML manualmente)
2. **Imágenes**: Solo funciona con imágenes base64 o URLs accesibles
3. **JavaScript dinámico**: Si el contenido se carga con JS, puede no estar en el HTML copiado

---

## Decisiones técnicas

### ¿Por qué no React/Vue/Svelte para la UI?
- Obsidian ya tiene su propio sistema de UI basado en DOM nativo
- Agregar un framework aumentaría el bundle significativamente
- Las modales y settings de Obsidian funcionan mejor con su API nativa

### ¿Por qué Turndown y no showdown/remarkable?
- Turndown es específicamente HTML→Markdown (no bidireccional)
- Más ligero
- Sistema de reglas más flexible para casos específicos

### ¿Por qué Readability de Mozilla?
- Battle-tested (usada en Firefox)
- Detecta automáticamente el contenido principal
- Elimina navegación, ads, etc.
