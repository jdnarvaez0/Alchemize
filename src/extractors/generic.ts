import { BaseExtractor, ExtractedContent, ImageAsset, ExportMode } from './base';
import TurndownService from 'turndown';

// Readability se importará dinámicamente debido a la compatibilidad con Obsidian
let Readability: any;

/**
 * Extractor genérico que usa Mozilla Readability
 * Sirve como fallback para cualquier sitio web de artículos/documentación
 */
export class GenericExtractor extends BaseExtractor {
	readonly name = 'generic';
	
	private turndownService: TurndownService;
	private exportMode: ExportMode;

	constructor(exportMode: ExportMode = ExportMode.REFERENCE) {
		super();
		this.exportMode = exportMode;
		this.turndownService = this.setupTurndown();
		this.loadReadability();
	}

	/**
	 * Carga Readability de forma asíncrona
	 */
	private async loadReadability(): Promise<void> {
		if (!Readability) {
			try {
				const module = await import('@mozilla/readability');
				Readability = module.Readability;
			} catch (error) {
				console.warn('[WebImporter] No se pudo cargar Readability:', error);
			}
		}
	}

	/**
	 * Configura el servicio Turndown para conversión HTML→Markdown
	 */
	private setupTurndown(): TurndownService {
		const turndown = new TurndownService({
			headingStyle: 'atx',
			bulletListMarker: '-',
			codeBlockStyle: 'fenced',
			emDelimiter: '*',
			strongDelimiter: '**',
			linkStyle: 'inlined',
		});

		// Reglas personalizadas para mejorar la conversión
		
		// Preservar bloques de código con su lenguaje
		turndown.addRule('codeBlocks', {
			filter: (node) => {
				return node.nodeName === 'PRE' && 
				       (node as Element).querySelector('code') !== null;
			},
			replacement: (content, node) => {
				const codeElement = (node as Element).querySelector('code');
				let language = '';
				
				// Intentar detectar el lenguaje
				const className = codeElement?.className || '';
				const match = className.match(/language-(\w+)/);
				if (match) {
					language = match[1];
				}
				
				const code = codeElement?.textContent || content;
				return `\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
			}
		});

		// Mejorar el manejo de tablas
		turndown.addRule('tables', {
			filter: 'table',
			replacement: (content, node) => {
				const table = node as HTMLTableElement;
				const rows = table.querySelectorAll('tr');
				if (rows.length === 0) return '';

				let markdown = '\n\n';
				
				rows.forEach((row, index) => {
					const cells = row.querySelectorAll('td, th');
					const rowContent = Array.from(cells)
						.map(cell => cell.textContent?.trim() || '')
						.join(' | ');
					
					markdown += `| ${rowContent} |\n`;
					
					// Agregar separador después de la primera fila (header)
					if (index === 0) {
						const separator = Array.from(cells)
							.map(() => '---')
							.join(' | ');
						markdown += `| ${separator} |\n`;
					}
				});
				
				return markdown + '\n';
			}
		});

		// Manejar iframes (videos, etc.)
		turndown.addRule('iframes', {
			filter: 'iframe',
			replacement: (content, node) => {
				const src = (node as HTMLIFrameElement).src;
				if (src.includes('youtube.com') || src.includes('youtu.be')) {
					const videoId = this.extractYouTubeId(src);
					if (videoId) {
						return `\n\n[![YouTube Video](https://img.youtube.com/vi/${videoId}/0.jpg)](https://www.youtube.com/watch?v=${videoId})\n\n`;
					}
				}
				return `\n\n<iframe src="${src}"></iframe>\n\n`;
			}
		});

		// Preservar bloques de cita
		turndown.addRule('callouts', {
			filter: (node) => {
				const el = node as Element;
				return el.classList?.contains('callout') ||
				       el.classList?.contains('admonition') ||
				       el.classList?.contains('alert');
			},
			replacement: (content, node) => {
				const element = node as Element;
				let type = 'note';
				
				// Intentar detectar el tipo de callout
				if (element.classList.contains('warning') || element.classList.contains('caution')) {
					type = 'warning';
				} else if (element.classList.contains('tip') || element.classList.contains('hint')) {
					type = 'tip';
				} else if (element.classList.contains('danger') || element.classList.contains('error')) {
					type = 'danger';
				}
				
				return `\n\n> [!${type.toUpperCase()}]\n> ${content.trim().replace(/\n/g, '\n> ')}\n\n`;
			}
		});

		return turndown;
	}

