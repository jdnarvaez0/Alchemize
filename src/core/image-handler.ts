import { TFile, TFolder, Vault, normalizePath } from 'obsidian';
import { ImageAsset } from '../extractors/base';

/**
 * Maneja la descarga y organización de imágenes
 */
export class ImageHandler {
	private vault: Vault;
	private settings: ImageHandlerSettings;

	constructor(vault: Vault, settings: ImageHandlerSettings) {
		this.vault = vault;
		this.settings = settings;
	}

	/**
	 * Procesa todas las imágenes de un contenido extraído
	 * @param images Lista de imágenes a procesar
	 * @param targetFolder Carpeta donde se guardará la nota
	 * @param noteName Nombre de la nota (para nombrar las imágenes)
	 * @returns Imágenes con rutas locales actualizadas
	 */
	async processImages(
		images: ImageAsset[],
		targetFolder: string,
		noteName: string
	): Promise<ImageAsset[]> {
		if (!this.settings.downloadImages || images.length === 0) {
			return images;
		}

		const processedImages: ImageAsset[] = [];
		const assetsFolder = await this.ensureAssetsFolder(targetFolder);

		for (let i = 0; i < images.length; i++) {
			const image = images[i];
			try {
				const processed = await this.processSingleImage(
					image, 
					assetsFolder, 
					`${noteName}-${i + 1}`
				);
				processedImages.push(processed);
			} catch (error) {
				console.warn(`[Alchemize] ⚠️ Error capturando esencia visual ${image.originalUrl}:`, error);
				// Mantener la imagen original si falla la descarga
				processedImages.push(image);
			}
		}

		return processedImages;
	}

	/**
	 * Procesa una sola imagen
	 */
	private async processSingleImage(
		image: ImageAsset,
		assetsFolder: string,
		baseName: string
	): Promise<ImageAsset> {
		// Validar URL
		if (!this.isValidUrl(image.originalUrl) && !this.isBase64(image.originalUrl)) {
			return image;
		}

		// Generar nombre de archivo
		const fileName = this.generateFileName(image, baseName);
		const filePath = normalizePath(`${assetsFolder}/${fileName}`);

		// Verificar si ya existe
		const existingFile = this.vault.getAbstractFileByPath(filePath);
		if (existingFile instanceof TFile) {
			return {
				...image,
				localPath: filePath
			};
		}

		// Descargar o decodificar la imagen
		let imageData: ArrayBuffer;
		let mimeType = image.mimeType;

		if (this.isBase64(image.originalUrl)) {
			imageData = this.decodeBase64(image.originalUrl);
			mimeType = mimeType || this.getMimeTypeFromBase64(image.originalUrl);
		} else {
			const downloaded = await this.downloadImage(image.originalUrl);
			imageData = downloaded.data;
			mimeType = mimeType || downloaded.mimeType;
		}

		// Convertir SVG a PNG si está configurado
		let finalData = imageData;
		let finalName = fileName;
		
		if (this.settings.convertSvgToPng && this.isSvg(mimeType, fileName)) {
			// TODO: Implementar conversión SVG→PNG con sharp (requiere backend)
			// Por ahora, guardamos como SVG
			console.log('[WebImporter] Conversión SVG→PNG pendiente de implementación');
		}

		// Guardar archivo en el vault
		await this.vault.createBinary(filePath, finalData);

		return {
			...image,
			localPath: filePath,
			mimeType
		};
	}

