import { 
	Plugin, 
	PluginSettingTab, 
	Setting, 
	Notice, 
	TFolder,
	normalizePath,
	MarkdownView
} from 'obsidian';
import { ExtractorRegistry, extractorRegistry } from './extractors/registry';
import { BaseExtractor, ExtractedContent, ExportMode } from './extractors/base';
import { GenericExtractor } from './extractors/generic';
import { AWSSkillBuilderExtractor } from './extractors/aws-skill-builder';
import { ImageHandler, ImageHandlerSettings, DEFAULT_IMAGE_SETTINGS } from './core/image-handler';
import { PreviewModal, PreviewResult } from './ui/preview-modal';

/**
 * Configuración principal del plugin
 */
interface AlchemizeSettings {
	// Carpeta por defecto para nuevas notas
	defaultFolder: string;
	// Plantilla de nombre de archivo
	filenameTemplate: string;
	// Modo de exportación por defecto
	defaultExportMode: ExportMode;
	// Configuración de imágenes
	imageSettings: ImageHandlerSettings;
	// Si muestra previsualización antes de guardar
	showPreview: boolean;
	// Tags automáticos
	autoTagging: boolean;
	// Tags siempre incluidos
	customTags: string[];
}

const DEFAULT_SETTINGS: AlchemizeSettings = {
	defaultFolder: 'Web Clippings',
	filenameTemplate: '{{date}}-{{title}}',
	defaultExportMode: ExportMode.REFERENCE,
	imageSettings: DEFAULT_IMAGE_SETTINGS,
	showPreview: true,
	autoTagging: true,
	customTags: []
};

/**
 * Plugin principal de Web Importer
 */
export default class AlchemizePlugin extends Plugin {
	settings!: AlchemizeSettings;
	imageHandler!: ImageHandler;
	registry!: ExtractorRegistry;

	async onload() {
		console.log('[Alchemize] ⚗️ Iniciando transmutación...');

		// Cargar configuración
		await this.loadSettings();

		// Inicializar handlers
		this.imageHandler = new ImageHandler(this.app.vault, this.settings.imageSettings);
		this.registry = extractorRegistry;

		// Registrar extractores
		this.registerExtractors();

		// Agregar comandos
		this.addCommands();

		// Agregar pestaña de configuración
		this.addSettingTab(new AlchemizeSettingTab(this.app, this));

		console.log('[Alchemize] ⚗️ Laboratorio listo');
	}

	onunload() {
		console.log('[WebImporter] Descargando plugin...');
	}

	/**
	 * Carga la configuración del plugin
	 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) as AlchemizeSettings;
	}

	/**
	 * Guarda la configuración del plugin
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Registra todos los extractores disponibles
	 */
	private registerExtractors() {
		// Limpiar registro previo
		this.registry.clear();

		// Registrar extractores específicos (orden importa: más específicos primero)
		this.registry.register(new AWSSkillBuilderExtractor(this.settings.defaultExportMode));
		// Aquí se registrarían más extractores específicos
		// this.registry.register(new MediumExtractor());
		// this.registry.register(new DevToExtractor());

		// Registrar extractor genérico como fallback
		this.registry.setFallback(new GenericExtractor(this.settings.defaultExportMode));

		console.log(`[Alchemize] 📚 ${this.registry.count} grimorios cargados`);
	}

