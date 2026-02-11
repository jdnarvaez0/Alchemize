import { BaseExtractor, ExtractedContent, ImageAsset, ExportMode } from './base';
import TurndownService from 'turndown';
import { HTMLProcessor } from '../core/html-processor';

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
				console.warn('[Alchemize] No se pudo cargar Readability:', error);
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

		// IMPORTANTE: Desactivar el escape de Markdown para evitar problemas
		turndown.escape = (text: string) => text;

		// REGLA 1: Preservar bloques de código con su lenguaje
		turndown.addRule('codeBlocks', {
			filter: (node) => {
				if (node.nodeName !== 'PRE') return false;
				const el = node as Element;
				return el.querySelector('code') !== null;
			},
			replacement: (content, node) => {
				const el = node as Element;
				const codeElement = el.querySelector('code');
				
				// Detectar lenguaje de múltiples fuentes
				let language = '';
				const className = codeElement?.className || el.className || '';
				
				// Patrones comunes de clases de código
				const patterns = [
					/language-(\w+)/,
					/lang-(\w+)/,
					/(\w+)$/,  // Última palabra de la clase
				];
				
				for (const pattern of patterns) {
					const match = className.match(pattern);
					if (match && match[1]) {
						language = match[1];
						break;
					}
				}
				
				// Mapear lenguajes comunes
				const langMap: Record<string, string> = {
					'js': 'javascript',
					'ts': 'typescript',
					'py': 'python',
					'sh': 'bash',
					'shell': 'bash',
					'yml': 'yaml',
					'cf': 'yaml',
					'terraform': 'hcl',
				};
				
				language = langMap[language] || language;
				
				// Obtener el código - preferir textContent original
				const code = codeElement?.textContent || content;
				const cleanCode = code.replace(/\n$/, ''); // Quitar último salto
				
				return `\n\`\`\`${language}\n${cleanCode}\n\`\`\`\n`;
			}
		});

		// REGLA 2: Tablas - Conversión robusta
		turndown.addRule('tables', {
			filter: ['table'],
			replacement: (content, node) => {
				const table = node as HTMLTableElement;
				const rows: string[] = [];
				
				// Procesar todas las filas
				table.querySelectorAll('tr').forEach((row, index) => {
					const cells: string[] = [];
					
					// Extraer celdas (th o td)
					row.querySelectorAll('th, td').forEach(cell => {
						// Limpiar el contenido de la celda
						let text = cell.textContent?.trim() || '';
						// Escapar pipes en el contenido
						text = text.replace(/\|/g, '\\|');
						// Limitar longitud
						if (text.length > 100) {
							text = text.substring(0, 97) + '...';
						}
						cells.push(text);
					});
					
					if (cells.length > 0) {
						rows.push('| ' + cells.join(' | ') + ' |');
						
						// Agregar separador después de la primera fila (header)
						if (index === 0) {
							const separator = '| ' + cells.map(() => '---').join(' | ') + ' |';
							rows.push(separator);
						}
					}
				});
				
				if (rows.length === 0) return '';
				
				return '\n' + rows.join('\n') + '\n';
			}
		});

		// REGLA 3: Imágenes con mejor manejo
		turndown.addRule('images', {
			filter: 'img',
			replacement: (content, node) => {
				const img = node as HTMLImageElement;
				const src = img.getAttribute('src') || '';
				const alt = img.alt || '';
				const title = img.title || '';
				
				if (!src) return '';
				
				// Si tiene título, incluirlo
				if (title) {
					return `![${alt}](${src} "${title}")`;
				}
				return `![${alt}](${src})`;
			}
		});

		// REGLA 4: Links con mejor manejo
		turndown.addRule('links', {
			filter: (node): boolean => {
				return node.nodeName === 'A' && !!(node as Element).getAttribute('href');
			},
			replacement: (content, node) => {
				const el = node as HTMLAnchorElement;
				const href = el.getAttribute('href') || '';
				const title = el.getAttribute('title') || '';
				let text = content || el.textContent || '';
				
				// Limpiar texto
				text = text.trim();
				
				// Si el link está vacío, ignorarlo
				if (!text && !href) return '';
				if (!text) return href;
				
				// Si es el mismo texto que el href, solo devolver el href
				if (text === href) return `<${href}>`;
				
				if (title) {
					return `[${text}](${href} "${title}")`;
				}
				return `[${text}](${href})`;
			}
		});

		// REGLA 5: Videos de YouTube
		turndown.addRule('youtube', {
			filter: (node) => {
				if (node.nodeName !== 'IFRAME') return false;
				const src = (node as HTMLIFrameElement).src || '';
				return src.includes('youtube.com') || src.includes('youtu.be');
			},
			replacement: (content, node) => {
				const src = (node as HTMLIFrameElement).src;
				const videoId = this.extractYouTubeId(src);
				if (videoId) {
					return `\n[![YouTube](https://img.youtube.com/vi/${videoId}/0.jpg)](https://www.youtube.com/watch?v=${videoId})\n`;
				}
				return '';
			}
		});

		// REGLA 6: Callouts / Admonitions
		turndown.addRule('callouts', {
			filter: (node) => {
				const el = node as Element;
				const classes = el.className?.toLowerCase() || '';
				return classes.includes('callout') ||
				       classes.includes('admonition') ||
				       classes.includes('alert') ||
				       el.getAttribute('role') === 'note';
			},
			replacement: (content, node) => {
				const el = node as Element;
				const classes = el.className?.toLowerCase() || '';
				
				// Detectar tipo
				let type = 'NOTE';
				if (classes.includes('warning') || classes.includes('caution') || classes.includes('warn')) {
					type = 'WARNING';
				} else if (classes.includes('tip') || classes.includes('hint') || classes.includes('success')) {
					type = 'TIP';
				} else if (classes.includes('danger') || classes.includes('error') || classes.includes('critical')) {
					type = 'DANGER';
				} else if (classes.includes('info') || classes.includes('information')) {
					type = 'INFO';
				}
				
				// Limpiar contenido
				const cleanContent = content.trim().replace(/\n/g, '\n> ');
				
				return `\n> [!${type}]\n> ${cleanContent}\n`;
			}
		});

		// REGLA 7: Blockquotes simples
		turndown.addRule('blockquotes', {
			filter: 'blockquote',
			replacement: (content) => {
				const cleanContent = content.trim().replace(/\n/g, '\n> ');
				return `\n> ${cleanContent}\n`;
			}
		});

		// REGLA 8: Listas anidadas
		turndown.addRule('listItems', {
			filter: 'li',
			replacement: (content, node, options) => {
				content = content.trim();
				if (!content) return '';
				
				const prefix = options.bulletListMarker + ' ';
				const parent = node.parentNode;
				
				// Detectar si es lista ordenada
				if (parent && parent.nodeName === 'OL') {
					const start = (parent as HTMLOListElement).start || 1;
					const index = Array.from(parent.children).indexOf(node as Element);
					return `\n${start + index}. ${content}`;
				}
				
				return `\n${prefix}${content}`;
			}
		});

		// REGLA 9: Dividers
		turndown.addRule('hr', {
			filter: 'hr',
			replacement: () => '\n\n---\n\n'
		});

		// REGLA 10: Eliminar elementos no deseados
		turndown.addRule('removeScripts', {
			filter: ['script', 'style', 'nav', 'header', 'footer', 'aside'],
			replacement: () => ''
		});

		return turndown;
	}

	/**
	 * Extrae el ID de un video de YouTube
	 */
	private extractYouTubeId(url: string): string | null {
		const patterns = [
			/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
			/youtube\.com\/watch\?.*v=([^&\s]+)/,
			/youtu\.be\/([^&\s?]+)/
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
		
		// PASO 1: Limpiar el documento
		const cleanDoc = this.cleanHTML(doc.cloneNode(true) as Document);
		
		// PASO 2: Pre-procesar HTML para mejorar conversión
		const htmlContent = cleanDoc.body?.innerHTML || '';
		const processedHtml = HTMLProcessor.preprocess(htmlContent);
		
		// PASO 3: Crear un nuevo documento con el HTML procesado
		const parser = new DOMParser();
		const processedDoc = parser.parseFromString(
			`<!DOCTYPE html><html><body>${processedHtml}</body></html>`, 
			'text/html'
		);
		
		// PASO 4: Usar Readability si está disponible
		let title = '';
		let content = '';
		let extractedHtml = processedHtml;

		if (Readability) {
			try {
				const reader = new Readability(cleanDoc);
				const article = reader.parse();
				
				if (article && article.content) {
					title = article.title || '';
					extractedHtml = article.content;
				}
			} catch (error) {
				console.warn('[Alchemize] Readability falló, usando fallback:', error);
			}
		}

		// PASO 5: Convertir a Markdown
		content = this.turndownService.turndown(extractedHtml);
		
		// PASO 6: Post-procesar el Markdown
		content = HTMLProcessor.postprocess(content);

		// PASO 7: Extraer metadatos
		const author = this.extractAuthor(cleanDoc);
		const date = this.extractDate(cleanDoc);
		const tags = this.autoTag(content);
		
		// PASO 8: Extraer y procesar imágenes
		const images = this.extractImages(processedDoc.body || processedDoc.documentElement);
		
		// PASO 9: Si no hay título, extraer del documento
		if (!title) {
			title = cleanDoc.title || this.extractTitleFromMarkdown(content) || 'Nota transmutada';
		}

		// PASO 10: Aplicar transformaciones según el modo de exportación
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
				wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
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
			'.byline',
			'[class*="author"]'
		];

		for (const selector of selectors) {
			const element = doc.querySelector(selector);
			if (element) {
				const content = element.getAttribute('content') || element.textContent;
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
			'meta[name="date"]',
			'time[datetime]',
			'.published',
			'.date',
			'[class*="date"]',
			'[class*="published"]'
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
	 * Extrae el título del Markdown (primer heading)
	 */
	private extractTitleFromMarkdown(markdown: string): string | undefined {
		const h1Match = markdown.match(/^#\s+(.+)$/m);
		if (h1Match) return h1Match[1].trim();
		
		const h2Match = markdown.match(/^##\s+(.+)$/m);
		if (h2Match) return h2Match[1].trim();
		
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
		const summary = this.generateSummary(content);
		
		return `## 📝 Resumen\n\n${summary}\n\n---\n\n${content}\n\n---\n\n## 🤔 Preguntas de Repaso\n\n- [ ] ¿Cuál es el concepto principal?\n- [ ] ¿Cuáles son los puntos clave?\n- [ ] ¿Cómo se aplica esto en la práctica?\n`;
	}

	/**
	 * Formatea el contenido para modo flashcards
	 */
	private formatForFlashcards(content: string): string {
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
	 * Genera un resumen simple del contenido
	 */
	private generateSummary(content: string): string {
		const paragraphs = content
			.split('\n\n')
			.filter(p => p.trim() && !p.startsWith('#') && !p.startsWith('```') && !p.startsWith('|'));
		
		if (paragraphs.length === 0) return 'No hay contenido para resumir.';
		
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