	/**
	 * Descarga una imagen desde URL
	 */
	private async downloadImage(url: string): Promise<{ data: ArrayBuffer; mimeType?: string }> {
		// Para URLs relativas, convertir a absolutas
		const absoluteUrl = this.makeAbsoluteUrl(url);
		
		try {
			const response = await fetch(absoluteUrl, {
				method: 'GET',
				// Algunos sitios requieren headers específicos
				headers: {
					'User-Agent': 'Mozilla/5.0 (compatible; Obsidian WebImporter)'
				}
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const mimeType = response.headers.get('content-type') || undefined;
			const data = await response.arrayBuffer();

			return { data, mimeType };
		} catch (error) {
			console.error(`[WebImporter] Error descargando ${absoluteUrl}:`, error);
			throw error;
		}
	}

	/**
	 * Decodifica una imagen en base64
	 */
	private decodeBase64(dataUrl: string): ArrayBuffer {
		const base64 = dataUrl.split(',')[1];
		const binaryString = atob(base64);
		const bytes = new Uint8Array(binaryString.length);
		
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		
		return bytes.buffer;
	}

	/**
	 * Obtiene el MIME type de un data URL
	 */
	private getMimeTypeFromBase64(dataUrl: string): string | undefined {
		const match = dataUrl.match(/^data:([^;]+);/);
		return match ? match[1] : undefined;
	}

	/**
	 * Genera un nombre de archivo descriptivo
	 */
	private generateFileName(image: ImageAsset, baseName: string): string {
		// Limpiar el nombre base
		const cleanBase = baseName
			.replace(/[^a-zA-Z0-9\-_]/g, '-')
			.replace(/-+/g, '-')
			.toLowerCase();

		// Obtener extensión del URL original
		const originalUrl = image.originalUrl;
		let extension = 'png';

		if (this.isBase64(originalUrl)) {
			const mimeType = this.getMimeTypeFromBase64(originalUrl);
			extension = this.mimeTypeToExtension(mimeType) || 'png';
		} else {
			const urlExtension = originalUrl.split('.').pop()?.toLowerCase();
			if (urlExtension && /^[a-z0-9]+$/.test(urlExtension) && urlExtension.length <= 5) {
				extension = urlExtension;
			}
		}

		// Limitar extensiones válidas
		const validExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'];
		if (!validExtensions.includes(extension)) {
		extension = 'png';
		}

		// Agregar sufijo descriptivo si es un diagrama
		const suffix = image.isDiagram ? '-diagram' : '';

		return `${cleanBase}${suffix}.${extension}`;
	}

	/**
	 * Asegura que existe la carpeta de assets
	 */
	private async ensureAssetsFolder(targetFolder: string): Promise<string> {
		const assetsPath = normalizePath(`${targetFolder}/${this.settings.imageFolder}`);
		
		const folder = this.vault.getAbstractFileByPath(assetsPath);
		if (!folder) {
			await this.vault.createFolder(assetsPath);
		}

		return assetsPath;
	}

	/**
	 * Convierte URLs relativas a absolutas
	 */
	private makeAbsoluteUrl(url: string): string {
		if (url.startsWith('http://') || url.startsWith('https://')) {
			return url;
		}
		
		// Para URLs relativas, necesitamos el origin
		// Esto es un fallback - idealmente deberíamos pasar el origin desde el extractor
		if (url.startsWith('//')) {
			return `https:${url}`;
		}
		
		if (url.startsWith('/')) {
			// No podemos determinar el dominio base aquí
			// El extractor debería proporcionar URLs absolutas
			return url;
		}
		
		return url;
	}

	/**
	 * Valida si una string es una URL válida
	 */
	private isValidUrl(url: string): boolean {
		return url.startsWith('http://') || 
		       url.startsWith('https://') || 
		       url.startsWith('//');
	}

	/**
	 * Verifica si es un data URL en base64
	 */
	private isBase64(url: string): boolean {
		return url.startsWith('data:image/') && url.includes('base64,');
	}

	/**
	 * Verifica si es SVG
	 */
	private isSvg(mimeType?: string, fileName?: string): boolean {
		if (mimeType?.includes('svg')) return true;
		if (fileName?.toLowerCase().endsWith('.svg')) return true;
		return false;
	}

	/**
	 * Convierte MIME type a extensión
	 */
	private mimeTypeToExtension(mimeType?: string): string | undefined {
		const mapping: Record<string, string> = {
			'image/png': 'png',
			'image/jpeg': 'jpg',
			'image/jpg': 'jpg',
			'image/gif': 'gif',
			'image/svg+xml': 'svg',
			'image/webp': 'webp',
			'image/bmp': 'bmp'
		};
		
		return mimeType ? mapping[mimeType] : undefined;
	}
}

/**
 * Configuración del manejador de imágenes
 */
export interface ImageHandlerSettings {
	/** Si debe descargar imágenes o dejar URLs externas */
	downloadImages: boolean;
	/** Nombre de la carpeta para imágenes (relativa a la nota) */
	imageFolder: string;
	/** Si debe convertir SVG a PNG */
	convertSvgToPng: boolean;
}

/** Configuración por defecto */
export const DEFAULT_IMAGE_SETTINGS: ImageHandlerSettings = {
	downloadImages: true,
	imageFolder: 'assets',
	convertSvgToPng: false
};
