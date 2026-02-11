import { BaseExtractor, ExtractedContent, ExportMode } from './base';
import TurndownService from 'turndown';

/**
 * Extractor específico para AWS Skill Builder
 * Optimizado para estructura de cursos de aprendizaje de AWS
 */
export class AWSSkillBuilderExtractor extends BaseExtractor {
	readonly name = 'aws-skill-builder';
	
	private turndownService: TurndownService;
	private exportMode: ExportMode;

	constructor(exportMode: ExportMode = ExportMode.STUDY) {
		super();
		this.exportMode = exportMode;
		this.turndownService = this.setupTurndown();
	}

	/**
	 * Configura Turndown con reglas específicas para AWS
	 */
	private setupTurndown(): TurndownService {
		const turndown = new TurndownService({
			headingStyle: 'atx',
			bulletListMarker: '-',
			codeBlockStyle: 'fenced',
		});

		// Reglas específicas para AWS Skill Builder
		turndown.addRule('awsCodeBlocks', {
			filter: (node) => {
				const el = node as Element;
				return node.nodeName === 'PRE' || 
				       el.classList?.contains('code-block') ||
				       el.classList?.contains('highlight');
			},
			replacement: (content, node) => {
				const element = node as Element;
				const codeElement = element.querySelector('code');
				
				// Detectar lenguaje
				let language = '';
				const className = codeElement?.className || element.className || '';
				const match = className.match(/language-(\w+)/);
				if (match) language = match[1];
				
				// Mapear lenguajes comunes en AWS
				const langMap: Record<string, string> = {
					'python': 'python',
					'javascript': 'javascript',
					'js': 'javascript',
					'json': 'json',
					'bash': 'bash',
					'shell': 'bash',
					'powershell': 'powershell',
					'yaml': 'yaml',
					'yml': 'yaml',
					'cloudformation': 'yaml',
					'terraform': 'hcl',
					'sql': 'sql'
				};
				
				language = langMap[language] || language;
				const code = codeElement?.textContent || content;
				
				return `\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
			}
		});

		// Manejar notas importantes de AWS (callouts)
		turndown.addRule('awsNotes', {
			filter: (node) => {
				const el = node as Element;
				return el.classList?.contains('aws-note') ||
				       el.classList?.contains('alert') ||
				       el.getAttribute('role') === 'note';
			},
			replacement: (content, node) => {
				const element = node as Element;
				
				// Detectar tipo de nota
				let type = 'note';
				if (element.classList.contains('warning') || 
				    element.classList.contains('alert-warning')) {
					type = 'warning';
				} else if (element.classList.contains('tip') || 
				           element.classList.contains('alert-info')) {
					type = 'tip';
				} else if (element.classList.contains('important') || 
				           element.classList.contains('alert-danger')) {
					type = 'important';
				}
				
				const cleanContent = content.trim().replace(/\n/g, '\n> ');
				return `\n\n> [!${type.toUpperCase()}]\n> ${cleanContent}\n\n`;
			}
		});

		return turndown;
	}

	/**
	 * Detecta si es una página de AWS Skill Builder
	 */
	canHandle(url: string, doc: Document): boolean {
		// Verificar URL
		if (url.includes('skillbuilder.aws') || 
		    url.includes('explore.skillbuilder.aws')) {
			return true;
		}
		
		// Verificar elementos característicos de AWS Skill Builder
		const indicators = [
			'[data-testid="course-content"]',
			'.course-content',
			'[class*="aws-skill-builder"]',
			'.module-content',
			'.learning-content'
		];
		
		return indicators.some(selector => doc.querySelector(selector) !== null);
	}

	/**
	 * Extrae el contenido del curso AWS
	 */
	async extract(doc: Document, url?: string): Promise<ExtractedContent> {
		// Limpiar el documento
		const cleanDoc = this.cleanHTML(doc.cloneNode(true) as Document);
		
		// Extraer información del curso
		const courseTitle = this.extractCourseTitle(cleanDoc);
		const moduleTitle = this.extractModuleTitle(cleanDoc);
		const learningObjectives = this.extractLearningObjectives(cleanDoc);
		const estimatedTime = this.extractEstimatedTime(cleanDoc);
		
		// Encontrar el contenido principal
		const contentElement = this.findMainContent(cleanDoc);
		const content = this.turndownService.turndown(contentElement.innerHTML);
		
		// Extraer imágenes (diagramas de arquitectura son importantes en AWS)
		const images = this.extractImages(contentElement);
		
		// Identificar imágenes que son diagramas de arquitectura
		images.forEach(img => {
			if (this.isArchitectureDiagram(img)) {
				img.isDiagram = true;
				img.altText = img.altText || 'Diagrama de Arquitectura AWS';
			}
		});
		
		const title = moduleTitle 
			? `${courseTitle} - ${moduleTitle}` 
			: courseTitle;
		
		const tags = ['aws', 'cloud', 'certification', ...this.autoTag(content)];
		
		// Formatear según modo de exportación
		const formattedContent = this.formatContent(content, {
			courseTitle,
			moduleTitle,
			learningObjectives,
			estimatedTime,
			images
		});
		
		return {
			title,
			sourceUrl: url,
			tags,
			markdown: formattedContent,
			images,
			metadata: {
				platform: 'aws-skill-builder',
				course: courseTitle,
				module: moduleTitle,
				objectives: learningObjectives,
				estimatedTime,
				wordCount: content.split(/\s+/).length,
				exportMode: this.exportMode
			}
		};
	}

	/**
	 * Extrae el título del curso
	 */
	private extractCourseTitle(doc: Document): string {
		const selectors = [
			'h1.course-title',
			'[data-testid="course-title"]',
			'.course-header h1',
			'h1'
		];
		
		for (const selector of selectors) {
			const element = doc.querySelector(selector);
			if (element?.textContent) {
				return element.textContent.trim();
			}
		}
		
		return doc.title || 'Curso AWS';
	}

	/**
	 * Extrae el título del módulo actual
	 */
	private extractModuleTitle(doc: Document): string | undefined {
		const selectors = [
			'.module-title',
			'[data-testid="module-title"]',
			'.current-module h2',
			'.content-header h2'
		];
		
		for (const selector of selectors) {
			const element = doc.querySelector(selector);
			if (element?.textContent) {
				return element.textContent.trim();
			}
		}
		
		return undefined;
	}

	/**
	 * Extrae los objetivos de aprendizaje
	 */
	private extractLearningObjectives(doc: Document): string[] {
		const objectives: string[] = [];
		
		const selectors = [
			'.learning-objectives li',
			'[data-testid="learning-objective"]',
			'.objectives-list li',
			'.learning-outcomes li'
		];
		
		for (const selector of selectors) {
			doc.querySelectorAll(selector).forEach(el => {
				if (el.textContent) {
					objectives.push(el.textContent.trim());
				}
			});
			
			if (objectives.length > 0) break;
		}
		
		return objectives;
	}

	/**
	 * Extrae el tiempo estimado de lectura
	 */
	private extractEstimatedTime(doc: Document): string | undefined {
		const selectors = [
			'.estimated-time',
			'[data-testid="duration"]',
			'.duration',
			'time[datetime]'
		];
		
		for (const selector of selectors) {
			const element = doc.querySelector(selector);
			if (element?.textContent) {
				return element.textContent.trim();
			}
		}
		
		return undefined;
	}

	/**
	 * Encuentra el elemento que contiene el contenido principal
	 */
	private findMainContent(doc: Document): Element {
		const selectors = [
			'[data-testid="course-content"]',
			'.course-content',
			'.module-content',
			'.learning-content',
			'article',
			'main',
			'.content'
		];
		
		for (const selector of selectors) {
			const element = doc.querySelector(selector);
			if (element) return element;
		}
		
		return doc.body;
	}

	/**
	 * Determina si una imagen es un diagrama de arquitectura AWS
	 */
	private isArchitectureDiagram(img: { originalUrl: string; altText: string }): boolean {
		const keywords = [
			'architecture', 'diagram', 'diagrama', 'arquitectura',
			'schema', 'infrastructure', 'infraestructura',
			'vpc', 'subnet', 'ec2', 's3', 'rds', 'lambda',
			'flow', 'workflow', 'data-flow'
		];
		
		const text = (img.originalUrl + ' ' + img.altText).toLowerCase();
		return keywords.some(kw => text.includes(kw));
	}

	/**
	 * Formatea el contenido según el modo de exportación
	 */
	private formatContent(
		content: string, 
		meta: {
			courseTitle: string;
			moduleTitle?: string;
			learningObjectives: string[];
			estimatedTime?: string;
			images: { originalUrl: string; altText: string; isDiagram?: boolean; localPath?: string }[];
		}
	): string {
		const lines: string[] = [];
		
		// Objetivos de aprendizaje
		if (meta.learningObjectives.length > 0) {
			lines.push('## 🎯 Objetivos de Aprendizaje');
			lines.push('');
			meta.learningObjectives.forEach(obj => {
				lines.push(`- [ ] ${obj}`);
			});
			lines.push('');
			lines.push('---');
			lines.push('');
		}
		
		// Contenido principal
		lines.push('## 📚 Contenido');
		lines.push('');
		lines.push(content);
		lines.push('');
		
		// Diagramas de arquitectura
		const diagrams = meta.images.filter(img => img.isDiagram);
		if (diagrams.length > 0) {
			lines.push('---');
			lines.push('');
			lines.push('## 🏗️ Diagramas de Arquitectura');
			lines.push('');
			diagrams.forEach((img, index) => {
				lines.push(`### Diagrama ${index + 1}: ${img.altText}`);
				lines.push('');
				lines.push(`![${img.altText}](${img.localPath || img.originalUrl})`);
				lines.push('');
			});
		}
		
		// Sección de estudio según el modo
		if (this.exportMode === ExportMode.STUDY) {
			lines.push('---');
			lines.push('');
			lines.push('## 📝 Notas de Estudio');
			lines.push('');
			lines.push('### Puntos Clave');
			lines.push('- ');
			lines.push('- ');
			lines.push('- ');
			lines.push('');
			lines.push('### Términos Importantes');
			lines.push('| Término | Definición |');
			lines.push('|---------|------------|');
			lines.push('|         |            |');
			lines.push('');
			lines.push('### Preguntas de Examen');
			lines.push('- ❓ ');
			lines.push('  - ✅ ');
		}
		
		return lines.join('\n');
	}
}
