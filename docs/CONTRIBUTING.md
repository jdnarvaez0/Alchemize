# Guía para Alquimistas Contribuyentes

¡Gracias por tu interés en mejorar Alchemize! ⚗️

## Cómo Contribuir

### Reportar Fallas en la Transmutación

Si encuentras un bug, crea un [issue](https://github.com/tuusuario/alchemize/issues):

- **Título claro**: Describe la falla en la transmutación
- **Pasos para reproducir**: Detalla el ritual que falló
- **Comportamiento esperado vs actual**: Qué debería vs qué pasó
- **Ejemplo de contenido**: El HTML que causó el problema
- **Entorno**:
  - Versión de Obsidian
  - Versión de Alchemize
  - Sistema operativo

### Sugerir Nuevas Fórmulas (Features)

Para proponer mejoras:

1. Verifica que no exista ya un issue similar
2. Crea un issue con label `enhancement`
3. Describe:
   - El problema que resuelve
   - La fórmula propuesta
   - Alternativas consideradas

## ⚗️ Desarrollo

### Preparar el Laboratorio

```bash
# 1. Fork y clonar
git clone https://github.com/tu-usuario/alchemize.git
cd alchemize

# 2. Preparar componentes
npm install

# 3. Crear rama para tu fórmula
git checkout -b feature/nueva-transmutacion

# 4. Iniciar caldero en modo desarrollo
npm run dev
```

### Estructura del Grimorio

```
src/
├── main.ts              # El caldero principal
├── extractors/          # Las fórmulas de transmutación
│   ├── base.ts         # Base de toda alquimia
│   ├── registry.ts     # El grimorio de fórmulas
│   └── *.ts            # Fórmulas específicas
├── core/               # Esencias fundamentales
│   └── image-handler.ts
└── ui/                 # Interfaces de visión
    └── preview-modal.ts
```

### Código Alquímico

- **TypeScript estricto**: Tipos claros y definidos
- **Nombres en inglés**: `extract()`, `transmute()`, `crystalize()`
- **Comentarios JSDoc**: Documenta las funciones públicas
- **Máximo 100 caracteres** por línea

### Commits Alquímicos

Usa [Conventional Commits](https://www.conventionalcommits.org/) con temática alquímica:

```
feat: ⚗️ agrega extractor para Medium
fix: 🔧 corrige transmutación de imágenes base64
docs: 📚 actualiza grimorio con ejemplos AWS
refactor: ⚡ purifica lógica de detección
test: 🧪 agrega tests para extractor AWS
style: 💎 mejora estilos del caldero
```

### Crear una Nueva Fórmula (Extractor)

```typescript
// 1. Crea src/extractors/tu-fuente.ts
import { BaseExtractor, ExtractedContent } from './base';

export class TuFuenteExtractor extends BaseExtractor {
    readonly name = 'tu-fuente';
    
    // Detecta si puede transmutar esta fuente
    canHandle(url: string, doc: Document): boolean {
        return url.includes('tufuente.com');
    }
    
    // La fórmula de transmutación
    async extract(doc: Document, url?: string): Promise<ExtractedContent> {
        // 1. Limpiar impurezas
        const cleanDoc = this.cleanHTML(doc);
        
        // 2. Extraer esencias
        const title = doc.querySelector('h1')?.textContent || 'Sin título';
        const content = this.turndown(cleanDoc.body.innerHTML);
        
        // 3. Identificar elementos
        const tags = this.autoTag(content);
        const images = this.extractImages(cleanDoc.body);
        
        // 4. Retornar el resultado
        return {
            title,
            markdown: content,
            tags,
            images,
            metadata: { 
                source: url,
                extractor: this.name
            }
        };
    }
}

// 2. Registra en src/main.ts
import { TuFuenteExtractor } from './extractors/tu-fuente';
this.registry.register(new TuFuenteExtractor());

// 3. Agrega tests
// 4. Actualiza README.md
// 5. Envía Pull Request
```

### Pull Requests

1. Actualiza tu rama con `main`
2. Verifica que compila: `npm run build`
3. Crea el PR con:
   - Descripción de los cambios alquímicos
   - Referencia al issue relacionado
   - Screenshots si modifica UI
   - Tests si aplica

## Código de Conducta

- Sé respetuoso con otros alquimistas
- Acepta críticas constructivas
- Enfócate en mejorar el conocimiento compartido
- Recuerda: ¡todos estamos aprendiendo!

## Preguntas?

Abre un [issue](https://github.com/tuusuario/alchemize/issues) con label `question`.

---

**⚗️ Gracias por contribuir a la transmutación del conocimiento!**
