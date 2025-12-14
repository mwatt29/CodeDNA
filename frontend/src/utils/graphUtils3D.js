/**
 * Utility functions for 3D graph visualization
 */

import * as THREE from 'three';

// Size scaling metrics
export const SIZE_METRICS = {
    COMPLEXITY: 'complexity',
    LOC: 'loc',
    IMPORTS: 'imports',
    HYBRID: 'hybrid'
};

// Color schemes
export const COLOR_SCHEMES = {
    LANGUAGE: 'language',
    COMPLEXITY: 'complexity',
    HEATMAP: 'heatmap'
};

// File extension to icon mapping
export const FILE_ICONS = {
    javascript: '/icons/javascript.svg',
    typescript: '/icons/typescript.svg',
    python: '/icons/python.svg',
    go: '/icons/go.svg',
    rust: '/icons/rust.svg',
    java: '/icons/java.svg',
    css: '/icons/css.svg',
    html: '/icons/html.svg',
    json: '/icons/json.svg',
    cpp: '/icons/cpp.svg',
    c: '/icons/c.svg',
    unknown: '/icons/default.svg'
};

/**
 * Get icon path for a language/extension
 */
export function getIconPath(language) {
    return FILE_ICONS[language?.toLowerCase()] || FILE_ICONS.unknown;
}

/**
 * Create a text label sprite for 3D nodes
 * @param {string} text - Text to display
 * @param {string} color - Text color
 * @param {number} fontSize - Font size in pixels
 * @returns {THREE.Sprite} Sprite with text texture
 */
export function createTextSprite(text, color = '#ffffff', fontSize = 28) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Set canvas size
    canvas.width = 256;
    canvas.height = 64;

    // Configure text
    context.font = `bold ${fontSize}px 'Inter', -apple-system, sans-serif`;
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Add subtle shadow for readability
    context.shadowColor = 'rgba(0, 0, 0, 0.9)';
    context.shadowBlur = 6;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;

    // Truncate long names
    const displayText = text.length > 18 ? text.substring(0, 16) + '...' : text;
    context.fillText(displayText, canvas.width / 2, canvas.height / 2);

    // Create texture and sprite
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        sizeAttenuation: true
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(28, 7, 1);

    return sprite;
}



/**
 * Calculate node size based on metric
 * @param {Object} node - Node data
 * @param {string} metric - Size metric to use
 * @returns {number} Node size (5-40 range)
 */
export function calculateNodeSize(node, metric = SIZE_METRICS.HYBRID) {
    const minSize = 6;
    const maxSize = 35;

    let value;
    switch (metric) {
        case SIZE_METRICS.COMPLEXITY:
            value = node.complexity || 1;
            return Math.max(minSize, Math.min(maxSize, value * 1.5));
        case SIZE_METRICS.LOC:
            value = node.loc || 10;
            return Math.max(minSize, Math.min(maxSize, Math.log(value) * 6));
        case SIZE_METRICS.IMPORTS:
            value = (node.importCount || 0) + (node.importedByCount || 0);
            return Math.max(minSize, Math.min(maxSize, 8 + value * 3));
        case SIZE_METRICS.HYBRID:
        default:
            // Weighted combination
            const complexityScore = (node.complexity || 1) / 20;
            const locScore = Math.log(node.loc || 10) / 8;
            const importScore = ((node.importCount || 0) + (node.importedByCount || 0)) / 10;
            return Math.max(minSize, Math.min(maxSize, (complexityScore + locScore + importScore) * 12 + minSize));
    }
}

/**
 * Convert HSL to hex color
 */
export function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Get gradient color based on value (for complexity/LOC visualization)
 * @param {number} value - Current value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {string} Hex color
 */
export function getGradientColor(value, min, max) {
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));

    // Purple to cyan gradient (matching the app theme)
    // Low: #3b82f6 (blue), Mid: #8b5cf6 (purple), High: #f43f5e (rose)
    if (normalized < 0.5) {
        const t = normalized * 2;
        const h = 220 + t * 40; // blue to purple
        return hslToHex(h, 85, 55 + t * 10);
    } else {
        const t = (normalized - 0.5) * 2;
        const h = 260 - t * 20; // purple to rose/red
        return hslToHex(h, 80 + t * 10, 60 - t * 5);
    }
}

/**
 * Get heatmap color (blue=cold/stable, red=hot/frequent changes)
 * @param {number} changeFreq - Change frequency (0-1)
 * @returns {string} Hex color
 */
export function getHeatmapColor(changeFreq) {
    const normalized = Math.max(0, Math.min(1, changeFreq));

    // Blue (cold) to Red (hot)
    const h = 240 - normalized * 240; // 240 = blue, 0 = red
    const s = 70 + normalized * 25;
    const l = 45 + normalized * 15;

    return hslToHex(h, s, l);
}

/**
 * Apply color based on scheme
 */
