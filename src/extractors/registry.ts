import { BaseExtractor } from './base';

/**
 * Registro de extractores - Patrón Registry
 * Permite registrar y buscar extractores específicos según el contenido
 */
export class ExtractorRegistry {
	private extractors: BaseExtractor[] = [];
	private fallbackExtractor: BaseExtractor | null = null;

	/**
	 * Registra un extractor en el sistema
	 * @param extractor Instancia del extractor a registrar
	 */
	register(extractor: BaseExtractor): void {
		this.extractors.push(extractor);
		console.log(`[Alchemize] Extractor registrado: ${extractor.name}`);
	}

	/**
	 * Establece el extractor de fallback (usado cuando ningún otro coincide)
	 * @param extractor Extractor genérico por defecto
	 */
	setFallback(extractor: BaseExtractor): void {
		this.fallbackExtractor = extractor;
	}

	/**
	 * Busca el extractor apropiado para el contenido dado
	 * @param url URL del documento
	 * @param doc Documento DOM
	 * @returns El extractor más apropiado o el fallback
	 */
	findExtractor(url: string, doc: Document): BaseExtractor {
		// Buscar un extractor específico
		for (const extractor of this.extractors) {
			try {
				if (extractor.canHandle(url, doc)) {
					console.log(`[Alchemize] Usando extractor: ${extractor.name}`);
					return extractor;
				}
			} catch (error) {
				console.warn(`[Alchemize] Error en extractor ${extractor.name}:`, error);
			}
		}

		// Usar fallback si está configurado
		if (this.fallbackExtractor) {
			console.log(`[Alchemize] Usando extractor fallback: ${this.fallbackExtractor.name}`);
			return this.fallbackExtractor;
		}

		throw new Error('No se encontró ningún extractor compatible y no hay fallback configurado');
	}

	/**
	 * Obtiene todos los extractores registrados
	 * @returns Array de extractores
	 */
	getAllExtractors(): BaseExtractor[] {
		return [...this.extractors];
	}

	/**
	 * Obtiene el número de extractores registrados
	 */
	get count(): number {
		return this.extractors.length;
	}

	/**
	 * Limpia todos los extractores registrados
	 */
	clear(): void {
		this.extractors = [];
		this.fallbackExtractor = null;
	}
}

// Instancia singleton del registro
export const extractorRegistry = new ExtractorRegistry();
