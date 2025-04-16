import { promises as fsPromises } from 'fs';
import { marked } from 'marked';
import Prism from 'prismjs';
import katex from 'katex';
import markedFootnote from 'marked-footnote';
import mermaid from 'mermaid';

// Import Prism core components
import 'prismjs/components/prism-core.js';
import 'prismjs/components/prism-markup.js';
import 'prismjs/components/prism-clike.js';
import 'prismjs/components/prism-javascript.js';

// Initialize Prism in browser environment
if (typeof window !== 'undefined') {
    window.Prism = Prism;
}

/**
 * Parse markdown into an AST
 * @param {string} markdown - Markdown text to parse
 * @returns {Object} - The AST structure
 */
function parseMarkdown(markdown) {
  marked.setOptions({
    renderer: new marked.Renderer(),
    headerIds: true,
    gfm: true,
    langPrefix: 'language-',
  });
  
  const tokens = marked.lexer(markdown);
  enhanceCodeBlocks(tokens);
  
  const ast = {
    type: 'document',
    version: '1.0',
    children: tokens,
    renderSteps: detectRenderSteps(tokens),
    codeLanguages: detectCodeLanguages(tokens),
    mermaidDiagrams: detectMermaidDiagrams(tokens),
    mathExpressions: detectMathExpressions(tokens)
  };
  
  return ast;
}

/**
 * Render an AST to HTML
 * @param {Object} ast - The AST structure
 * @returns {string} - HTML output
 */
function renderToHtml(ast) {
  if (!ast || !ast.children) {
    throw new Error('Invalid AST structure');
  }
  
  const renderer = new marked.Renderer();
  
  // Handle code blocks with syntax highlighting
  renderer.code = function(code, language) {
    if (language === 'mermaid') {
      return `<div class="mermaid">${code}</div>`;
    }
    
    if (language === 'math' || language === 'katex' || language === 'tex') {
      try {
        const rendered = katex.renderToString(code, {
          displayMode: true,
          throwOnError: false
        });
        return rendered;
      } catch (error) {
        console.error('Error rendering math code block:', error);
        return `<pre><code class="language-${language}">${code}</code></pre>`;
      }
    }
    
    const langClass = language ? ` class="language-${language}"` : '';
    
    if (language && Prism.languages[language]) {
      const highlighted = Prism.highlight(code, Prism.languages[language], language);
      return `<pre><code${langClass}>${highlighted}</code></pre>`;
    }
    
    return `<pre><code${langClass}>${code}</code></pre>`;
  };
  
  // Set up marked with our renderer
  marked.setOptions({
    renderer: renderer,
    headerIds: true,
    gfm: true
  });
  
  // Add footnote extension
  marked.use(markedFootnote());
  
  // Render the AST to HTML
  let html = marked.parser(ast.children);
  
  // Process math expressions
  if (ast.mathExpressions && ast.mathExpressions.length > 0) {
    html = processMathExpressions(html, ast.mathExpressions);
  }
  
  return html;
}

/**
 * Process math expressions in the HTML
 */
function processMathExpressions(html, expressions) {
  let processedHtml = html;
  
  // Process block math expressions
  for (const expr of expressions.filter(e => e.type === 'block')) {
    try {
      // Render the expression with KaTeX
      const rendered = katex.renderToString(expr.content, {
        displayMode: true,
        throwOnError: false
      });
      
      // Create matching patterns for the original expression
      // Handle both with and without newlines around the expression
      const patternWithNewlines = new RegExp('\\$\\$\\s*' + escapeRegExp(expr.content) + '\\s*\\$\\$', 'g');
      const patternInline = new RegExp('\\$\\$' + escapeRegExp(expr.content) + '\\$\\$', 'g');
      
      // First try with newlines (as it appears in the paragraph tags)
      processedHtml = processedHtml.replace(patternWithNewlines, rendered);
      // Then try without newlines (as it might appear in other contexts)
      processedHtml = processedHtml.replace(patternInline, rendered);
      
      // Handle the exact form it appears in the test HTML
      if (expr.content.includes('\n')) {
        const cleanContent = expr.content.trim().replace(/\n/g, ' ');
        const blockPattern = new RegExp('\\$\\$\\s*' + escapeRegExp(cleanContent) + '\\s*\\$\\$', 'g');
        processedHtml = processedHtml.replace(blockPattern, rendered);
      }
    } catch (error) {
      console.error('Error rendering block math:', error);
    }
  }
  
  // Process inline math expressions
  for (const expr of expressions.filter(e => e.type === 'inline')) {
    try {
      // Render the expression with KaTeX
      const rendered = katex.renderToString(expr.content, {
        displayMode: false,
        throwOnError: false
      });
      
      // Create matching pattern for the original expression
      const pattern = new RegExp('\\$' + escapeRegExp(expr.content) + '\\$', 'g');
      processedHtml = processedHtml.replace(pattern, rendered);
    } catch (error) {
      console.error('Error rendering inline math:', error);
    }
  }
  
  return processedHtml;
}

