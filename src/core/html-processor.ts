/**
 * Procesador HTML mejorado
 * Limpia y prepara HTML antes de la conversión a Markdown
 */

export class HTMLProcessor {
	/**
	 * Pre-procesa el HTML antes de pasarlo a Turndown
	 * Esto mejora drásticamente la calidad del Markdown resultante
	 */
	static preprocess(html: string): string {
		let processed = html;

		// 1. Limpiar atributos de estilo y data innecesarios
		processed = this.cleanAttributes(processed);

		// 2. Normalizar espacios en blanco
		processed = this.normalizeWhitespace(processed);

		// 3. Mejorar tablas (agregar thead/tbody si faltan)
		processed = this.normalizeTables(processed);

		// 4. Mejorar código (marcar bloques de código)
		processed = this.normalizeCodeBlocks(processed);

		// 5. Limpiar elementos vacíos
		processed = this.removeEmptyElements(processed);

		// 6. Normalizar headings (asegurar jerarquía)
		processed = this.normalizeHeadings(processed);

		return processed;
	}

	/**
	 * Limpia atributos innecesarios
	 */
	private static cleanAttributes(html: string): string {
		// Remover atributos de estilo inline (ya que queremos estructura semántica)
		html = html.replace(/\s*style="[^"]*"/gi, '');
		
		// Remover atributos de data-*
		html = html.replace(/\s*data-[a-z0-9-]+="[^"]*"/gi, '');
		
		// Remover clases vacías o de framework
		html = html.replace(/\s*class="\s*"/gi, '');
		
		// Mantener solo atributos útiles: src, href, alt, title, class (no vacío)
		return html;
	}

	/**
	 * Normaliza espacios en blanco
	 */
	private static normalizeWhitespace(html: string): string {
		// Convertir múltiples espacios en uno solo (excepto en pre/code)
		html = html.replace(/(<pre[^>]*>[\s\S]*?<\/pre>)|(<code[^>]*>[\s\S]*?<\/code>)|(\s+)/g, 
			(match, pre, code, spaces) => {
				if (pre) return pre;
				if (code) return code;
				return ' ';
			}
		);

		// Eliminar espacios al inicio/fin de líneas
		html = html.replace(/^\s+|\s+$/gm, '');

		// Normalizar saltos de línea
		html = html.replace(/\n{3,}/g, '\n\n');

		return html;
	}

	/**
	 * Normaliza tablas para mejor conversión
	 */
	private static normalizeTables(html: string): string {
		// Asegurar que las tablas tengan estructura clara
		// Convertir divs que parecen tablas (común en algunos sitios)
		
		// Reemplazar divs con clase "table" por tablas reales si contienen filas
		html = html.replace(/<div[^>]*class="[^"]*table[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, 
			(match, content) => {
				if (content.includes('<div') && content.includes('row')) {
					// Podría ser una tabla div-based, convertir
					return this.convertDivTableToTable(match);
				}
				return match;
			}
		);

		return html;
	}

	/**
	 * Convierte tablas basadas en divs a tablas HTML reales
	 */
	private static convertDivTableToTable(html: string): string {
		// Esto es un fallback para tablas mal formadas
		// En la práctica, Turndown maneja mejor las tablas reales
		return html;
	}

	/**
	 * Normaliza bloques de código
	 */
	private static normalizeCodeBlocks(html: string): string {
		// Asegurar que los pre > code tengan estructura clara
		// Algunos sitios tienen solo <pre> sin <code>
		
		html = html.replace(/<pre([^>]*)>(?!\s*<code)/gi, 
			'<pre$1><code>');
		html = html.replace(/<\/pre>(?!<\/code>)/gi, 
			'</code></pre>');

		// Detectar lenguaje de código desde clases comunes
		html = html.replace(/<code\s+class="[^"]*language-(\w+)[^"]*"/gi, 
			'<code class="language-$1" data-language="$1"');

		return html;
	}

	/**
	 * Elimina elementos vacíos
	 */
	private static removeEmptyElements(html: string): string {
		// Eliminar párrafos vacíos
		html = html.replace(/<p[^>]*>\s*<\/p>/gi, '');
		
		// Eliminar divs vacíos
		html = html.replace(/<div[^>]*>\s*<\/div>/gi, '');
		
		// Eliminar spans vacíos
		html = html.replace(/<span[^>]*>\s*<\/span>/gi, '');
		
		// Eliminar saltos de línea excesivos
		html = html.replace(/(<br\s*\/?>\s*){2,}/gi, '<br>');

		return html;
	}

