import { App, Modal, Setting, TextComponent, TextAreaComponent, DropdownComponent, Notice } from 'obsidian';
import { ExtractedContent, ExportMode } from '../extractors/base';

/**
 * Modal de previsualización antes de guardar
 */
export class PreviewModal extends Modal {
	private content: ExtractedContent;
	private onConfirm: (result: PreviewResult) => void;
	private onCancel: () => void;

	// Valores editables
	private editedTitle: string;
	private editedTags: string;
	private selectedMode: ExportMode;
	private selectedFolder: string;
	private editedMarkdown: string;

	// Carpetas disponibles
	private folders: string[];

	constructor(
		app: App,
		content: ExtractedContent,
		folders: string[],
		onConfirm: (result: PreviewResult) => void,
		onCancel: () => void
	) {
		super(app);
		this.content = content;
		this.folders = folders;
		this.onConfirm = onConfirm;
		this.onCancel = onCancel;

		// Inicializar valores editables
		this.editedTitle = content.title || 'Sin título';
		this.editedTags = content.tags.join(', ');
		this.selectedMode = ExportMode.REFERENCE;
		this.selectedFolder = folders[0] || '/';
		this.editedMarkdown = content.markdown;
	}

	onOpen() {
		const { contentEl } = this;
		
		contentEl.empty();
		contentEl.addClass('alchemize-preview-modal');

		// Título del modal
		this.titleEl.setText('⚗️ Alchemize - Visión de la Transmutación');

		// Header con info
		const header = contentEl.createDiv('preview-header');
		header.createEl('p', { 
			text: `Fuente: ${this.content.sourceUrl || 'Clipboard'}`,
			cls: 'source-info'
		});
		header.createEl('p', { 
			text: `Extractor: ${this.content.metadata?.extractor || 'generic'}`,
			cls: 'extractor-info'
		});

		// Formulario editable
		const form = contentEl.createDiv('preview-form');

		// Título
		new Setting(form)
			.setName('Título')
			.setDesc('Título de la nota')
			.addText(text => {
				text.setValue(this.editedTitle)
					.onChange(value => {
						this.editedTitle = value;
					});
			});

		// Carpeta destino
		new Setting(form)
			.setName('Carpeta')
			.setDesc('Ubicación donde se guardará la nota')
			.addDropdown(dropdown => {
				this.folders.forEach(folder => {
					dropdown.addOption(folder, folder);
				});
				dropdown.setValue(this.selectedFolder)
					.onChange(value => {
						this.selectedFolder = value;
					});
			});

		// Tags
		new Setting(form)
			.setName('Tags')
			.setDesc('Separados por comas')
			.addText(text => {
				text.setValue(this.editedTags)
				.onChange(value => {
					this.editedTags = value;
				});
			});

		// Modo de exportación
		new Setting(form)
			.setName('Modo de Exportación')
			.setDesc('Cómo estructurar el contenido')
			.addDropdown(dropdown => {
				dropdown.addOption(ExportMode.REFERENCE, '📚 Referencia (Documentación limpia)');
				dropdown.addOption(ExportMode.STUDY, '📝 Estudio (Con notas y objetivos)');
				dropdown.addOption(ExportMode.FLASHCARDS, '🎴 Flashcards (Para repetición espaciada)');
				dropdown.setValue(this.selectedMode)
					.onChange(value => {
						this.selectedMode = value as ExportMode;
						this.updatePreview();
					});
			});

		// Imágenes
		if (this.content.images.length > 0) {
			const imageSetting = new Setting(form)
				.setName(`Imágenes (${this.content.images.length})`)
				.setDesc('Vista previa de imágenes detectadas');
			
			const imageList = form.createDiv('image-list');
			this.content.images.forEach((img, index) => {
				const imgItem = imageList.createDiv('image-item');
				imgItem.createEl('span', { 
					text: `${index + 1}. ${img.altText}`,
					cls: 'image-name'
				});
				if (img.isDiagram) {
					imgItem.createEl('span', { 
						text: ' (Diagrama)',
						cls: 'diagram-badge'
					});
				}
			});
		}

		// Previsualización del contenido
		contentEl.createEl('h3', { text: '📄 Vista Previa del Contenido' });
		
		const previewContainer = contentEl.createDiv('preview-content-container');
		const previewText = previewContainer.createEl('textarea', {
			cls: 'preview-textarea',
			attr: {
				rows: '20'
			}
		});
		previewText.value = this.getFullPreview();
		previewText.addEventListener('input', (e) => {
			this.editedMarkdown = (e.target as HTMLTextAreaElement).value;
		});

		// Botones de acción
		const buttonContainer = contentEl.createDiv('modal-button-container');
		
		buttonContainer.createEl('button', { 
			text: '❌ Cancelar',
			cls: 'mod-warning'
		}).addEventListener('click', () => {
			this.onCancel();
			this.close();
		});

		buttonContainer.createEl('button', { 
			text: '✅ Importar',
			cls: 'mod-cta'
		}).addEventListener('click', () => {
			this.confirm();
		});

		// Aplicar estilos
		this.applyStyles();
	}

