/**
 * Utility functions for 3D graph visualization
 */

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
 * Language icons (emoji fallback)
 */
export const LANGUAGE_ICONS = {
    javascript: { icon: 'JS', color: '#f7df1e' },
    typescript: { icon: 'TS', color: '#3178c6' },
    python: { icon: 'PY', color: '#3776ab' },
    java: { icon: 'JV', color: '#ed8b00' },
    go: { icon: 'GO', color: '#00add8' },
    rust: { icon: 'RS', color: '#dea584' },
    cpp: { icon: 'C+', color: '#00599c' },
    c: { icon: 'C', color: '#555555' },
    unknown: { icon: '📄', color: '#888888' }
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
