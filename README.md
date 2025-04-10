# MarkdownToRender

A Markdown renderer that unifies features from popular npm packages into one seamless solution.

## 👉 [View Live Demo of All Features](https://jojomondag.github.io/MarkdownToRender/) 👈

**GitHub Repository:** [https://github.com/jojomondag/MarkdownToRender](https://github.com/jojomondag/MarkdownToRender)

## Features

- GitHub Flavored Markdown
- [Syntax highlighting (PrismJS)](https://www.npmjs.com/package/prismjs)
- [Math expressions (KaTeX)](https://www.npmjs.com/package/katex)
- [Diagrams (Mermaid)](https://www.npmjs.com/package/mermaid)
- Custom elements
- YouTube thumbnails

[View Live Demo of All Features](https://jojomondag.github.io/MarkdownToRender/)

<div align="center">
  <h3>🔍 <a href="https://jojomondag.github.io/MarkdownToRender/">See All These Features in Action!</a> 🔍</h3>
  <p><i>Check out our interactive demo showing all supported markdown elements</i></p>
</div>

## Installation

```bash
npm install markdowntorender
```

## Basic Usage

```javascript
// ES Module import
import MarkdownRenderer from 'markdowntorender';
const renderer = new MarkdownRenderer();

// From string
const html = renderer.render('# Hello World\n\nThis is **bold** text.');

// From file
const htmlFromFile = await renderer.readMarkdownFromFile('path/to/file.md');
```

### Running Tests

```bash
npm test
```

This runs the test suite and generates a visual HTML report at `@markdowntorender-results.html` that shows all supported Markdown features and their rendering.

### Demo of Features

After running the tests, you can open `tests/@markdowntorender-results.html` in your browser to see a complete demonstration of all supported Markdown features with examples and their rendered output.

This visual reference is extremely helpful for users to understand the full capabilities of the package.

You can also [view all rendered features online](https://jojomondag.github.io/MarkdownToRender/) without installing the package.

## License

MIT