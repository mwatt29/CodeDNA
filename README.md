<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Three.js-3D-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Tree--sitter-Parser-blue?style=for-the-badge" alt="Tree-sitter" />
</p>

<h1 align="center">🧬 CodeDNA</h1>

<p align="center">
  <strong>Visualize Your Codebase's Architecture in 3D</strong>
</p>

<p align="center">
  CodeDNA analyzes your repository's structure, maps file dependencies, and renders an interactive 3D force-directed graph — giving you X-ray vision into your codebase's DNA.
</p>

---

## ✨ Features

### 🔬 Deep Code Analysis
- **Tree-sitter Parsing** — Accurate AST-based extraction of imports, exports, and dependencies
- **Multi-language Support** — JavaScript, TypeScript, Python, Java, Go, Rust, C/C++
- **Complexity Metrics** — Lines of code, cyclomatic complexity per file

### 🌐 Interactive 3D Visualization
- **Force-Directed Graph** — Physics-based layout with directory-aware clustering
- **File Type Icons** — Language icons (JS, TS, PY, etc.) displayed on important nodes
- **Smart Labels** — Permanent labels on high-PageRank files for easy navigation
- **Risk Glow Effects** — Red/orange/yellow halos highlight architectural issues
- **Shape Indicators** — Spheres for normal files, faceted shapes for complex/risky files
- **Color Legend Panel** — Toggleable guide explaining all visual elements
- **Style Modes** — Switch between Hybrid, Spheres, or Icons rendering
- **Click-to-Inspect** — Select any node to view file details, metrics, and AI summaries
- **Zoom, Pan, Rotate** — Full 3D navigation with mouse/touch controls

### 📊 Architecture Analytics
- **Cycle Detection** — Tarjan's algorithm finds circular dependencies
- **Centrality Analysis** — PageRank, betweenness, and degree centrality identify critical files
- **Risk Scoring** — Automatic flagging of "God modules", high-coupling files, and refactoring bottlenecks
- **Cluster Mapping** — Visualize code organization by language and directory

### 🤖 AI-Powered Insights
- **File Summarization** — One-click AI summaries explaining what each file does
- **Refactor Guidance** — Actionable suggestions based on detected architectural issues
- **Multi-provider Support** — Works with OpenAI GPT or Anthropic Claude

---

## 🖼️ How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  GitHub URL or  │────▶│  Backend Parser  │────▶│  3D Graph View  │
│  Local Upload   │     │  (Tree-sitter)   │     │  (Three.js)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Graph Analytics │
                        │  • Cycles        │
                        │  • Centrality    │
                        │  • Risk Scores   │
                        └──────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/CodeDNA.git
cd CodeDNA

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running Locally

**Terminal 1 — Backend:**
```bash
cd backend
npm start
# 🚀 CodeDNA Backend running on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# ➜ Local: http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` folder for AI features:

```env
# Optional: Enable AI summarization (choose one or both)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Change port
PORT=3001
```

> **Note:** AI features work without API keys — you'll get rule-based fallback suggestions instead of AI-generated ones.

---

## 🏗️ Project Structure

```
CodeDNA/
├── backend/
│   ├── server.js              # Express server entry point
│   ├── routes/
│   │   ├── upload.js          # GitHub clone & file upload
│   │   ├── analyze.js         # Code parsing & graph building
│   │   └── ai.js              # AI summarization endpoints
│   └── services/
│       ├── parserService.js   # Tree-sitter parsing logic
│       ├── graphBuilder.js    # Dependency graph construction
│       └── graphAnalytics.js  # Tarjan, PageRank, risk scoring
│
└── frontend/
    ├── public/
    │   └── icons/             # File type SVG icons (JS, TS, PY, etc.)
    └── src/
        ├── App.jsx            # Main application component
        ├── components/
        │   ├── UploadForm.jsx     # GitHub URL / repo input
        │   ├── GraphView3D.jsx    # Three.js 3D visualization
        │   ├── ColorLegendPanel.jsx # Toggleable visual guide
        │   ├── AnalyticsPanel.jsx # Cycles, risks, centrality UI
        │   └── FileInspector.jsx  # Node detail sidebar
        └── utils/
            └── graphUtils3D.js    # 3D rendering utilities
```

---

## 📖 API Reference

### `POST /api/clone`
Clone a GitHub repository for analysis.

```json
{
  "repoUrl": "https://github.com/facebook/react"
}
```

### `POST /api/analyze`
Analyze a cloned or uploaded repository.

