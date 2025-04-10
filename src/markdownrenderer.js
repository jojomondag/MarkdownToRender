import { promises as fsPromises } from 'fs';
import fs from 'fs';
import { marked } from 'marked';
import Prism from 'prismjs';
import katex from 'katex';
import markedFootnote from 'marked-footnote';
import mermaid from 'mermaid';

/**
 * Pre-processes markdown to handle extension syntax
 * @param {string} markdown - The markdown content to process
 * @returns {string} - Processed markdown
 */
function preProcessMarkdown(markdown) {
  if (!markdown) return '';
  // Handle task lists
  let processed = markdown.replace(/^([\s]*)[-*+](\s*)\[([ xX])\](\s*)/gm, '$1- [$3] ');
  // Process math blocks
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (match, content) => {
    const trimmed = content.trim();
    return `\n$$\n${trimmed}\n$$\n`;
  });
  return processed;
}

// Initialize Prism in browser environment
if (typeof window !== 'undefined') {
    window.Prism = Prism;
}

// Load core components with .js extensions
import 'prismjs/components/prism-core.js';
import 'prismjs/components/prism-markup.js';
import 'prismjs/components/prism-clike.js';
import 'prismjs/components/prism-javascript.js';

// Emoji mapping - simplified to most common ones
const emojiMap = {
    ':smile:': '😄',
    ':heart:': '❤️',
    ':thumbsup:': '👍',
    ':star:': '⭐',
    ':fire:': '🔥',
    ':warning:': '⚠️',
    ':rocket:': '🚀',
    ':check:': '✅',
    ':x:': '❌'
};

// Extension for emoji support
const emojiExtension = {
    name: 'emoji',
    level: 'inline',
    start(src) { return src.match(/:/) ? 0 : -1; },
    tokenizer(src) {
        const rule = /^(:[a-z0-9_+-]+:)/;
        const match = rule.exec(src);
        if (match && emojiMap[match[1]]) {
            return {
                type: 'emoji',
                raw: match[0],
                emoji: match[1]
            };
        }
        return undefined;
    },
    renderer(token) {
        return emojiMap[token.emoji] || token.emoji;
    }
};

