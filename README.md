# MarkdownToRender

A Markdown renderer that unifies features from popular npm packages into one seamless solution. It parses markdown content provided as a string or read from a file, identifies supported elements like code blocks, math equations, diagrams, and renders them into HTML.

<div style="text-align: center;">
  <h3>🔍 <a href="https://jojomondag.github.io/MarkdownToRender/">See Features in Action!</a> 🔍</h3>
  <p><i>Check out our interactive demo showing all supported markdown elements</i></p>
</div>

## Features
- GitHub Flavored Markdown
- [Syntax highlighting (PrismJS)](https://www.npmjs.com/package/prismjs)
- [Math expressions (KaTeX)](https://www.npmjs.com/package/katex)
- [Diagrams (Mermaid)](https://www.npmjs.com/package/mermaid)
- Custom elements
- YouTube thumbnails

## Installation

```bash
npm install markdowntorender
```

## Basic Usage

```javascript
import MarkdownRenderer from 'markdowntorender';

const renderer = new MarkdownRenderer();

// Render markdown from a string
const html = renderer.render('# Hello World\nThis is **bold**.');

// Render markdown from a file
const htmlFromFile = await renderer.readMarkdownFromFile('path/to/file.md');
```

### Running Tests

```bash
npm test
```

Runs the test suite and generates a visual HTML report at `tests/@markdowntorender-results.html` that shows all supported Markdown features and their rendering.