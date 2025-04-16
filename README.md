# MarkdownToRender

A modern, AST-based Markdown rendering library with extensive feature support.

## Features

- **AST-Based Architecture** - Two-phase parsing and rendering for better extensibility
- **Comprehensive Markdown Support** - All standard Markdown plus GitHub Flavored Markdown
- **Math Expression Rendering** - KaTeX integration for mathematical formulas
- **Diagram Support** - Integrated Mermaid.js diagram rendering
- **Code Syntax Highlighting** - PrismJS integration for beautiful code blocks
- **Extended Syntax** - Task lists, footnotes, subscript, superscript, highlighted text
- **YouTube Integration** - Special syntax for embedding YouTube videos

## Installation

```bash
npm install markdowntorender
```

## Usage

```javascript
import MarkdownRenderer from 'markdowntorender';

// Create a renderer instance
const renderer = new MarkdownRenderer();

// Render some markdown
const html = renderer.render(`
# Hello World

This is **bold** and *italic* text.

\`\`\`javascript
// Code with syntax highlighting
function greet(name) {
  return `Hello, ${name}!`;
}
\`\`\`

Math: $E = mc^2$

`);

// Display the rendered HTML
document.getElementById('content').innerHTML = html;
```

## Advanced Usage

### Loading From Files

```javascript
import MarkdownRenderer from 'markdowntorender';
import path from 'path';

const renderer = new MarkdownRenderer();

// Render markdown from a file
const filePath = path.join(__dirname, 'document.md');
renderer.readMarkdownFromFile(filePath)
  .then(html => {
    console.log(html);
  })
  .catch(err => {
    console.error('Error rendering:', err);
  });
```

### Configuration Options

```javascript
const renderer = new MarkdownRenderer({
  highlight: true,        // Enable syntax highlighting
  loadLanguages: true,    // Load additional Prism languages
  dynamicFileTypes: {}    // Custom file type mappings
});
```

## How It Works

MarkdownToRender uses a two-phase approach:

1. **Parsing Phase**: Converts Markdown to an Abstract Syntax Tree (AST)
2. **Rendering Phase**: Transforms the AST into HTML with all features applied

This approach provides several benefits:
- Better modularity and maintainability
- Easier to add new features and output formats
- More precise control over the rendering process

## Supported Markdown Features

- Headings (levels 1-6)
- Emphasis (bold, italic, strikethrough)
- Lists (ordered, unordered, task lists)
- Code blocks with syntax highlighting
- Inline code
- Blockquotes
- Links
- Images
- Tables
- Horizontal rules
- HTML embedding
- Footnotes
- Subscript and superscript
- Highlighted text
- Math expressions
- Mermaid diagrams

## Math Expressions with KaTeX

MarkdownToRender supports rendering mathematical expressions using [KaTeX](https://katex.org/). 

### Inline Math

For inline math expressions, use single dollar signs:

```markdown
The famous equation $E = mc^2$ was published by Einstein.
```

### Block Math

For block-level math expressions, use double dollar signs:

```markdown
$$
\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

### Math Code Blocks

You can also use code blocks with math, katex, or tex language specifiers:

````markdown
```math
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
```
````

## License

MIT