	/**
	 * Agrega los comandos del plugin
	 */
	private addCommands() {
		// Comando principal: Smart Transmute
		this.addCommand({
			id: 'smart-transmute',
			name: '⚗️ Smart Transmute (Transmutación automática)',
			callback: () => this.smartPaste()
		});

		// Comando para importar desde URL
		this.addCommand({
			id: 'transmute-from-url',
			name: '🔗 Transmutar desde URL',
			callback: () => this.importFromUrl()
		});

		// Comando para transmutar HTML del clipboard
		this.addCommand({
			id: 'transmute-from-clipboard',
			name: '📋 Transmutar desde Clipboard',
			callback: () => this.importFromClipboard()
		});

		// Comandos para modos específicos
		this.addCommand({
			id: 'transmute-to-study',
			name: '📚 Transmutar a Grimoio de Estudio',
			callback: () => this.smartPaste(ExportMode.STUDY)
		});

		this.addCommand({
			id: 'transmute-to-reference',
			name: '📖 Transmutar a Tomo de Referencia',
			callback: () => this.smartPaste(ExportMode.REFERENCE)
		});

		this.addCommand({
			id: 'transmute-to-flashcards',
			name: '🎴 Transmutar a Cartas de Saber',
			callback: () => this.smartPaste(ExportMode.FLASHCARDS)
		});
	}

	/**
	 * Función principal: Smart Paste
	 * Detecta el tipo de contenido en el clipboard y lo procesa
	 */
	async smartPaste(forcedMode?: ExportMode) {
		try {
			const clipboardContent = await navigator.clipboard.readText();
			
			if (!clipboardContent.trim()) {
				new Notice('⚗️ El caldero está vacío. Copia contenido primero.');
				return;
			}

			// Detectar tipo de contenido
			const contentType = this.detectContentType(clipboardContent);
			console.log(`[Alchemize] 🔮 Esencia detectada: ${contentType}`);

			switch (contentType) {
				case 'url':
					await this.processUrl(clipboardContent.trim(), forcedMode);
					break;
				case 'html':
					await this.processHtml(clipboardContent, '', forcedMode);
					break;
				case 'markdown':
					await this.processMarkdown(clipboardContent, forcedMode);
					break;
				default:
					new Notice('🔮 No se pudo identificar la esencia del contenido');
			}
		} catch (error) {
			console.error('[Alchemize] ⚠️ Error en la transmutación:', error);
			new Notice('⚠️ No se pudo acceder al caldero. Verifica permisos.');
		}
	}

	/**
	 * Detecta si el contenido es URL, HTML o Markdown
	 */
	private detectContentType(content: string): 'url' | 'html' | 'markdown' | 'unknown' {
		const trimmed = content.trim();

		// Detectar URL
		if (this.isUrl(trimmed)) {
			return 'url';
		}

		// Detectar HTML
		if (trimmed.includes('<!DOCTYPE') || 
		    trimmed.includes('<html') ||
		    (trimmed.includes('<') && trimmed.includes('</') && trimmed.includes('>'))) {
			return 'html';
		}

		// Detectar Markdown (tiene sintaxis MD típica)
		if (/^#{1,6}\s/.test(trimmed) || 
		    /\[.*\]\(.*\)/.test(trimmed) ||
		    /```[\s\S]*```/.test(trimmed)) {
			return 'markdown';
		}

		// Si no tiene formato claro, asumir Markdown
		return 'markdown';
	}

	/**
	 * Verifica si una cadena es una URL válida
	 */
	private isUrl(str: string): boolean {
		try {
			new URL(str);
			return str.startsWith('http://') || str.startsWith('https://');
		} catch {
			return false;
		}
	}

	/**
	 * Importa desde una URL
	 */
	private async importFromUrl() {
		// Aquí podríamos mostrar un modal para ingresar URL
		// Por ahora, usamos el clipboard
		await this.smartPaste();
	}

	/**
	 * Importa desde el clipboard (HTML)
	 */
	private async importFromClipboard() {
		await this.smartPaste();
	}