/**
 * Enhance code blocks in the tokens with additional info
 */
function enhanceCodeBlocks(tokens) {
  function processToken(token) {
    if (token.type === 'code') {
      token.language = token.lang || 'plaintext';
      token.languageDisplay = token.lang || 'Plain Text';
      token.isMermaid = token.language === 'mermaid';
    }
    
    if (token.tokens) {
      enhanceCodeBlocks(token.tokens);
    }
    
    if (token.items) {
      enhanceCodeBlocks(token.items);
    }
  }
  
  tokens.forEach(processToken);
}

/**
 * Detect render steps needed for the AST
 */
function detectRenderSteps(tokens) {
  return ['headings', 'lists', 'codeBlocks', 'paragraphs', 'math', 'links', 'images'];
}

/**
 * Extract code languages from the AST
 */
function detectCodeLanguages(tokens) {
  const languages = new Set();
  
  function processToken(token) {
    if (token.type === 'code' && token.lang && token.lang !== 'mermaid') {
      languages.add(token.lang.toLowerCase());
    }
    
    if (token.tokens) {
      token.tokens.forEach(processToken);
    }
    
    if (token.items) {
      token.items.forEach(processToken);
    }
  }
  
  tokens.forEach(processToken);
  return Array.from(languages);
}

/**
 * Detect Mermaid diagrams in the AST
 */
function detectMermaidDiagrams(tokens) {
  const diagrams = [];
  
  function processToken(token, path = []) {
    if (token.type === 'code' && token.lang === 'mermaid') {
      diagrams.push({
        type: 'mermaid',
        content: token.text,
        path: [...path]
      });
    }
    
    if (token.tokens) {
      token.tokens.forEach((t, i) => processToken(t, [...path, 'tokens', i]));
    }
    
    if (token.items) {
      token.items.forEach((t, i) => processToken(t, [...path, 'items', i]));
    }
  }
  
  tokens.forEach((t, i) => processToken(t, [i]));
  return diagrams;
}

/**
 * Detect math expressions in the AST
 */
function detectMathExpressions(tokens) {
  const expressions = [];
  
  // Function to extract math expressions from text
  function extractMathFromText(text) {
    // Match block math expressions: $$...$$
    const blockRegex = /\$\$([\s\S]*?)\$\$/g;
    let blockMatch;
    while ((blockMatch = blockRegex.exec(text)) !== null) {
      const content = blockMatch[1].trim();
      expressions.push({
        type: 'block',
        content: content
      });
    }
    
    // Match inline math expressions: $...$
    const inlineRegex = /\$([^\$\n]+)\$/g;
    let inlineMatch;
    while ((inlineMatch = inlineRegex.exec(text)) !== null) {
      // Skip if this is part of a block expression
      if (text.substring(inlineMatch.index - 1, inlineMatch.index + 1) === '$$' || 
          text.substring(inlineMatch.index + inlineMatch[0].length - 1, inlineMatch.index + inlineMatch[0].length + 1) === '$$') {
        continue;
      }
      
      const content = inlineMatch[1].trim();
      expressions.push({
        type: 'inline',
        content: content
      });
    }
  }
  
  function processToken(token) {
    // Extract math from paragraph and text tokens
    if ((token.type === 'paragraph' || token.type === 'text') && token.text) {
      extractMathFromText(token.text);
    }
    
    // Extract math from code blocks with math language
    if (token.type === 'code' && 
        (token.lang === 'math' || token.lang === 'katex' || token.lang === 'tex')) {
      expressions.push({
        type: 'block',
        content: token.text,
        fromCodeBlock: true
      });
    }
    
    // Process nested tokens
    if (token.tokens) {
      token.tokens.forEach(processToken);
    }
    
    if (token.items) {
      token.items.forEach(processToken);
    }
  }
  
  tokens.forEach(processToken);
  return expressions;
}

