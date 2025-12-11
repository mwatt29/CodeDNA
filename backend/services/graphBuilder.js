const path = require('path');

// Color palette for different languages
const LANGUAGE_COLORS = {
    javascript: '#f7df1e',
    typescript: '#3178c6',
    python: '#3776ab',
    java: '#ed8b00',
    go: '#00add8',
    rust: '#dea584',
    cpp: '#00599c',
    c: '#555555',
    unknown: '#888888'
};

/**
 * Build a graph from parsed files
 * Returns nodes and edges for React Flow visualization
 */
function buildGraph(parsedFiles, repoRoot) {
    const nodes = [];
    const edges = [];
    const fileMap = new Map();

    // Track how many files import each file (importedBy count)
    const importedByCount = new Map();

    // Helper to resolve import paths
    const resolveImportPath = (modulePath, currentFilePath) => {
        // Try different resolutions
        const possiblePaths = [
            modulePath,
            modulePath + '.js',
            modulePath + '.jsx',
            modulePath + '.ts',
            modulePath + '.tsx',
            modulePath + '/index.js',
            modulePath + '/index.ts',
            modulePath + '/index.jsx',
            modulePath + '/index.tsx'
        ];

        for (const possible of possiblePaths) {
            const normalized = path.normalize(possible);
            if (fileMap.has(normalized)) {
                return fileMap.get(normalized).path;
            }
        }
        return null;
    };

    // Create a map of all files for quick lookup
    for (const file of parsedFiles) {
        fileMap.set(file.path, file);
        // Also map without extension for import resolution
        const withoutExt = file.path.replace(/\.(js|jsx|ts|tsx|py)$/, '');
        if (!fileMap.has(withoutExt)) {
            fileMap.set(withoutExt, file);
        }
    }

    // First pass: count importedBy for each file
    for (const file of parsedFiles) {
        for (const imp of file.imports) {
            if (imp.isRelative) {
                const targetPath = resolveImportPath(imp.module, file.path);
                if (targetPath) {
                    importedByCount.set(targetPath, (importedByCount.get(targetPath) || 0) + 1);
                }
            }
        }
    }

    // Create nodes
    for (let i = 0; i < parsedFiles.length; i++) {
        const file = parsedFiles[i];
        const fileName = path.basename(file.path);
        const dirName = path.dirname(file.path);
        const relativeDir = repoRoot ? path.relative(repoRoot, dirName) : dirName;

        nodes.push({
            id: file.path,
            type: 'custom',
            position: calculatePosition(i, parsedFiles.length),
            data: {
                label: fileName,
                path: file.path,
                language: file.language,
                loc: file.loc,
                complexity: file.complexity,
                color: LANGUAGE_COLORS[file.language] || LANGUAGE_COLORS.unknown,
                importCount: file.imports.filter(i => i.isRelative).length,
                importedByCount: importedByCount.get(file.path) || 0,
                cluster: file.language,
                directory: relativeDir
            }
        });
    }

    // Create edges from imports
    let edgeId = 0;
    for (const file of parsedFiles) {
        for (const imp of file.imports) {
            // Only create edges for relative imports (internal dependencies)
            if (imp.isRelative) {
                // Try to find the target file
                let targetPath = imp.module;

                // Try different resolutions
                const possiblePaths = [
                    targetPath,
                    targetPath + '.js',
                    targetPath + '.jsx',
                    targetPath + '.ts',
                    targetPath + '.tsx',
                    targetPath + '/index.js',
                    targetPath + '/index.ts',
                    targetPath + '/index.jsx',
                    targetPath + '/index.tsx'
                ];

                let targetFile = null;
                for (const possible of possiblePaths) {
                    const normalized = path.normalize(possible);
                    if (fileMap.has(normalized)) {
                        targetFile = fileMap.get(normalized);
                        break;
                    }
                }

                if (targetFile) {
                    edges.push({
                        id: `edge-${edgeId++}`,
                        source: file.path,
                        target: targetFile.path,
                        type: 'smoothstep',
                        animated: false,
                        style: { stroke: '#888', strokeWidth: 1.5 }
                    });
                }
            }
        }
    }

    // Remove duplicate edges
    const uniqueEdges = [];
    const edgeSet = new Set();
    for (const edge of edges) {
        const key = `${edge.source}->${edge.target}`;
        if (!edgeSet.has(key)) {
            edgeSet.add(key);
            uniqueEdges.push(edge);
        }
    }

    return { nodes, edges: uniqueEdges };
}

/**
 * Calculate node position in a circular/grid layout
 * Centered around origin (0, 0) for proper 3D graph centering
 */
function calculatePosition(index, total) {
    // Use a spiral layout for better distribution, centered at origin
    const radius = 50 + (index / total) * 150;
    const angle = (index / total) * 2 * Math.PI * 3; // 3 rotations

    return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
    };
}

module.exports = {
    buildGraph,
    LANGUAGE_COLORS
};