	/**
	 * Procesa una URL
	 */
	private async processUrl(url: string, forcedMode?: ExportMode) {
		new Notice('⚗️ Extrayendo esencia de la fuente...');

		try {
			// En un entorno real, necesitaríamos hacer fetch a la URL
			// Esto tiene limitaciones de CORS en el navegador
			// Una opción es usar un servidor proxy o una función serverless
			
			// Por ahora, mostramos un mensaje informativo
			new Notice('⚠️ Importación desde URL requiere configuración adicional (CORS)');
			
			// Opción alternativa: pedir al usuario que copie el HTML manualmente
			const shouldCopyHtml = confirm(
				'Para importar desde URL, copia el contenido HTML de la página (Ctrl+A, Ctrl+C) y usa "Importar desde Clipboard".\n\n¿Deseas continuar con el clipboard?'
			);
			
			if (shouldCopyHtml) {
				await this.smartPaste(forcedMode);
			}
		} catch (error) {
			console.error('[Alchemize] Error en la extracción:', error);
			new Notice('⚠️ No se pudo extraer de la fuente');
		}
	}

	/**
	 * Procesa HTML
	 */
	private async processHtml(html: string, sourceUrl: string = '', forcedMode?: ExportMode) {
		new Notice('⚗️ Iniciando transmutación...');

		try {
			// Crear un DOM temporal para parsear el HTML
			const parser = new DOMParser();
			const doc = parser.parseFromString(html, 'text/html');

			// Encontrar el extractor apropiado
			const extractor = this.registry.findExtractor(sourceUrl, doc);

			// Extraer contenido
			const content = await extractor.extract(doc, sourceUrl);

			// Aplicar modo forzado si existe
			if (forcedMode) {
				content.metadata.exportMode = forcedMode;
			}

			// Mostrar previsualización o guardar directamente
			if (this.settings.showPreview) {
				this.showPreview(content);
			} else {
				await this.saveContent(content);
			}
		} catch (error) {
			console.error('[Alchemize] Error en la transmutación:', error);
			new Notice('⚠️ La transmutación falló');
		}
	}

	/**
	 * Procesa Markdown (lo limpia y formatea)
	 */
	private async processMarkdown(markdown: string, forcedMode?: ExportMode) {
		new Notice('⚗️ Purificando esencia...');

		// Crear contenido extraído simple
		const content: ExtractedContent = {
			title: this.extractTitleFromMarkdown(markdown) || 'Nota importada',
			markdown: markdown,
			tags: this.settings.autoTagging ? this.extractTagsFromMarkdown(markdown) : [],
			images: [],
			metadata: {
				extractor: 'markdown-import',
				exportMode: forcedMode || this.settings.defaultExportMode
			}
		};

		if (this.settings.showPreview) {
			this.showPreview(content);
		} else {
			await this.saveContent(content);
		}
	}