/**
 * Helper function to escape special characters for RegExp
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * MarkdownRenderer - A comprehensive Markdown rendering utility
 * Supports extended Markdown syntax including math, diagrams, task lists, and more
 * Now uses an AST-based approach for improved modularity and extensibility
 */
class MarkdownRenderer {
    /**
     * Create a new MarkdownRenderer instance
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.options = {
            highlight: true,
            ...options
        };
        
        this._initializeComponents();
    }
    
    /**
     * Initialize external components like Mermaid
     * @private
     */
    _initializeComponents() {
        // Initialize mermaid if available
        if (typeof window !== 'undefined' && typeof mermaid !== 'undefined') {
            mermaid.initialize({
                startOnLoad: true,
                theme: 'default',
                flowchart: { htmlLabels: true }
            });
        }
        
        // Load essential languages for code highlighting
        this.loadEssentialLanguages();
    }
    
    /**
     * Load essential languages for syntax highlighting
     */
    loadEssentialLanguages() {
        // Basic languages already imported in the top of the file
        
        // Additional languages can be loaded dynamically if needed
        if (this.options.loadLanguages) {
            try {
                // This is where we would dynamically load additional Prism languages if needed
                // Example implementation would depend on the environment (Node.js vs Browser)
                if (this.options.dynamicFileTypes) {
                    // Load specified languages based on file types
                    this._loadPrismLanguagesForFileTypes(this.options.dynamicFileTypes);
                }
            } catch (error) {
                console.warn('Error loading languages:', error);
            }
        }
    }
    
    /**
     * Load Prism languages for specific file types
     * @private
     * @param {Object} fileTypes - File types to language mappings
     */
    _loadPrismLanguagesForFileTypes(fileTypes) {
        if (!fileTypes || typeof fileTypes !== 'object') return;
        
        Object.values(fileTypes).forEach(fileType => {
            if (fileType.language && typeof fileType.language === 'string') {
                try {
                    // In a real implementation, this would dynamically import the Prism language
                    // This is simplified for demonstration purposes
                    const language = fileType.language.toLowerCase();
                    this._tryLoadPrismLanguage(language);
                } catch (error) {
                    console.warn(`Error loading language "${fileType.language}":`, error);
                }
            }
        });
    }
    
    /**
     * Try to load a Prism language
     * @private
     * @param {string} language - The language to load
     */
    _tryLoadPrismLanguage(language) {
        // This would be a proper implementation for dynamically loading Prism languages
        // For now, we'll just check if it's already available
        if (!Prism.languages[language]) {
            console.warn(`Language "${language}" is not available in Prism.`);
        }
    }
    
    /**
     * Pre-process Markdown content before rendering
     * @private
     * @param {string} markdown - The markdown content to process
     * @returns {string} The processed markdown
     */
    _preProcessMarkdown(markdown) {
        // Add any custom pre-processing here
        return markdown;
    }
    
    /**
     * Read markdown from a file
     * @param {string} filePath - Path to the markdown file
     * @returns {Promise<string>} The rendered HTML content
     */
    async readMarkdownFromFile(filePath) {
        try {
            const markdown = await fsPromises.readFile(filePath, 'utf8');
            return this.render(markdown);
        } catch (error) {
            console.error('Error reading markdown file:', error);
            throw error;
        }
    }
    
    /**
     * Render markdown to HTML using the AST approach
     * @param {string} markdown - The markdown content to render
     * @returns {string} The rendered HTML
     */
    render(markdown) {
        if (!markdown) return '';
        
        try {
            // Pre-process the markdown
            const processedMarkdown = this._preProcessMarkdown(markdown);
            
            // Parse the markdown into an AST
            const ast = parseMarkdown(processedMarkdown);
            
            // Get information about the AST
            const astInfo = this._getAstInfo(ast);
            
            // Render the AST to HTML
            const html = renderToHtml(ast);
            
            return html;
        } catch (error) {
            console.error('Error rendering markdown:', error);
            return `<div class="error">Error rendering markdown: ${error.message}</div>`;
        }
    }
    
    /**
     * Get information about the AST
     * @private
     * @param {Object} ast - The AST to analyze
     * @returns {Object} Information about the AST
     */
    _getAstInfo(ast) {
        return {
            codeLanguages: ast.codeLanguages || [],
            hasMermaid: (ast.mermaidDiagrams || []).length > 0,
            hasMath: (ast.mathExpressions || []).length > 0,
            tokenCount: ast.children ? ast.children.length : 0
        };
    }
}

// Export the class as default export
export default MarkdownRenderer; 