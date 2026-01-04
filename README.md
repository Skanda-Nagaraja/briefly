# briefly 🔍

**AI-powered CLI for generating project and file summaries**

briefly analyzes your codebase and generates human-readable documentation by combining static code analysis with AI summarization. Perfect for onboarding, documentation, and understanding unfamiliar codebases.

## ✨ Features

- **Project Summaries** — Get a high-level overview of any project's structure, tech stack, and dependencies
- **File Analysis** — Deep dive into individual files with AST parsing for functions, classes, and exports
- **AI Summarization** — Uses OpenAI to generate human-friendly descriptions of code functionality
- **Markdown Export** — Export complete project documentation to Markdown files
- **Edge Case Detection** — Identifies important considerations and potential edge cases in code

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Skanda-Nagaraja/briefly.git
cd briefly

# Install dependencies
npm install

# Link for local development
npm link
```

## 🚀 Quick Start

```bash
# Get help
briefly --help

# Summarize a project
briefly summary ./my-project

# Analyze a specific file
briefly module ./src/app.js

# Export documentation to Markdown
briefly export -p ./my-project -o DOCS.md
```

## 📋 Commands

### `briefly summary <path>`

Generate a high-level summary of a project or directory.

```bash
briefly summary ./my-project
briefly summary . --depth 5
briefly summary ./src --no-ai --output summary.txt
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-d, --depth <n>` | Max directory depth to scan | `3` |
| `-o, --output <file>` | Save summary to file | — |
| `--no-ai` | Skip AI summarization | `false` |

### `briefly module <file>`

Generate a detailed summary of a single file.

```bash
briefly module ./src/index.js
briefly module ./lib/utils.ts --show-ast
briefly module ./app.py -o analysis.txt
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <file>` | Save summary to file | — |
| `--show-ast` | Include AST structure | `false` |

### `briefly export`

Export comprehensive documentation to Markdown.

```bash
briefly export
briefly export -p ./my-project -o DOCUMENTATION.md
briefly export --include-code
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project path to document | `.` |
| `-o, --output <file>` | Output file | `SUMMARY.md` |
| `--include-code` | Include code snippets | `false` |

## 🤖 AI Configuration

briefly uses OpenAI's API for intelligent summarization. To enable AI features:

```bash
export OPENAI_API_KEY=your-api-key-here
```

Without an API key, briefly will still work but will skip AI-powered summaries. Use `--no-ai` to explicitly disable AI summarization.

## 🛠 Supported Languages

briefly can parse and analyze:

- **JavaScript** (.js, .mjs, .cjs)
- **TypeScript** (.ts, .tsx)
- **JSX** (.jsx)
- **Python** (.py)
- **JSON** (.json)

Additional languages are detected but receive basic analysis.

## 📊 What briefly Detects

### Project-Level
- 📁 Directory structure and depth
- 🛠 Tech stack (React, Vue, Express, etc.)
- 📦 Dependencies and dev dependencies
- 🚀 Entry points
- 📄 File type distribution

### File-Level
- 📥 Imports and dependencies
- 📤 Exports (named, default, re-exports)
- ⚡ Functions (async, arrow, generators)
- 🏛 Classes (with methods and inheritance)
- 📌 Variables and constants
- 💬 Comments (block and line)

## 🎯 Use Cases

### Onboarding New Team Members
```bash
briefly summary ./company-project -o onboarding.md
```

### Code Reviews
```bash
briefly module ./src/features/new-feature.ts
```

### Documentation Generation
```bash
briefly export -p . -o README-GENERATED.md
```

### Understanding Legacy Code
```bash
briefly summary ./legacy-app --depth 10
```

## 🧪 Development

```bash
# Run locally without linking
node bin/briefly.js summary .

# Run tests
npm test

# Lint code
npm run lint
```

## 📁 Project Structure

```
briefly/
├── bin/
│   └── briefly.js          # CLI entry point
├── src/
│   ├── index.js             # Main CLI setup
│   ├── commands/
│   │   ├── summary.js       # Project summary command
│   │   ├── module.js        # File analysis command
│   │   └── export.js        # Markdown export command
│   └── lib/
│       ├── scanner.js       # Directory scanning
│       ├── analyzer.js      # Project analysis
│       ├── parser.js        # AST parsing
│       ├── summarizer.js    # AI summarization
│       ├── formatter.js     # Console output formatting
│       ├── output.js        # File output utilities
│       └── markdown.js      # Markdown generation
├── package.json
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Commander.js](https://github.com/tj/commander.js/) - CLI framework
- [Acorn](https://github.com/acornjs/acorn) - JavaScript parser
- [Chalk](https://github.com/chalk/chalk) - Terminal styling
- [OpenAI](https://openai.com/) - AI summarization

---

Made with ❤️ by [Skanda Nagaraja](https://github.com/Skanda-Nagaraja)