	/**
	 * Extrae el título del Markdown
	 */
	private extractTitleFromMarkdown(markdown: string): string | undefined {
		// Buscar el primer H1
		const h1Match = markdown.match(/^#\s+(.+)$/m);
		if (h1Match) return h1Match[1].trim();

		// Buscar el primer H2
		const h2Match = markdown.match(/^##\s+(.+)$/m);
		if (h2Match) return h2Match[1].trim();

		return undefined;
	}

	/**
	 * Extrae tags del contenido Markdown
	 */
	private extractTagsFromMarkdown(markdown: string): string[] {
		const techTerms = [
			'AWS', 'React', 'TypeScript', 'JavaScript', 'Python', 'Node.js',
			'Cloud', 'Docker', 'Kubernetes', 'API', 'Database', 'Security'
		];

		const textLower = markdown.toLowerCase();
		const foundTags: string[] = [];

		for (const term of techTerms) {
			if (textLower.includes(term.toLowerCase())) {
				foundTags.push(term);
			}
		}

		return foundTags.slice(0, 5);
	}

	/**
	 * Muestra el modal de previsualización
	 */
	private showPreview(content: ExtractedContent) {
		const folders = this.getAvailableFolders();

		new PreviewModal(
			this.app,
			content,
			folders,
			async (result) => {
				await this.saveFromPreview(result, content);
			},
			() => {
				new Notice('🛑 Transmutación cancelada');
			}
		).open();
	}

	/**
	 * Obtiene las carpetas disponibles en el vault
	 */
	private getAvailableFolders(): string[] {
		const folders: string[] = ['/'];
		
		const root = this.app.vault.getRoot();
		const collectFolders = (folder: TFolder, prefix: string) => {
			for (const child of folder.children) {
				if (child instanceof TFolder) {
					const path = prefix ? `${prefix}/${child.name}` : child.name;
					folders.push(path);
					collectFolders(child, path);
				}
			}
		};
		
		collectFolders(root, '');
		return folders.sort();
	}

	/**
	 * Guarda el contenido desde el resultado de previsualización
	 */
	private async saveFromPreview(result: PreviewResult, originalContent: ExtractedContent) {
		try {
			new Notice('💎 Cristalizando en el grimorio...');

			// Procesar imágenes
			const processedImages = await this.imageHandler.processImages(
				result.images,
				result.folder,
				this.sanitizeFileName(result.title)
			);

			// Reemplazar URLs de imágenes en el markdown
			let finalMarkdown = result.markdown;
			for (const image of processedImages) {
				if (image.localPath) {
					// Crear regex para encontrar la URL en markdown (puede estar en links de imagen)
					const escapedUrl = image.originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
					const regex = new RegExp(escapedUrl, 'g');
					finalMarkdown = finalMarkdown.replace(regex, image.localPath);
				}
			}

			// Generar nombre de archivo
			const fileName = this.generateFileName(result.title);
			const filePath = normalizePath(`${result.folder}/${fileName}`);

			// Verificar si existe
			const existingFile = this.app.vault.getAbstractFileByPath(filePath);
			if (existingFile) {
				const overwrite = confirm(`El archivo ${fileName} ya existe. ¿Sobrescribir?`);
				if (!overwrite) return;
			}

			// Crear o modificar archivo
			if (existingFile) {
				await this.app.vault.modify(existingFile as any, finalMarkdown);
			} else {
				// Asegurar que existe la carpeta
				await this.ensureFolder(result.folder);
				await this.app.vault.create(filePath, finalMarkdown);
			}

			// Abrir el archivo
			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (file) {
				await this.app.workspace.openLinkText(filePath, '');
			}

			new Notice(`💎 Esencia cristalizada: ${fileName}`);
		} catch (error) {
			console.error('[Alchemize] Error en la cristalización:', error);
			new Notice('⚠️ No se pudo cristalizar la esencia');
		}
	}

	/**
	 * Guarda el contenido directamente (sin previsualización)
	 */
	private async saveContent(content: ExtractedContent) {
		// Similar a saveFromPreview pero con valores por defecto
		const result: PreviewResult = {
			title: content.title || 'Sin título',
			folder: this.settings.defaultFolder,
			tags: content.tags,
			exportMode: content.metadata?.exportMode || this.settings.defaultExportMode,
			markdown: content.markdown,
			images: content.images
		};

		await this.saveFromPreview(result, content);
	}

	/**
	 * Genera el nombre del archivo según el template
	 */
	private generateFileName(title: string): string {
		const now = new Date();
		const date = now.toISOString().split('T')[0];
		const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
		
		let fileName = this.settings.filenameTemplate
			.replace('{{date}}', date)
			.replace('{{time}}', time)
			.replace('{{title}}', this.sanitizeFileName(title));
		
		if (!fileName.endsWith('.md')) {
			fileName += '.md';
		}
		
		return fileName;
	}

	/**
	 * Limpia un nombre de archivo
	 */
	private sanitizeFileName(name: string): string {
		return name
			.replace(/[<>:"/\\|?*]/g, '-')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.substring(0, 100)
			.toLowerCase();
	}

	/**
	 * Asegura que una carpeta existe
	 */
	private async ensureFolder(folderPath: string) {
		if (folderPath === '/' || folderPath === '') return;
		
		const folder = this.app.vault.getAbstractFileByPath(folderPath);
		if (!folder) {
			await this.app.vault.createFolder(folderPath);
		}
	}
}

/**
 * Pestaña de configuración del plugin
 */
class AlchemizeSettingTab extends PluginSettingTab {
	plugin: AlchemizePlugin;

	constructor(app: any, plugin: AlchemizePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: '⚗️ Alchemize - Configuración del Laboratorio' });

		// Carpeta por defecto
		new Setting(containerEl)
			.setName('Carpeta por defecto')
			.setDesc('Carpeta donde se guardarán las notas importadas')
			.addText(text => text
				.setPlaceholder('Grimorios Web')
				.setValue(this.plugin.settings.defaultFolder)
				.onChange(async (value) => {
					this.plugin.settings.defaultFolder = value;
					await this.plugin.saveSettings();
				}));

		// Template de nombre de archivo
		new Setting(containerEl)
			.setName('Template de nombre de archivo')
			.setDesc('Variables disponibles: {{date}}, {{time}}, {{title}}')
			.addText(text => text
				.setPlaceholder('{{date}}-{{title}}')
				.setValue(this.plugin.settings.filenameTemplate)
				.onChange(async (value) => {
					this.plugin.settings.filenameTemplate = value;
					await this.plugin.saveSettings();
				}));

		// Modo de exportación por defecto
		new Setting(containerEl)
			.setName('Modo de exportación por defecto')
			.setDesc('Cómo estructurar las notas importadas')
			.addDropdown(dropdown => {
				dropdown.addOption(ExportMode.REFERENCE, 'Referencia');
				dropdown.addOption(ExportMode.STUDY, 'Estudio');
				dropdown.addOption(ExportMode.FLASHCARDS, 'Flashcards');
				dropdown.setValue(this.plugin.settings.defaultExportMode)
					.onChange(async (value) => {
						this.plugin.settings.defaultExportMode = value as ExportMode;
						await this.plugin.saveSettings();
					});
			});

		// Mostrar previsualización
		new Setting(containerEl)
			.setName('Mostrar previsualización')
			.setDesc('Muestra una ventana de previsualización antes de guardar')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showPreview)
				.onChange(async (value) => {
					this.plugin.settings.showPreview = value;
					await this.plugin.saveSettings();
				}));

		// Tags automáticos
		new Setting(containerEl)
			.setName('Tags automáticos')
			.setDesc('Detecta automáticamente tags basados en el contenido')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoTagging)
				.onChange(async (value) => {
					this.plugin.settings.autoTagging = value;
					await this.plugin.saveSettings();
				}));

		// Configuración de imágenes
		containerEl.createEl('h3', { text: '🖼️ Captura de Esencias Visuales' });

		new Setting(containerEl)
			.setName('Descargar imágenes')
			.setDesc('Descarga las imágenes al vault en lugar de dejar URLs externas')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.imageSettings.downloadImages)
				.onChange(async (value) => {
					this.plugin.settings.imageSettings.downloadImages = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Carpeta de imágenes')
			.setDesc('Nombre de la subcarpeta para las imágenes')
			.addText(text => text
				.setPlaceholder('assets')
				.setValue(this.plugin.settings.imageSettings.imageFolder)
				.onChange(async (value) => {
					this.plugin.settings.imageSettings.imageFolder = value;
					await this.plugin.saveSettings();
				}));

		// Información adicional
		containerEl.createEl('h3', { text: 'ℹ️ Conocimiento del Laboratorio' });
		
		const info = containerEl.createDiv('alchemize-info');
		info.createEl('p', { 
			text: `Extractores registrados: ${this.plugin.registry.count}` 
		});
		
		const extractorList = info.createEl('ul');
		this.plugin.registry.getAllExtractors().forEach(extractor => {
			extractorList.createEl('li', { text: extractor.name });
		});
	}
}