```json
{
  "repoId": "uuid-from-clone"
}
```

**Response:**
```json
{
  "graph": { "nodes": [...], "edges": [...] },
  "stats": { "totalFiles": 42, "totalLines": 8500 },
  "analytics": {
    "cycles": [...],
    "centrality": { "topByPageRank": [...] },
    "risks": [...]
  }
}
```

### `POST /api/ai/summarize`
Get an AI-generated summary of a file.

```json
{
  "fileContent": "const express = require('express')...",
  "path": "server.js"
}
```

### `POST /api/ai/refactor`
Get refactoring suggestions based on analytics.

```json
{
  "cycles": [...],
  "risks": [...],
  "centrality": {...}
}
```

---

## 🎨 Visual Guide

### Language Colors

| Language   | Color | Icon |
|------------|-------|------|
| JavaScript | ![#f0db4f](https://via.placeholder.com/15/f0db4f/f0db4f.png) `#f0db4f` | JS |
| TypeScript | ![#007acc](https://via.placeholder.com/15/007acc/007acc.png) `#007acc` | TS |
| React JSX/TSX | ![#61dafb](https://via.placeholder.com/15/61dafb/61dafb.png) `#61dafb` | JSX/TSX |
| Python     | ![#306998](https://via.placeholder.com/15/306998/306998.png) `#306998` | PY |
| Java       | ![#f89820](https://via.placeholder.com/15/f89820/f89820.png) `#f89820` | JV |
| Go         | ![#00add8](https://via.placeholder.com/15/00add8/00add8.png) `#00add8` | GO |
| Rust       | ![#ce422b](https://via.placeholder.com/15/ce422b/ce422b.png) `#ce422b` | RS |
| C++        | ![#659ad2](https://via.placeholder.com/15/659ad2/659ad2.png) `#659ad2` | C++ |
| CSS        | ![#264de4](https://via.placeholder.com/15/264de4/264de4.png) `#264de4` | CSS |
| HTML       | ![#e34c26](https://via.placeholder.com/15/e34c26/e34c26.png) `#e34c26` | HTML |
| Vue        | ![#42b883](https://via.placeholder.com/15/42b883/42b883.png) `#42b883` | VUE |

### Risk Level Indicators

| Glow Color | Meaning | Description |
|------------|---------|-------------|
| 🔴 Red | Circular Dependency | File is part of a circular import chain |
| 🟠 Orange | High Risk | High complexity or too many dependencies |
| 🟡 Yellow | Medium Risk | Moderate complexity or coupling |
| 🟢 Green | Low Risk | Well-structured, manageable file |

### Node Shapes

| Shape | Meaning |
|-------|---------|
| ⚪ Sphere | Normal complexity file |
| 💠 Faceted (Icosahedron) | High complexity (>20) or high-risk file |

---

## 🧠 Analytics Deep Dive

### Cycle Detection
Uses **Tarjan's Strongly Connected Components** algorithm to find circular dependencies. Cycles are color-coded by severity:
- 🔴 **High** — 4+ files in cycle
- 🟠 **Medium** — 3 files in cycle  
- 🟡 **Low** — 2 files in cycle

### Centrality Measures
- **In-Degree** — How many files import this file (high = core dependency)
- **Out-Degree** — How many files this file imports (high = high coupling)
- **PageRank** — Importance score based on link analysis
- **Betweenness** — Files that act as bridges (refactoring bottlenecks)

### Risk Scoring
Flags architectural hotspots based on:
- High cyclomatic complexity (> 20)
- Too many dependents (in-degree > 5)
- Too many dependencies (out-degree > 8)
- Part of circular dependency
- "God module" pattern (large + highly connected)

---

## 🛠️ Tech Stack

| Layer    | Technology                                                                 |
|----------|----------------------------------------------------------------------------|
| Frontend | React 19, Vite, Three.js, react-force-graph-3d                             |
| Backend  | Node.js, Express 5                                                         |
| Parsing  | Web Tree-sitter (WASM-based AST parsing)                                   |
| AI       | OpenAI GPT-3.5 / Anthropic Claude 3 Haiku                                  |
| Git      | simple-git (for cloning repos)                                             |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 🙏 Acknowledgments

- [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) for blazing-fast parsing
- [react-force-graph-3d](https://github.com/vasturiano/react-force-graph-3d) for the 3D graph engine
- [Three.js](https://threejs.org/) for WebGL rendering

---

<p align="center">
  Made with 🧬 by <a href="https://github.com/mwatt29">Murray Watt</a>
</p>