	/**
	 * Normaliza headings para jerarquía correcta
	 */
	private static normalizeHeadings(html: string): string {
		// Asegurar que h1 solo aparezca una vez (el título)
		// Convertir h1 adicionales a h2
		let h1Count = 0;
		html = html.replace(/<h1([^>]*)>(.*?)<\/h1>/gi, (match, attrs, content) => {
			h1Count++;
			if (h1Count > 1) {
				return `<h2${attrs}>${content}</h2>`;
			}
			return match;
		});

		return html;
	}

	/**
	 * Post-procesa el Markdown resultante
	 * Limpia y mejora el formato final
	 */
	static postprocess(markdown: string): string {
		// 1. Limpiar líneas vacías excesivas
		markdown = markdown.replace(/\n{3,}/g, '\n\n');

		// 2. Eliminar espacios al final de líneas
		markdown = markdown.replace(/[ \t]+$/gm, '');

		// 3. Normalizar espacios alrededor de headings
		markdown = markdown.replace(/^(#{1,6})\s*/gm, '$1 ');

		// 4. Asegurar que las listas tengan espacio antes
		markdown = markdown.replace(/\n([^\n\-*\d])/g, '\n\n$1');

		// 5. Limpiar bloques de código (quitar líneas vacías al inicio/fin)
		markdown = markdown.replace(/```\w*\n\n+/g, match => match.replace(/\n+$/, '\n'));
		markdown = markdown.replace(/\n+```\n/g, '\n```\n');

		// 6. Normalizar tablas (asegurar espacios)
		markdown = this.formatTables(markdown);

		// 7. Limpiar links vacíos o rotos
		markdown = markdown.replace(/\[([^\]]*)\]\(\s*\)/g, '$1');

		// 8. Eliminar backticks sueltos que no son código
		markdown = markdown.replace(/(?<!`)`(?![`\s])([^`]*)(?<![`\s])`(?!`)/g, '$1');

		return markdown.trim();
	}

	/**
	 * Formatea tablas en Markdown para mejor legibilidad
	 */
	private static formatTables(markdown: string): string {
		// Encontrar todas las tablas
		const tableRegex = /(\|[^\n]+\|\n)(\|[-:\|\s]+\|\n)((?:\|[^\n]+\|\n?)+)/g;
		
		return markdown.replace(tableRegex, (match, header, separator, rows) => {
			// Procesar el header
			const headerCells = header.trim().split('|').filter((c: string) => c.trim());
			
			// Calcular el ancho máximo de cada columna
			const widths = headerCells.map((cell: string) => cell.trim().length);
			
			// Procesar filas para calcular anchos
			const rowLines = rows.trim().split('\n').filter((r: string) => r.trim());
			rowLines.forEach((row: string) => {
				const cells = row.split('|').filter((c: string) => c.trim());
				cells.forEach((cell: string, i: number) => {
					if (i < widths.length) {
						widths[i] = Math.max(widths[i], cell.trim().length);
					}
				});
			});

			// Formatear header
			const formattedHeader = '| ' + headerCells.map((cell: string, i: number) => 
				cell.trim().padEnd(widths[i])
			).join(' | ') + ' |\n';

			// Formatear separador
			const formattedSeparator = '| ' + widths.map((w: number) => 
				'-'.repeat(w)
			).join(' | ') + ' |\n';

			// Formatear filas
			const formattedRows = rowLines.map((row: string) => {
				const cells = row.split('|').filter((c: string) => c !== '');
				return '| ' + cells.map((cell: string, i: number) => 
					cell.trim().padEnd(widths[i] || 0)
				).join(' | ') + ' |';
			}).join('\n');

		return formattedHeader + formattedSeparator + formattedRows + '\n';
		});
	}

	/**
	 * Detecta y extrae tablas de HTML incluso si están mal formadas
	 */
	static extractTables(html: string): Array<{ headers: string[], rows: string[][] }> {
		const tables: Array<{ headers: string[], rows: string[][] }> = [];
		
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');
		
		doc.querySelectorAll('table').forEach(table => {
			const headers: string[] = [];
			const rows: string[][] = [];

			// Extraer headers
			table.querySelectorAll('thead th, tr:first-child th, tr:first-child td').forEach(th => {
				headers.push(th.textContent?.trim() || '');
			});

			// Extraer filas
			table.querySelectorAll('tbody tr, tr:not(:first-child)').forEach(tr => {
				const row: string[] = [];
				tr.querySelectorAll('td, th').forEach(td => {
					row.push(td.textContent?.trim() || '');
				});
				if (row.length > 0) rows.push(row);
			});

			if (headers.length > 0 || rows.length > 0) {
				tables.push({ headers, rows });
			}
		});

		return tables;
	}
}