	/**
	 * Extrae el ID de un video de YouTube
	 */
	private extractYouTubeId(url: string): string | null {
		const patterns = [
			/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
			/youtube\.com\/watch\?.*v=([^&\s]+)/
		];
		
		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match) return match[1];
		}
		return null;
	}

	/**
	 * El extractor genérico siempre puede manejar cualquier contenido
	 */
	canHandle(): boolean {
		return true;
	}

	/**
	 * Extrae el contenido usando Readability y Turndown
	 */
	async extract(doc: Document, url?: string): Promise<ExtractedContent> {
		await this.loadReadability();
		
		// Limpiar el documento
		const cleanDoc = this.cleanHTML(doc);
		
		let title = '';
		let content = '';
		let extractedContent = cleanDoc.body?.innerHTML || '';

		// Usar Readability si está disponible
		if (Readability) {
			try {
				const reader = new Readability(cleanDoc);
				const article = reader.parse();
				
				if (article) {
					title = article.title || '';
					content = this.turndownService.turndown(article.content);
				}
			} catch (error) {
				console.warn('[WebImporter] Readability falló, usando fallback:', error);
			}
		}

		// Fallback si Readability no funcionó
		if (!content) {
			const body = cleanDoc.body || cleanDoc;
			title = cleanDoc.title || 'Sin título';
			content = this.turndownService.turndown(body.innerHTML);
		}

		// Extraer metadatos
		const author = this.extractAuthor(cleanDoc);
		const date = this.extractDate(cleanDoc);
		const tags = this.autoTag(content);
		const images = this.extractImages(cleanDoc.body || cleanDoc.documentElement);

		// Aplicar transformaciones según el modo de exportación
		const processedContent = this.applyExportMode(content, this.exportMode);

		return {
			title,
			author,
			date,
			sourceUrl: url,
			tags,
			markdown: processedContent,
			images,
			metadata: {
				extractor: this.name,
				exportMode: this.exportMode,
				wordCount: content.split(/\s+/).length,
			}
		};
	}

	/**
	 * Extrae el autor del documento
	 */
	private extractAuthor(doc: Document): string | undefined {
		const selectors = [
			'meta[name="author"]',
			'meta[property="article:author"]',
			'.author',
			'[rel="author"]',
			'.byline'
		];

		for (const selector of selectors) {
			const element = doc.querySelector(selector);
			if (element) {
				const content = element.getAttribute('content') || 
				                element.textContent;
				if (content) return content.trim();
			}
		}

		return undefined;
	}

	/**
	 * Extrae la fecha del documento
	 */
	private extractDate(doc: Document): Date | undefined {
		const selectors = [
			'meta[property="article:published_time"]',
			'meta[name="publishedDate"]',
			'time[datetime]',
			'.published',
			'.date'
		];

		for (const selector of selectors) {
			const element = doc.querySelector(selector);
			if (element) {
				const content = element.getAttribute('content') || 
				                element.getAttribute('datetime') ||
				                element.textContent;
				if (content) {
					const date = new Date(content);
					if (!isNaN(date.getTime())) return date;
				}
			}
		}

		return undefined;
	}

	/**
	 * Aplica transformaciones según el modo de exportación
	 */
	private applyExportMode(content: string, mode: ExportMode): string {
		switch (mode) {
			case ExportMode.STUDY:
				return this.formatForStudy(content);
			case ExportMode.FLASHCARDS:
				return this.formatForFlashcards(content);
			case ExportMode.REFERENCE:
			default:
				return content;
		}
	}

	/**
	 * Formatea el contenido para modo estudio
	 */
	private formatForStudy(content: string): string {
		// Agregar sección de resumen al principio
		const summary = this.generateSummary(content);
		
		return `## 📝 Resumen\n\n${summary}\n\n---\n\n${content}\n\n---\n\n## 🤔 Preguntas de Repaso\n\n- [ ] ¿Cuál es el concepto principal?\n- [ ] ¿Cuáles son los puntos clave?\n- [ ] ¿Cómo se aplica esto en la práctica?\n`;
	}

	/**
	 * Formatea el contenido para modo flashcards
	 */
	private formatForFlashcards(content: string): string {
		// Extraer posibles preguntas/respuestas de los encabezados
		const lines = content.split('\n');
		let flashcards = '';
		let currentSection = '';

		for (const line of lines) {
			if (line.startsWith('## ')) {
				currentSection = line.replace('## ', '').trim();
			} else if (line.startsWith('### ') && currentSection) {
				const question = line.replace('### ', '').trim();
				flashcards += `#flashcard\n**${currentSection} - ${question}** :: \n\n`;
			}
		}

		return `# Tarjetas de Estudio\n\n${flashcards}\n\n---\n\n${content}`;
	}

	/**
	 * Genera un resumen simple del contenido (primeros párrafos)
	 */
	private generateSummary(content: string): string {
		const paragraphs = content
			.split('\n\n')
			.filter(p => p.trim() && !p.startsWith('#') && !p.startsWith('```'));
		
		if (paragraphs.length === 0) return 'No hay contenido para resumir.';
		
		// Tomar los primeros 2-3 párrafos o un máximo de caracteres
		let summary = '';
		let charCount = 0;
		const maxChars = 500;
		
		for (const paragraph of paragraphs.slice(0, 3)) {
			if (charCount + paragraph.length > maxChars) {
				summary += paragraph.substring(0, maxChars - charCount) + '...';
				break;
			}
			summary += paragraph + '\n\n';
			charCount += paragraph.length + 2;
		}
		
		return summary.trim();
	}
}
