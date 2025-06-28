# 📁 Node Utils CLI

[![npm version](https://badge.fury.io/js/%40ssit-hub%2Futils-scripts.svg)](https://badge.fury.io/js/%40ssit-hub%2Futils-scripts)
[![downloads](https://img.shields.io/npm/dm/@ssit-hub/mvp-generate-template.svg)](https://npmjs.org/package/%40ssit-hub%2Futils-scripts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)

> A powerful CLI tool for directory analysis with tree visualization, file statistics, and line counting capabilities.

Perfect for developers who need to analyze project structures, generate documentation, or understand codebase metrics with beautiful tree-style output and comprehensive statistics.

## ✨ Features

- **🌳 Tree Visualization**: Display directory structure in a beautiful tree format
- **📊 Comprehensive Statistics**: File counts, sizes, and detailed metrics
- **💻 Line Counting**: Analyze code files with line-by-line statistics
- **🎯 Smart Filtering**: Exclude files and directories with patterns and rules
- **📄 Export Capabilities**: Save reports to files with timestamps
- **🔧 Configurable**: YAML-based configuration for customization
- **🚀 Fast Performance**: Built with TypeScript and esbuild for speed
- **🎨 Beautiful Output**: Emoji-enhanced output with clear formatting

## 📦 Installation

### Global Installation

```bash
npm install -g @ssit-hub/utils-scripts
```

### Local Installation

```bash
npm install @ssit-hub/utils-scripts
```

### Using npx (No Installation Required)

```bash
npx @ssit-hub/utils-scripts list-dir --help
```

## 🚀 Quick Start

```bash
# Analyze current directory
node-utils list-dir

# Analyze specific directory
node-utils list-dir --path /path/to/project

# Use configuration file
node-utils list-dir --config ./my-config.yml

# Enable debug mode
node-utils --debug list-dir --path ./src
```

### Command Options

| Option | Short | Description | Example |
|--------|--------|-------------|---------|
| `--path` | `-P` | Target directory to analyze | `--path ./src` |
| `--config` | `-C` | YAML configuration file | `--config ./.utils-config.yml` |
| `--debug` | | Enable detailed logging | `--debug` |

## ⚙️ Configuration

Create a YAML configuration file to customize the tool's behavior:

### Example Configuration (`.utils-config.yml`)

```yaml
# Target directory to scan (optional)
path: './src'

# Output directory for reports (optional)
# If specified, results will be saved to timestamped files
outDir: './reports'

# Enable line counting for code files
countLines: true

# Number of top file extensions to show in terminal table (default: 8, range: 1-20)
topExtensions: 10

# Direct file/folder names to exclude
exclude:
  - node_modules
  - .git
  - dist
  - build
  - .next
  - .nuxt
  - coverage

# Regex patterns for exclusion
exclude-patterns:
  - "\\.(log|tmp)$"
  - "^\\."
  - "test\\..*\\.js$"
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `path` | string | `"."` | Directory to analyze |
| `outDir` | string | `undefined` | Output directory for reports |
| `countLines` | boolean | `false` | Enable code line counting |
| `topExtensions` | number | `8` | Number of top extensions to show (1-20) |
| `exclude` | array | `["node_modules", ".git"]` | Files/folders to exclude |
| `exclude-patterns` | array | `[]` | Regex patterns for exclusion |

## 📊 Output Examples

### Console Output

```
🔍 Scanning directory and collecting statistics...

📊 DIRECTORY STATISTICS
==================================================

📁 Total Directories: 45
📄 Total Files: 127
💻 Code Files: 89
📋 Other Files: 38
💾 Total Size: 2.4 MB
📏 Average File Size: 19.2 KB

📊 LINE COUNT SUMMARY:
  📝 Total Lines: 15,847
  💻 Code Lines: 12,334
  💬 Comment Lines: 1,892
  ⬜ Blank Lines: 1,621
  📈 Code Ratio: 77.8% | Comments: 11.9%

📋 FILES BY EXTENSION:
  .ts                89 files (70.1%) - 1.8 MB | 12,234 lines
  .json              12 files (9.4%) - 245 KB
  .md                8 files (6.3%) - 156 KB
  .yml               3 files (2.4%) - 23 KB

🌳 DIRECTORY TREE:
==================================================

📦 my-project
├── 📂 src
│   ├── 📂 components
│   │   ├── 📄 Header.tsx
│   │   └── 📄 Footer.tsx
│   ├── 📂 utils
│   │   ├── 📄 helpers.ts
│   │   └── 📄 constants.ts
│   └── 📄 index.ts
├── 📄 package.json
├── 📄 tsconfig.json
└── 📄 README.md
```

### File Output

When `outDir` is specified, reports are saved with timestamps:

```
reports/
├── my-project-tree-2024-01-15T10-30-45-123Z.txt
├── my-project-tree-2024-01-15T11-45-12-456Z.txt
└── my-project-tree-2024-01-15T14-20-33-789Z.txt
```

## 🔧 Development

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn

### Setup

```bash
# Clone repository
git clone https://github.com/duyvu871/utils-scripts.git
cd utils-scripts

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build for production |
| `npm run build:prod` | Build with optimizations |
| `npm run dev` | Development mode with watch |
| `npm run test` | Run tests |
| `npm run lint` | Lint code |
| `npm run format` | Format code |
| `npm run typecheck` | Type checking |

## 🧩 Supported File Types

The line counter recognizes these programming languages and file types:

**Languages**: TypeScript, JavaScript, Python, Java, C#, C++, C, Go, Rust, PHP, Ruby, Swift, Kotlin, Scala, Dart, R, MATLAB, Shell, PowerShell

**Config/Data**: JSON, YAML, XML, HTML, CSS, SCSS, LESS, SQL, Dockerfile, Makefile

**Documentation**: Markdown, Text files

## 📈 Use Cases

- **Project Documentation**: Generate comprehensive project overviews
- **Code Reviews**: Quickly understand project structure and metrics
- **Migration Planning**: Analyze legacy codebases before refactoring
- **Team Onboarding**: Help new developers understand project layout
- **Build Optimization**: Identify large files and unused directories
- **Compliance Reporting**: Generate detailed project statistics

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and submission process.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/duyvu871/utils-scripts/issues)
- **Feature Requests**: [GitHub Issues](https://github.com/duyvu871/utils-scripts/issues)
- **Documentation**: [GitHub Wiki](https://github.com/duyvu871/utils-scripts/wiki)

## 🎯 Roadmap

- [ ] Interactive mode with file selection
- [ ] Git integration for tracking changes
- [ ] Custom output templates
- [ ] Integration with popular IDEs
- [ ] Performance benchmarking
- [ ] Multi-language documentation

---

**Made with ❤️ by duyvu871** 