	/**
	 * Actualiza la previsualización cuando cambia el modo
	 */
	private updatePreview() {
		const textarea = this.contentEl.querySelector('.preview-textarea') as HTMLTextAreaElement;
		if (textarea) {
			// Aquí podríamos regenerar el contenido según el modo seleccionado
			// Por ahora solo actualizamos el frontmatter
			textarea.value = this.getFullPreview();
		}
	}

	/**
	 * Genera la previsualización completa con frontmatter
	 */
	private getFullPreview(): string {
		const frontmatter = this.generateFrontmatter();
		return frontmatter + this.editedMarkdown;
	}

	/**
	 * Genera el frontmatter con los valores actuales
	 */
	private generateFrontmatter(): string {
		const lines: string[] = ['---'];
		
		lines.push(`title: "${this.editedTitle.replace(/"/g, '\\"')}"`);
		
		if (this.content.author) {
			lines.push(`author: "${this.content.author}"`);
		}
		
		if (this.content.date) {
			lines.push(`date: ${this.content.date.toISOString().split('T')[0]}`);
		}
		
		if (this.content.sourceUrl) {
			lines.push(`source: "${this.content.sourceUrl}"`);
		}
		
		// Tags
		const tags = this.editedTags
			.split(',')
			.map(t => t.trim())
			.filter(t => t.length > 0);
		
		if (tags.length > 0) {
			lines.push(`tags:`);
			tags.forEach(tag => lines.push(`  - ${tag}`));
		}
		
		// Metadata adicional
		lines.push(`imported_with: alchemize`);
		lines.push(`export_mode: ${this.selectedMode}`);
		lines.push(`extractor: ${this.content.metadata?.extractor || 'generic'}`);
		
		if (this.content.images.length > 0) {
			lines.push(`images_count: ${this.content.images.length}`);
		}
		
		lines.push('---');
		lines.push('');
		
		return lines.join('\n');
	}

	/**
	 * Confirma la importación
	 */
	private confirm() {
		if (!this.editedTitle.trim()) {
			new Notice('❌ El título es obligatorio');
			return;
		}

		const result: PreviewResult = {
			title: this.editedTitle.trim(),
			folder: this.selectedFolder,
			tags: this.editedTags
				.split(',')
				.map(t => t.trim())
				.filter(t => t.length > 0),
			exportMode: this.selectedMode,
			markdown: this.editedMarkdown,
			images: this.content.images
		};

		this.onConfirm(result);
		this.close();
	}

	/**
	 * Aplica estilos CSS al modal
	 */
	private applyStyles() {
		// Los estilos se pueden mover a styles.css
		const style = document.createElement('style');
		style.textContent = `
			.alchemize-preview-modal .preview-header {
				padding: 10px;
				background: var(--background-secondary);
				border-radius: 5px;
				margin-bottom: 15px;
			}
			.alchemize-preview-modal .source-info,
			.alchemize-preview-modal .extractor-info {
				margin: 0;
				font-size: 0.9em;
				color: var(--text-muted);
			}
			.alchemize-preview-modal .preview-form {
				margin-bottom: 20px;
			}
			.alchemize-preview-modal .image-list {
				margin-top: 10px;
				padding: 10px;
				background: var(--background-secondary);
				border-radius: 5px;
			}
			.alchemize-preview-modal .image-item {
				padding: 5px 0;
				font-size: 0.9em;
			}
			.alchemize-preview-modal .diagram-badge {
				background: var(--interactive-accent);
				color: var(--text-on-accent);
				padding: 2px 6px;
				border-radius: 3px;
				font-size: 0.8em;
			}
			.alchemize-preview-modal .preview-content-container {
				margin: 15px 0;
			}
			.alchemize-preview-modal .preview-textarea {
				width: 100%;
				font-family: var(--font-monospace);
				font-size: 0.9em;
				background: var(--background-primary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 5px;
				padding: 10px;
				resize: vertical;
			}
			.alchemize-preview-modal .modal-button-container {
				display: flex;
				justify-content: flex-end;
				gap: 10px;
				margin-top: 20px;
				padding-top: 15px;
				border-top: 1px solid var(--background-modifier-border);
			}
		`;
		this.contentEl.appendChild(style);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

/**
 * Resultado de la previsualización
 */
export interface PreviewResult {
	title: string;
	folder: string;
	tags: string[];
	exportMode: ExportMode;
	markdown: string;
	images: { originalUrl: string; altText: string; isDiagram?: boolean }[];
}
