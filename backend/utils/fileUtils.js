const fs = require('fs').promises;
const path = require('path');

// Supported file extensions
const SUPPORTED_EXTENSIONS = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python'
};

// Directories to ignore
const IGNORE_DIRS = [
    'node_modules',
    '.git',
    '__pycache__',
    '.next',
    'dist',
    'build',
    'coverage',
    '.venv',
    'venv',
    'env'
];

/**
 * Recursively walk a directory and return all file paths
 */
async function walkDirectory(dirPath, files = []) {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (entry.isDirectory()) {
                // Skip ignored directories
                if (!IGNORE_DIRS.includes(entry.name)) {
                    await walkDirectory(fullPath, files);
                }
            } else if (entry.isFile()) {
                files.push(fullPath);
            }
        }

        return files;
    } catch (error) {
        console.warn(`⚠️ Cannot read directory: ${dirPath}`);
        return files;
    }
}

/**
 * Filter files to only supported languages
 */
function filterSupportedFiles(files) {
    return files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return SUPPORTED_EXTENSIONS[ext] !== undefined;
    });
}

/**
 * Get language from file extension
 */
function getLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return SUPPORTED_EXTENSIONS[ext] || 'unknown';
}

/**
 * Read file content
 */
async function readFileContent(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
    } catch (error) {
        throw new Error(`Cannot read file: ${filePath}`);
    }
}

/**
 * Count lines of code (excluding empty lines and comments)
 */
function countLOC(content) {
    const lines = content.split('\n');
    return lines.filter(line => line.trim().length > 0).length;
}

module.exports = {
    walkDirectory,
    filterSupportedFiles,
    getLanguage,
    readFileContent,
    countLOC,
    SUPPORTED_EXTENSIONS
};