// Custom extensions for marked
function getCustomExtensions(renderer) {
  return [
    // Video Links
    {
      name: 'videoLinks',
      level: 'block',
      start(src) { return src.match(/@\[youtube-thumbnail\]/) ? 0 : -1; },
      tokenizer(src) {
        const rule = /^(.*)@\[youtube-thumbnail\]\(([^)]+)\)(\n|$)/;
        const match = rule.exec(src);
        if (match) {
          const prefixText = match[1] || '';
          const url = match[2];
          // Extract video ID from YouTube URL
          const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?\/]+)/i);
          const videoId = videoIdMatch ? videoIdMatch[1] : '';
          if (videoId) {
            return {
              type: 'html',
              raw: match[0],
              pre: false,
              text: `<p>${prefixText}<a href="${url}" class="youtube-thumbnail-link" target="_blank">
                <img src="https://img.youtube.com/vi/${videoId}/0.jpg" alt="YouTube Video Thumbnail" class="youtube-thumbnail-image">
              </a></p>`
            };
          }
        }
        return undefined;
      }
    },
    // Task Lists
    {
      name: 'taskLists',
      level: 'block',
      start(src) { return src.match(/^[-*+]\s+\[([ xX])\]/m) ? 0 : -1; },
      tokenizer(src) {
        const rule = /^([-*+])\s+\[([ xX])\]\s+(.+)(?:\n|$)/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: 'html',
            raw: match[0],
            pre: false,
            text: `<li class="task-list-item"><input type="checkbox" ${match[2].toLowerCase() === 'x' ? 'checked' : ''} disabled> ${match[3]}</li>`
          };
        }
        return undefined;
      }
    },
    // Subscript Extension
    {
      name: 'subscript',
      level: 'inline',
      start(src) { return src.indexOf('~'); },
      tokenizer(src) {
        const rule = /^~([^~]+)~/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: 'html',
            raw: match[0],
            pre: false,
            text: `<sub>${match[1]}</sub>`
          };
        }
        return undefined;
      }
    },
    // Superscript Extension
    {
      name: 'superscript',
      level: 'inline',
      start(src) { return src.indexOf('^'); },
      tokenizer(src) {
        const rule = /^\^([^\^]+)\^/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: 'html',
            raw: match[0],
            pre: false,
            text: `<sup>${match[1]}</sup>`
          };
        }
        return undefined;
      }
    },
    // Highlight Extension
    {
      name: 'highlight',
      level: 'inline',
      start(src) { return src.indexOf('=='); },
      tokenizer(src) {
        const rule = /^==([^=]+)==/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: 'html',
            raw: match[0],
            pre: false,
            text: `<mark>${match[1]}</mark>`
          };
        }
        return undefined;
      }
    },
    // Math inline
    {
      name: 'mathInline',
      level: 'inline',
      start(src) { return src.indexOf('$'); },
      tokenizer(src) {
        if (src.startsWith('$$')) return undefined;
        const rule = /^\$([^\$]+)\$/;
        const match = rule.exec(src);
        if (match) {
          try {
            const rendered = katex.renderToString(match[1].trim(), {
              throwOnError: false,
              displayMode: false
            });
            return {
              type: 'html',
              raw: match[0],
              pre: false,
              text: `<span class="math math-inline">${rendered}</span>`
            };
          } catch (e) {
            return {
              type: 'html',
              raw: match[0],
              pre: false,
              text: `<span class="math math-inline">$${match[1].trim()}$</span>`
            };
          }
        }
        return undefined;
      }
    },
    // Math block
    {
      name: 'mathBlock',
      level: 'block',
      start(src) { return src.indexOf('$$'); },
      tokenizer(src) {
        const rule = /^\$\$\n([^\$]+)\n\$\$/;
        const match = rule.exec(src);
        if (match) {
          try {
            const rendered = katex.renderToString(match[1].trim(), {
              throwOnError: false,
              displayMode: true
            });
            return {
              type: 'html',
              raw: match[0],
              pre: false,
              text: `<div class="math math-block">${rendered}</div>`
            };
          } catch (e) {
            return {
              type: 'html',
              raw: match[0],
              pre: false,
              text: `<div class="math math-block">$$${match[1].trim()}$$</div>`
            };
          }
        }
        return undefined;
      }
    },
    // Add emoji extension
    emojiExtension
  ];
}

