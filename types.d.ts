// Declaraciones de tipos para módulos sin @types

declare module '@mozilla/readability' {
    export class Readability {
        constructor(doc: Document, options?: any);
        parse(): {
            title: string;
            content: string;
            textContent: string;
            length: number;
            excerpt: string;
            byline: string;
            dir: string;
            siteName: string;
            lang: string;
        } | null;
    }
}

declare module 'turndown' {
    interface TurndownOptions {
        headingStyle?: 'setext' | 'atx';
        hr?: string;
        bulletListMarker?: '*' | '-' | '+';
        codeBlockStyle?: 'indented' | 'fenced';
        fence?: '```' | '~~~';
        emDelimiter?: '_' | '*';
        strongDelimiter?: '__' | '**';
        linkStyle?: 'inlined' | 'referenced';
        linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut';
        keepReplacement?: (content: string, node: Node) => string;
        blankReplacement?: (content: string, node: Node) => string;
        defaultReplacement?: (content: string, node: Node) => string;
    }

    interface TurndownRule {
        filter: string | string[] | ((node: Node) => boolean);
        replacement: (content: string, node: Node, options: TurndownOptions) => string;
    }

    class TurndownService {
        constructor(options?: TurndownOptions);
        turndown(html: string | Node): string;
        addRule(key: string, rule: TurndownRule): this;
        keep(filter: string | string[] | ((node: Node) => boolean)): this;
        remove(filter: string | string[] | ((node: Node) => boolean)): this;
        use(plugins: any | any[]): this;
        escape(str: string): string;
    }

    export = TurndownService;
}
