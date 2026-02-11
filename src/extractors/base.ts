/**
 * Interfaz que define el contenido extraído de una página web
 */
export interface ExtractedContent {
	/** Título del contenido */
	title: string;
	/** Autor del contenido (opcional) */
	author?: string;
	/** Fecha de publicación (opcional) */
	date?: Date;
	/** URL de origen */
	sourceUrl?: string;
	/** Tags identificados */
	tags: string[];
	/** Contenido en formato Markdown */
	markdown: string;
	/** Imágenes encontradas */
	images: ImageAsset[];
	/** Metadatos adicionales específicos del extractor */
	metadata: Record<string, any>;
}

/**
 * Interfaz para assets de imágenes
 */
export interface ImageAsset {
	/** URL original de la imagen */
	originalUrl: string;
	/** Ruta local donde se guardará (si aplica) */
	localPath?: string;
	/** Texto alternativo */
	altText: string;
	/** Indica si es un diagrama (para tratamiento especial) */
	isDiagram?: boolean;
	/** Tipo MIME de la imagen */
	mimeType?: string;
}

/**
 * Clase abstracta base para todos los extractores
 * Cada extractor específico debe extender esta clase
 */
export abstract class BaseExtractor {
	/** Nombre identificador del extractor */
	abstract readonly name: string;

	/**
	 * Determina si este extractor puede manejar el contenido dado
	 * @param url URL del documento
	 * @param document El documento DOM a analizar
	 * @returns true si puede manejar este contenido
	 */
	abstract canHandle(url: string, document: Document): boolean;

	/**
	 * Extrae el contenido estructurado del documento
	 * @param doc El documento DOM a procesar
	 * @returns Promise con el contenido extraído
	 */
	abstract extract(doc: Document, url?: string): Promise<ExtractedContent>;

	/**
	 * Limpia el HTML de elementos no deseados (scripts, estilos, etc.)
	 * @param doc El documento a limpiar
	 * @returns El documento limpio
	 */
	protected cleanHTML(doc: Document): Document {
		// Clonar para no modificar el original
		const cleanDoc = doc.cloneNode(true) as Document;
		
		// Eliminar elementos no deseados
		const selectorsToRemove = [
			'script',
			'style',
			'nav',
			'header',
			'footer',
			'aside',
			'.advertisement',
			'.ads',
			'.cookie-banner',
			'.newsletter-signup',
			'[role="banner"]',
			'[role="navigation"]',
			'[role="complementary"]',
		];

		selectorsToRemove.forEach(selector => {
			cleanDoc.querySelectorAll(selector).forEach(el => el.remove());
		});

		return cleanDoc;
	}

	/**
	 * Extrae imágenes del contenido HTML
	 * @param container Elemento contenedor
	 * @returns Array de ImageAsset
	 */
	protected extractImages(container: Element): ImageAsset[] {
		const images: ImageAsset[] = [];
		const seenUrls = new Set<string>();

		container.querySelectorAll('img').forEach(img => {
			const src = img.getAttribute('src') || img.getAttribute('data-src');
			if (!src || seenUrls.has(src)) return;
			
			seenUrls.add(src);
			images.push({
				originalUrl: src,
				altText: img.getAttribute('alt') || 'image',
				isDiagram: this.isLikelyDiagram(img),
			});
		});

		return images;
	}

	/**
	 * Detecta si una imagen es probablemente un diagrama
	 * @param img Elemento imagen
	 * @returns true si parece ser un diagrama
	 */
	protected isLikelyDiagram(img: HTMLImageElement): boolean {
		const src = img.src || '';
		const alt = img.alt || '';
		
		// Indicadores de diagrama
		const diagramKeywords = ['diagram', 'architecture', 'flowchart', 'schema', 'diagrama', 'arquitectura'];
		const hasDiagramKeyword = diagramKeywords.some(kw => 
			src.toLowerCase().includes(kw) || alt.toLowerCase().includes(kw)
		);
		
		// SVGs son frecuentemente diagramas
		const isSvg = src.toLowerCase().endsWith('.svg');
		
		// Imágenes grandes suelen ser diagramas
		const isLarge = img.naturalWidth > 600 || img.width > 600;
		
		return hasDiagramKeyword || isSvg || isLarge;
	}

	/**
	 * Genera tags automáticamente basado en el contenido
	 * @param text Contenido textual
	 * @returns Array de tags sugeridos
	 */
	protected autoTag(text: string): string[] {
		const techTerms = [
			'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt',
			'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Java', 'C#', 'PHP',
			'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform',
			'API', 'GraphQL', 'REST', 'gRPC', 'WebSocket',
			'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
			'Linux', 'Ubuntu', 'Debian', 'CentOS',
			'Git', 'GitHub', 'GitLab', 'CI/CD', 'DevOps',
			'HTML', 'CSS', 'SCSS', 'Tailwind', 'Bootstrap',
			'Node.js', 'Express', 'NestJS', 'FastAPI', 'Django', 'Flask',
			'AI', 'Machine Learning', 'Deep Learning', 'LLM', 'NLP',
			'Security', 'OAuth', 'JWT', 'SSL', 'HTTPS'
		];

		const textLower = text.toLowerCase();
		const foundTags: string[] = [];

		// Buscar términos técnicos
		for (const term of techTerms) {
			const regex = new RegExp(`\\b${term.toLowerCase()}\\b`);
			if (regex.test(textLower) && !foundTags.includes(term)) {
				foundTags.push(term);
			}
		}

		return foundTags.slice(0, 10); // Limitar a 10 tags
	}

	/**
	 * Genera frontmatter para Obsidian
	 * @param content Contenido extraído
	 * @returns String con el frontmatter en formato YAML
	 */
	protected generateFrontmatter(content: ExtractedContent): string {
		const lines: string[] = ['---'];
		
		lines.push(`title: "${content.title.replace(/"/g, '\\"')}"`);
		
		if (content.author) {
			lines.push(`author: "${content.author}"`);
		}
		
		if (content.date) {
			lines.push(`date: ${content.date.toISOString().split('T')[0]}`);
		}
		
		if (content.sourceUrl) {
			lines.push(`source: "${content.sourceUrl}"`);
		}
		
		if (content.tags.length > 0) {
			lines.push(`tags:`);
			content.tags.forEach(tag => lines.push(`  - ${tag}`));
		}
		
		// Agregar metadata específica del extractor
		if (Object.keys(content.metadata).length > 0) {
			lines.push(`metadata:`);
			Object.entries(content.metadata).forEach(([key, value]) => {
				if (typeof value === 'string') {
					lines.push(`  ${key}: "${value}"`);
				} else if (Array.isArray(value)) {
					lines.push(`  ${key}:`);
					value.forEach(v => lines.push(`    - ${v}`));
				} else {
					lines.push(`  ${key}: ${value}`);
				}
			});
		}
		
		lines.push('---');
		lines.push('');
		
		return lines.join('\n');
	}
}

/**
 * Tipo para los modos de exportación
 */
export enum ExportMode {
	/** Modo estudio: incluye preguntas, resúmenes y estructura para aprendizaje */
	STUDY = 'study',
	/** Modo referencia: documentación técnica pura */
	REFERENCE = 'reference',
	/** Modo flashcards: genera tarjetas para repetición espaciada */
	FLASHCARDS = 'flashcards'
}