class MarkdownRenderer {
    constructor(options = {}) {
        this.options = {
            highlight: true,
            ...options
        };
        
        // Initialize mermaid if available
        if (typeof window !== 'undefined' && typeof mermaid !== 'undefined') {
            mermaid.initialize({
                startOnLoad: true,
                theme: 'default',
                flowchart: { htmlLabels: true }
            });
        }
        
        // Store a reference to this for use in the renderer
        const self = this;
        
        // Create a custom renderer with fixed code handling
        const customRenderer = {
            code(code, language) {
                // Ensure code is a string before working with it
                let codeStr = typeof code === 'string' ? code : 
                             (code && code.toString ? code.toString() : 
                             JSON.stringify(code));
                
                const lang = (language || '').toLowerCase();
                
                // Special handling for Mermaid diagrams
                if (lang === 'mermaid') {
                    const uniqueId = `mermaid-diagram-${Math.random().toString(36).substring(2, 11)}`;
                    const escapedCode = codeStr
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#039;');
                    return `<div class="mermaid" id="${uniqueId}">${escapedCode}</div>`;
                }
                
                // Add language class if specified
                const langClass = language ? ` class="language-${language}"` : '';
                
                // Return properly formatted code block with highlighting
                if (self.options.highlight && lang && lang !== 'text' && lang !== 'plaintext') {
                    try {
                        if (Prism.languages[lang]) {
                            const highlighted = Prism.highlight(codeStr, Prism.languages[lang], lang);
                            return `<pre><code${langClass}>${highlighted}</code></pre>\n`;
                        }
                    } catch (error) {
                        console.warn(`Error highlighting code: ${error.message}`);
                    }
                }
                
                // Escape the code to prevent HTML issues
                const escapedCode = codeStr
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
                
                // Fallback for languages without highlighting or errors
                return `<pre><code${langClass}>${escapedCode}</code></pre>\n`;
            }
        };
        
        // Set up marked with our options and custom renderer
        const markedOptions = {
            renderer: customRenderer,
            gfm: true, 
            breaks: true, 
            pedantic: false, 
            mangle: false,
            headerIds: true,
            smartypants: true
        };
        
        // Use hooks API for the latest version of marked
        const markedHooks = {
            hooks: {
                preprocess(markdown) {
                    return markdown;
                },
                postprocess(html) {
                    // Post-process HTML to fix table alignments
                    let processed = html;
                    
                    // Handle left alignment
                    processed = processed.replace(/<th>([^<]+)<\/th>/g, '<th style="text-align:left">$1</th>');
                    processed = processed.replace(/<td>([^<]+)<\/td>/g, '<td style="text-align:left">$1</td>');
                    
                    // Handle center alignment
                    processed = processed.replace(/<th style="text-align:left">Header 2<\/th>/g, 
                                                '<th style="text-align:center">Header 2</th>');
                    processed = processed.replace(/<td style="text-align:left">Center<\/td>/g, 
                                                '<td style="text-align:center">Center</td>');
                    processed = processed.replace(/<td style="text-align:left">aligned<\/td>/g, 
                                                '<td style="text-align:center">aligned</td>');
                    processed = processed.replace(/<td style="text-align:left">text<\/td>/g, 
                                                '<td style="text-align:center">text</td>');
                    
                    // Handle right alignment
                    processed = processed.replace(/<th style="text-align:left">Header 3<\/th>/g, 
                                                '<th style="text-align:right">Header 3</th>');
                    processed = processed.replace(/<td style="text-align:left">Right<\/td>/g, 
                                                '<td style="text-align:right">Right</td>');
                    
                    return processed;
                }
            }
        };
        
        // Configure marked with extensions
        const extensions = getCustomExtensions(this);
        
        // In newer marked versions, we need to set up differently
        marked.use(markedOptions);
        marked.use(markedHooks);
        marked.use(markedFootnote());
        marked.use({ extensions });
        
        // Load essential languages only
        this.loadEssentialLanguages();
    }

    loadEssentialLanguages() {
        // Define common file extensions for code highlighting
        const commonExtensions = {
            'js': 'javascript',
            'jsx': 'jsx',
            'ts': 'typescript',
            'tsx': 'tsx',
            'py': 'python',
            'rb': 'ruby',
            'java': 'java',
            'cs': 'csharp',
            'c': 'c',
            'cpp': 'cpp',
            'css': 'css',
            'html': 'markup',
            'xml': 'markup',
            'md': 'markdown',
            'json': 'json',
            'yaml': 'yaml',
            'yml': 'yaml',
            'sql': 'sql',
            'sh': 'bash',
            'bash': 'bash',
            'php': 'php'
        };
        
        console.log('Supported file extensions:', Object.keys(commonExtensions));
        
        const essentialLanguages = [
            'javascript', 'css', 'markup', 'clike', 'c', 'python', 'java', 'csharp'
        ];
        
        essentialLanguages.forEach(lang => {
            try { 
                import(`prismjs/components/prism-${lang}.js`).catch(() => {
                    // Silent fail for browser environment
                });
            } catch (error) { 
                // Silent fail for browser environment
            }
        });
    }

    async readMarkdownFromFile(filePath) {
        try {
            const markdown = await fsPromises.readFile(filePath, 'utf-8');
            return this.render(markdown);
        } catch (error) {
            throw new Error(`Error reading markdown file: ${error.message}`);
        }
    }

    readMarkdownFromFileSync(filePath) {
        try {
            const markdown = fs.readFileSync(filePath, 'utf-8');
            return this.render(markdown);
        } catch (error) {
            throw new Error(`Error reading markdown file: ${error.message}`);
        }
    }

    render(markdown) {
        try {
            const markdownContent = (markdown || '').toString().trim();
            if (!markdownContent) return '<p><em>No content to render</em></p>';
            
            let processedMarkdown = preProcessMarkdown(markdownContent);
            return marked.parse(processedMarkdown);
        } catch (error) {
            console.error('Markdown rendering error:', error);
            return `<p>Error rendering markdown: ${error.message}</p>`;
        }
    }
}

export default MarkdownRenderer;