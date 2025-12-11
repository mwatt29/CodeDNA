const path = require('path');
const { readFileContent, getLanguage, countLOC } = require('../utils/fileUtils');

/**
 * Parse a file and extract imports, metrics, and metadata
 * Using regex-based parsing (simpler than Tree-sitter for MVP)
 */
async function parseFile(filePath, repoRoot) {
    const content = await readFileContent(filePath);
    const language = getLanguage(filePath);
    const relativePath = path.relative(repoRoot, filePath);
    const loc = countLOC(content);

    // Extract imports based on language
    const imports = extractImports(content, language, relativePath, repoRoot);

    // Calculate complexity (simple metric: based on control structures + functions)
    const complexity = calculateComplexity(content, language);

    return {
        path: relativePath,
        absolutePath: filePath,
        language,
        loc,
        complexity,
        imports,
        content
    };
}

/**
 * Extract import statements from code
 */
function extractImports(content, language, currentPath, repoRoot) {
    const imports = [];

    if (language === 'javascript' || language === 'typescript') {
        // ES6 imports: import x from 'y'
        const esImports = content.matchAll(/import\s+.*?\s+from\s+['"](.+?)['"]/g);
        for (const match of esImports) {
            imports.push(resolveImport(match[1], currentPath, repoRoot));
        }

        // ES6 imports: import 'y'
        const sideEffectImports = content.matchAll(/import\s+['"](.+?)['"]/g);
        for (const match of sideEffectImports) {
            imports.push(resolveImport(match[1], currentPath, repoRoot));
        }

        // CommonJS require: require('y')
        const requireImports = content.matchAll(/require\s*\(\s*['"](.+?)['"]\s*\)/g);
        for (const match of requireImports) {
            imports.push(resolveImport(match[1], currentPath, repoRoot));
        }

        // Dynamic imports: import('y')
        const dynamicImports = content.matchAll(/import\s*\(\s*['"](.+?)['"]\s*\)/g);
        for (const match of dynamicImports) {
            imports.push(resolveImport(match[1], currentPath, repoRoot));
        }
    }

    if (language === 'python') {
        // import x
        const simpleImports = content.matchAll(/^\s*import\s+(\w+)/gm);
        for (const match of simpleImports) {
            imports.push({ module: match[1], isRelative: false });
        }

        // from x import y
        const fromImports = content.matchAll(/^\s*from\s+([.\w]+)\s+import/gm);
        for (const match of fromImports) {
            const isRelative = match[1].startsWith('.');
            imports.push({ module: match[1], isRelative });
        }
    }

    return imports;
}

/**
 * Resolve import path to relative file path
 */
function resolveImport(importPath, currentPath, repoRoot) {
    const isRelative = importPath.startsWith('.') || importPath.startsWith('/');

    if (isRelative) {
        // Resolve relative to current file
        const currentDir = path.dirname(currentPath);
        let resolved = path.join(currentDir, importPath);

        // Add common extensions if missing
        if (!path.extname(resolved)) {
            // Try common extensions
            const extensions = ['.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.ts'];
            return { module: resolved, isRelative: true, possibleExtensions: extensions };
        }

        return { module: resolved, isRelative: true };
    }

    // External package
    return { module: importPath, isRelative: false };
}

/**
 * Calculate basic complexity score
 * Based on control structures, functions, and nesting
 */
function calculateComplexity(content, language) {
    let complexity = 1; // Base complexity

    if (language === 'javascript' || language === 'typescript') {
        // Count control structures
        const patterns = [
            /\bif\s*\(/g,
            /\belse\s+if\s*\(/g,
            /\bfor\s*\(/g,
            /\bwhile\s*\(/g,
            /\bswitch\s*\(/g,
            /\bcatch\s*\(/g,
            /\bcase\s+/g,
            /\?.*:/g, // Ternary
            /\bfunction\s*\w*\s*\(/g,
            /=>\s*{/g, // Arrow functions with block
            /\|\|/g, // Logical OR
            /&&/g, // Logical AND
        ];

        for (const pattern of patterns) {
            const matches = content.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        }
    }

    if (language === 'python') {
        const patterns = [
            /\bif\s+/g,
            /\belif\s+/g,
            /\bfor\s+/g,
            /\bwhile\s+/g,
            /\bexcept[\s:]/g,
            /\bdef\s+/g,
            /\bclass\s+/g,
            /\blambda\s+/g,
            /\band\b/g,
            /\bor\b/g,
        ];

        for (const pattern of patterns) {
            const matches = content.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        }
    }

    return complexity;
}

module.exports = {
    parseFile,
    extractImports,
    calculateComplexity
};