export function applyColorScheme(node, scheme, stats = {}) {
    switch (scheme) {
        case COLOR_SCHEMES.COMPLEXITY:
            return getGradientColor(
                node.complexity || 0,
                stats.minComplexity || 0,
                stats.maxComplexity || 50
            );
        case COLOR_SCHEMES.HEATMAP:
            // Would need git data, for now simulate based on complexity
            return getHeatmapColor((node.complexity || 0) / 50);
        case COLOR_SCHEMES.LANGUAGE:
        default:
            return node.color;
    }
}

/**
 * Language icons and colors (enhanced palette)
 */
export const LANGUAGE_ICONS = {
    javascript: { icon: 'JS', color: '#f0db4f', name: 'JavaScript' },
    typescript: { icon: 'TS', color: '#007acc', name: 'TypeScript' },
    python: { icon: 'PY', color: '#306998', name: 'Python' },
    java: { icon: 'JV', color: '#f89820', name: 'Java' },
    go: { icon: 'GO', color: '#00add8', name: 'Go' },
    rust: { icon: 'RS', color: '#ce422b', name: 'Rust' },
    cpp: { icon: 'C++', color: '#659ad2', name: 'C++' },
    c: { icon: 'C', color: '#a8b9cc', name: 'C' },
    css: { icon: 'CSS', color: '#264de4', name: 'CSS' },
    html: { icon: 'HTML', color: '#e34c26', name: 'HTML' },
    json: { icon: 'JSON', color: '#cbcb41', name: 'JSON' },
    jsx: { icon: 'JSX', color: '#61dafb', name: 'React JSX' },
    tsx: { icon: 'TSX', color: '#61dafb', name: 'React TSX' },
    vue: { icon: 'VUE', color: '#42b883', name: 'Vue' },
    ruby: { icon: 'RB', color: '#cc342d', name: 'Ruby' },
    php: { icon: 'PHP', color: '#777bb4', name: 'PHP' },
    markdown: { icon: 'MD', color: '#083fa1', name: 'Markdown' },
    shell: { icon: 'SH', color: '#89e051', name: 'Shell' },
    yaml: { icon: 'YML', color: '#cb171e', name: 'YAML' },
    unknown: { icon: 'FILE', color: '#6b7280', name: 'Other' }
};

/**
 * Risk level colors and descriptions
 */
export const RISK_INDICATORS = {
    cycle: { color: '#ef4444', glow: '#ef4444', label: 'Circular Dependency', description: 'Part of a circular import chain' },
    high: { color: '#f97316', glow: '#f97316', label: 'High Risk', description: 'High complexity or many dependencies' },
    medium: { color: '#eab308', glow: '#eab308', label: 'Medium Risk', description: 'Moderate complexity or coupling' },
    safe: { color: '#22c55e', glow: '#22c55e', label: 'Low Risk', description: 'Well-structured, manageable file' }
};

/**
 * Shape indicators
 */
export const SHAPE_INDICATORS = {
    sphere: { label: 'Normal', description: 'Standard complexity file' },
    icosahedron: { label: 'Complex/Risky', description: 'High complexity (>20) or high risk file' }
};

/**
 * Get language icon info
 */
export function getLanguageIcon(language) {
    return LANGUAGE_ICONS[language?.toLowerCase()] || LANGUAGE_ICONS.unknown;
}

/**
 * Group nodes by cluster key
 */
export function groupNodesByClusters(nodes, clusterKey = 'language') {
    const clusters = new Map();

    for (const node of nodes) {
        const key = node[clusterKey] || 'unknown';
        if (!clusters.has(key)) {
            clusters.set(key, []);
        }
        clusters.get(key).push(node);
    }

    return clusters;
}

/**
 * Calculate convex hull points for 2D projection
 * Graham scan algorithm
 */
export function calculateConvexHull(points) {
    if (points.length < 3) return points;

    // Find bottom-most point
    const sorted = [...points].sort((a, b) => a.y - b.y || a.x - b.x);
    const start = sorted[0];

    // Sort by polar angle
    sorted.slice(1).sort((a, b) => {
        const angleA = Math.atan2(a.y - start.y, a.x - start.x);
        const angleB = Math.atan2(b.y - start.y, b.x - start.x);
        return angleA - angleB;
    });

    const hull = [start];

    for (const point of sorted.slice(1)) {
        while (hull.length > 1) {
            const top = hull[hull.length - 1];
            const second = hull[hull.length - 2];
            const cross = (top.x - second.x) * (point.y - second.y) -
                (top.y - second.y) * (point.x - second.x);
            if (cross <= 0) hull.pop();
            else break;
        }
        hull.push(point);
    }

    return hull;
}

/**
 * Ease functions for animations
 */
export const easing = {
    easeOutElastic: (t) => {
        const p = 0.3;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    },
    easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
    easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
};
