# MarkdownToRender

A lightweight Markdown renderer with enhanced features.

## Features

- GitHub Flavored Markdown
- Syntax highlighting (PrismJS)
- Math expressions (KaTeX)
- Diagrams (Mermaid)
- Custom elements (footnotes, task lists, etc.)
- YouTube thumbnails
- Emoji support

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

## Extensions

| Feature | Syntax |
|---------|--------|
| Task lists | `- [x] Done` / `- [ ] Todo` |
| Footnotes | `Text[^1]` and `[^1]: Footnote content` |
| Subscript | `H~2~O` |
| Superscript | `E=mc^2^` |
| Highlight | `==important text==` |
| Math | `$E=mc^2$` or `$$\frac{n!}{k!(n-k)!}$$` |
| YouTube | `@[youtube-thumbnail](https://youtube.com/watch?v=ID)` |

## Development

### Running Tests

```bash
npm test
```

This runs the test suite and generates a visual HTML report at `tests/@test-results.html` that shows all supported Markdown features and their rendering.

## License

MIT