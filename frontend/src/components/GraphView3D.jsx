import { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import {
    calculateNodeSize,
    applyColorScheme,
    SIZE_METRICS,
    COLOR_SCHEMES,
    getLanguageIcon,
    getIconPath,
    createTextSprite
} from '../utils/graphUtils3D';
import Threads from './Threads';
import ColorLegendPanel from './ColorLegendPanel';
import './GraphView3D.css';

export default function GraphView3D({
    graph,
    stats,
    analytics,
    onNodeClick,
    onBack,
    highlightedNode,
    onToggleAnalytics,
    showAnalytics
}) {
    const fgRef = useRef();
    const [hoveredNode, setHoveredNode] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    // Visual settings state
    const [sizeMetric, setSizeMetric] = useState(SIZE_METRICS.HYBRID);
    const [colorScheme, setColorScheme] = useState(COLOR_SCHEMES.LANGUAGE);
    const [showClusters, setShowClusters] = useState(true);
    const [bloomEnabled, setBloomEnabled] = useState(true);
    const [renderMode, setRenderMode] = useState('hybrid'); // 'icons', 'spheres', 'hybrid'
    const [showLegend, setShowLegend] = useState(false);

    // Texture loader for icons
    const textureCache = useRef(new Map());
    const textureLoader = useMemo(() => new THREE.TextureLoader(), []);

    // Build set of nodes in cycles for highlighting
    const cycleNodes = useMemo(() => {
        const nodes = new Set();
        if (analytics?.cycles) {
            for (const cycle of analytics.cycles) {
                for (const nodeId of cycle.nodes) {
                    nodes.add(nodeId);
                }
            }
        }
        return nodes;
    }, [analytics]);

    // Build set of high-risk nodes
    const riskNodes = useMemo(() => {
        const nodes = new Map();
        if (analytics?.risks) {
            for (const risk of analytics.risks) {
                nodes.set(risk.nodeId, risk.riskLevel);
            }
        }
        return nodes;
    }, [analytics]);

    // Calculate stats for color gradients
    const colorStats = useMemo(() => {
        const complexities = graph.nodes.map(n => n.data.complexity || 0);
        const locs = graph.nodes.map(n => n.data.loc || 0);
        return {
            minComplexity: Math.min(...complexities),
            maxComplexity: Math.max(...complexities),
            minLoc: Math.min(...locs),
            maxLoc: Math.max(...locs)
        };
    }, [graph]);

    // Calculate PageRank threshold for showing permanent labels (top 10%)
    const pageRankThreshold = useMemo(() => {
        if (!analytics?.centrality?.byNode) return 0;
        const ranks = Object.values(analytics.centrality.byNode)
            .map(c => c.pageRank)
            .sort((a, b) => b - a);
        // Top 10% threshold
        const index = Math.floor(ranks.length * 0.1);
        return ranks[index] || 0;
    }, [analytics]);

    // Helper to get directory depth from path
    const getPathDepth = useCallback((path) => {
        if (!path) return 0;
        return (path.match(/\//g) || []).length;
    }, []);

    // Convert ReactFlow format to force-graph format with enhanced properties
    const graphData = useMemo(() => {
        // Build connection counts for edge strength
        const connectionCounts = new Map();
        const importedByCounts = new Map();
        const nodeMap = new Map();

        for (const edge of graph.edges) {
            connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
            importedByCounts.set(edge.target, (importedByCounts.get(edge.target) || 0) + 1);
        }

        // Build node map for link distance calculation
        for (const node of graph.nodes) {
            nodeMap.set(node.id, node);
        }

        const nodes = graph.nodes.map(node => {
            const baseNode = {
                id: node.id,
                name: node.data.label,
                language: node.data.language,
                loc: node.data.loc,
                complexity: node.data.complexity,
                baseColor: node.data.color,
                path: node.data.path,
                importCount: node.data.importCount || 0,
                importedByCount: importedByCounts.get(node.id) || 0
            };

            // Apply color scheme
            baseNode.color = applyColorScheme(baseNode, colorScheme, colorStats);

            // Calculate size based on metric
            baseNode.val = calculateNodeSize(baseNode, sizeMetric);

            return baseNode;
        });

        // Calculate links with directory-based distance
        const links = graph.edges.map(edge => {
            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);
            const sourceDepth = getPathDepth(sourceNode?.data?.path);
            const targetDepth = getPathDepth(targetNode?.data?.path);

            // Files in different directories get longer links
            const depthDiff = Math.abs(sourceDepth - targetDepth);
            const baseDistance = 80;
            const distanceMultiplier = 1 + depthDiff * 0.25;

            return {
                source: edge.source,
                target: edge.target,
                distance: baseDistance * distanceMultiplier,
                strength: Math.min(1, 0.3 + (connectionCounts.get(edge.source) || 1) * 0.1)
            };
        });

        return { nodes, links };
    }, [graph, sizeMetric, colorScheme, colorStats, getPathDepth]);


    // Setup enhanced lighting and centering on mount
    useEffect(() => {
        if (!fgRef.current) return;

        // Wait for the graph to initialize
        const timeoutId = setTimeout(() => {
            const fg = fgRef.current;
            if (!fg) return;

            try {
                const scene = fg.scene();
                if (!scene) return;

                // Add environment lighting for better materials
                const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
                scene.add(ambientLight);

                const pointLight = new THREE.PointLight(0xffffff, 1.2, 1000);
                pointLight.position.set(200, 200, 200);
                scene.add(pointLight);

                const pointLight2 = new THREE.PointLight(0x7c3aed, 0.8, 800);
                pointLight2.position.set(-200, -100, 100);
                scene.add(pointLight2);

                const pointLight3 = new THREE.PointLight(0x3b82f6, 0.6, 600);
                pointLight3.position.set(0, -200, 150);
                scene.add(pointLight3);
            } catch (e) {
                console.warn('Could not add lights:', e);
            }

            // Configure d3 forces for better spread and clarity
            fg.d3Force('center', null); // Remove default center
            fg.d3Force('charge').strength(-350); // Strong repulsion to spread nodes

            // Configure link distance based on our calculated distances
            if (fg.d3Force('link')) {
                fg.d3Force('link')
                    .distance(link => link.distance || 100)
                    .strength(link => link.strength || 0.5);
            }

            // Set initial camera position to center view
            fg.cameraPosition({ x: 0, y: 0, z: 500 }, { x: 0, y: 0, z: 0 }, 0);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, []);

    // Handle node click
    const handleNodeClick = useCallback((node) => {
        setSelectedNode(node);

        const clickedNode = {
            id: node.id,
            data: {
                label: node.name,
                language: node.language,
                loc: node.loc,
                complexity: node.complexity,
                color: node.baseColor,
                path: node.path,
                importCount: node.importCount
            }
        };
        onNodeClick?.(clickedNode);

        // Animate zoom to node
        if (fgRef.current) {
            const distance = 150;
            const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
            fgRef.current.cameraPosition(
                { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                node,
                1200
            );
        }
    }, [onNodeClick]);

    // Node hover handlers
    const handleNodeHover = useCallback((node, prevNode) => {
        setHoveredNode(node);
        document.body.style.cursor = node ? 'pointer' : 'grab';
    }, []);

    // Update tooltip position on mouse move
    const handleMouseMove = useCallback((e) => {
        setTooltipPos({ x: e.clientX, y: e.clientY });
    }, []);

    // Custom node rendering with enhanced materials, icons, labels, and risk effects
    const nodeThreeObject = useCallback((node) => {
        const group = new THREE.Group();

        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;
        const isHighlighted = highlightedNode === node.id;
        const isDimmed = selectedNode && selectedNode.id !== node.id && !isConnected(node, selectedNode, graphData.links);
        const isInCycle = cycleNodes.has(node.id);
        const riskLevel = riskNodes.get(node.id);
        const nodePageRank = analytics?.centrality?.byNode?.[node.id]?.pageRank || 0;
        const isImportant = nodePageRank >= pageRankThreshold && pageRankThreshold > 0;

        const scale = isHovered ? 1.25 : isSelected || isHighlighted ? 1.15 : 1;
        const baseSize = node.val * scale;

        // Determine if this is a high-complexity or high-risk node (use different geometry)
        const isHighComplexity = (node.complexity || 0) > 20;
        const isHighRisk = riskLevel === 'high';

        // Determine color based on cycle/risk status
        let nodeColor = node.color;
        let emissiveColor = node.color;
        if (isInCycle) {
            emissiveColor = '#ef4444'; // Red for cycle
        } else if (riskLevel === 'high') {
            emissiveColor = '#f97316'; // Orange for high risk
        } else if (riskLevel === 'medium') {
            emissiveColor = '#eab308'; // Yellow for medium risk
        }

        // Calculate final emissive intensity based on state
        const baseEmissive = isSelected || isHighlighted ? 0.5 : isHovered ? 0.3 : 0.08;
        const riskEmissive = riskLevel === 'high' ? 0.4 : riskLevel === 'medium' ? 0.25 : 0;
        const cycleEmissive = isInCycle ? 0.35 : 0;
        const finalEmissive = Math.max(baseEmissive, riskEmissive, cycleEmissive);

        // Use Icosahedron for high-complexity/risk nodes to suggest "roughness"
        let geometry;
        if (isHighComplexity || isHighRisk) {
            geometry = new THREE.IcosahedronGeometry(baseSize, 1);
        } else {
            geometry = new THREE.SphereGeometry(baseSize, 32, 32);
        }

        // Main shape with physical material (glass-like)
        const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(nodeColor),
            metalness: 0.2,
            roughness: 0.15,
            transparent: true,
            opacity: isDimmed ? 0.25 : 0.85,
            envMapIntensity: 0.8,
            clearcoat: 0.5,
            clearcoatRoughness: 0.3,
            emissive: new THREE.Color(emissiveColor),
            emissiveIntensity: finalEmissive
        });
        const mainShape = new THREE.Mesh(geometry, material);
        group.add(mainShape);

        // Inner core glow
        const coreGeometry = new THREE.SphereGeometry(baseSize * 0.5, 16, 16);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: node.color,
            transparent: true,
            opacity: 0.6
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        group.add(core);

        // Outer glow halo
        const glowGeometry = new THREE.SphereGeometry(baseSize * 1.4, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: node.color,
            transparent: true,
            opacity: isSelected ? 0.25 : isHovered ? 0.18 : 0.08,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);

        // Risk/Cycle pulsing outer glow effect
        if (riskLevel === 'high' || isInCycle) {
            const pulseGeometry = new THREE.SphereGeometry(baseSize * 1.8, 16, 16);
            const pulseMaterial = new THREE.MeshBasicMaterial({
                color: isInCycle ? 0xef4444 : 0xf97316,
                transparent: true,
                opacity: 0.15,
                side: THREE.BackSide
            });
            const pulseOrb = new THREE.Mesh(pulseGeometry, pulseMaterial);
            group.add(pulseOrb);
        }

        // Medium risk glow
        if (riskLevel === 'medium' && !isInCycle) {
            const warningGeometry = new THREE.SphereGeometry(baseSize * 1.6, 16, 16);
            const warningMaterial = new THREE.MeshBasicMaterial({
                color: 0xeab308,
                transparent: true,
                opacity: 0.1,
                side: THREE.BackSide
            });
            const warningOrb = new THREE.Mesh(warningGeometry, warningMaterial);
            group.add(warningOrb);
        }

        // Selection ring
        if (isSelected) {
            const ringGeometry = new THREE.TorusGeometry(baseSize * 1.6, 1.5, 8, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
        }

        // Add permanent text label for high-centrality (important) nodes
        if (isImportant && !isDimmed) {
            const label = createTextSprite(node.name, '#ffffff');
            label.position.set(0, baseSize + 10, 0);
            group.add(label);
        }

        // File type icon overlay for important nodes in hybrid mode
        if ((renderMode === 'icons' || (renderMode === 'hybrid' && isImportant)) && !isDimmed) {
            // Load icon texture
            const iconPath = getIconPath(node.language);
            if (!textureCache.current.has(iconPath)) {
                const texture = textureLoader.load(iconPath);
                texture.colorSpace = THREE.SRGBColorSpace;
                textureCache.current.set(iconPath, texture);
            }
            const iconTexture = textureCache.current.get(iconPath);

            if (iconTexture) {
                const iconMaterial = new THREE.SpriteMaterial({
                    map: iconTexture,
                    transparent: true,
                    opacity: 0.9,
                    depthTest: false
                });
                const iconSprite = new THREE.Sprite(iconMaterial);
                const iconScale = Math.max(12, baseSize * 0.8);
                iconSprite.scale.set(iconScale, iconScale, 1);
                iconSprite.position.set(baseSize + 8, baseSize + 5, 0);
                group.add(iconSprite);
            }
        }

        return group;
    }, [hoveredNode, selectedNode, highlightedNode, graphData.links, cycleNodes, riskNodes, analytics, pageRankThreshold, renderMode, textureLoader]);


    // Check if two nodes are connected
    function isConnected(node1, node2, links) {
        if (!node1 || !node2) return false;
        return links.some(link =>
            (link.source.id === node1.id && link.target.id === node2.id) ||
            (link.source.id === node2.id && link.target.id === node1.id) ||
            (link.source === node1.id && link.target === node2.id) ||
            (link.source === node2.id && link.target === node1.id)
        );
    }

    // Custom link rendering - curved with variable width
    const linkWidth = useCallback((link) => {
        const baseWidth = 1 + (link.strength || 0.5) * 3;
        return baseWidth;
    }, []);

    const linkColor = useCallback((link) => {
        // Gradient from source to target colors
        if (link.source && link.target) {
            return `rgba(124, 58, 237, ${0.3 + (link.strength || 0.5) * 0.4})`;
        }
        return 'rgba(124, 58, 237, 0.4)';
    }, []);

    // Force-directed physics configuration
    const d3Force = useCallback((d3) => {
        // Increase repulsion
        d3.force('charge').strength(-180);

        // Adjust link distance
        if (d3.force('link')) {
            d3.force('link').distance(100);
        }
    }, []);

    // Get language icon for legend
    const languageList = useMemo(() => {
        const languages = new Set(graph.nodes.map(n => n.data.language));
        return Array.from(languages).map(lang => ({
            lang,
            ...getLanguageIcon(lang)
        }));
    }, [graph]);

    return (
        <div className="graph-view-3d" onMouseMove={handleMouseMove}>
            <div className="graph-header-3d">
                <button onClick={onBack} className="back-button-3d">
                    ← Analyze Another
                </button>
                <div className="stats-bar-3d">
                    <span className="stat-item-3d">
                        <span className="stat-icon-3d">📁</span>
                        <span className="stat-value-3d">{stats.totalFiles}</span>
                        <span className="stat-label-3d">Files</span>
                    </span>
                    <span className="stat-item-3d">
                        <span className="stat-icon-3d">🔗</span>
                        <span className="stat-value-3d">{stats.edges}</span>
                        <span className="stat-label-3d">Dependencies</span>
                    </span>
                </div>

                {/* Visual Controls */}
                <div className="visual-controls-3d">
                    <div className="control-group">
                        <label>Size:</label>
                        <select
                            value={sizeMetric}
                            onChange={(e) => setSizeMetric(e.target.value)}
                            className="control-select"
                        >
                            <option value={SIZE_METRICS.HYBRID}>Hybrid</option>
                            <option value={SIZE_METRICS.COMPLEXITY}>Complexity</option>
                            <option value={SIZE_METRICS.LOC}>Lines of Code</option>
                            <option value={SIZE_METRICS.IMPORTS}>Connections</option>
                        </select>
                    </div>
                    <div className="control-group">
                        <label>Color:</label>
                        <select
                            value={colorScheme}
                            onChange={(e) => setColorScheme(e.target.value)}
                            className="control-select"
                        >
                            <option value={COLOR_SCHEMES.LANGUAGE}>Language</option>
                            <option value={COLOR_SCHEMES.COMPLEXITY}>Complexity</option>
                            <option value={COLOR_SCHEMES.HEATMAP}>Heatmap</option>
                        </select>
                    </div>
                    <div className="control-group">
                        <label>Style:</label>
                        <select
                            value={renderMode}
                            onChange={(e) => setRenderMode(e.target.value)}
                            className="control-select"
                        >
                            <option value="hybrid">Hybrid</option>
                            <option value="spheres">Spheres</option>
                            <option value="icons">Icons</option>
                        </select>
                    </div>
                    <button
                        className={`control-toggle ${bloomEnabled ? 'active' : ''}`}
                        onClick={() => setBloomEnabled(!bloomEnabled)}
                        title="Toggle bloom effect"
                    >
                        Bloom
                    </button>
                    <button
                        className={`control-toggle ${showAnalytics ? 'active' : ''}`}
                        onClick={onToggleAnalytics}
                        title="Toggle analytics panel"
                    >
                        Analytics
                    </button>
                </div>

                <div className="legend-3d">
                    {languageList.map(({ lang, icon, color }) => (
                        <span key={lang} className="legend-item-3d">
                            <span className="legend-dot-3d" style={{ background: color }}></span>
                            {icon}
                        </span>
                    ))}
                </div>
            </div>

            <div className="graph-container-3d">
                {/* Animated threads background */}
                <Threads
                    amplitude={0.8}
                    distance={0.3}
                    enableMouseInteraction={true}
                    color={[0.48, 0.23, 0.93]}
                />

                <ForceGraph3D
                    ref={fgRef}
                    graphData={graphData}
                    nodeThreeObject={nodeThreeObject}
                    nodeLabel=""
                    onNodeClick={handleNodeClick}
                    onNodeHover={handleNodeHover}
                    linkColor={linkColor}
                    linkWidth={linkWidth}
                    linkOpacity={0.7}
                    linkCurvature={0.15}
                    linkDirectionalParticles={2}
                    linkDirectionalParticleWidth={2}
                    linkDirectionalParticleSpeed={0.006}
                    linkDirectionalParticleColor={() => 'rgba(167, 139, 250, 0.8)'}
                    backgroundColor="rgba(0,0,0,0)"
                    showNavInfo={false}
                    enableNodeDrag={true}
                    enableNavigationControls={true}
                    controlType="orbit"
                    d3VelocityDecay={0.35}
                    d3AlphaDecay={0.015}
                    cooldownTicks={300}
                    warmupTicks={150}
                />

                {/* Controls hint */}
                <div className="controls-hint">
                    <span><kbd>Drag</kbd> Rotate view</span>
                    <span><kbd>Scroll</kbd> Zoom</span>
                    <span><kbd>Click</kbd> Select node</span>
                    <span><kbd>Shift+Drag</kbd> Pan</span>
                </div>

                {/* Heatmap legend */}
                {colorScheme === COLOR_SCHEMES.HEATMAP && (
                    <div className="heatmap-legend">
                        <span className="heatmap-label">Low</span>
                        <div className="heatmap-gradient"></div>
                        <span className="heatmap-label">High</span>
                    </div>
                )}

                {/* Hover tooltip */}
                {hoveredNode && (
                    <div
                        className="node-tooltip-3d"
                        style={{ left: tooltipPos.x, top: tooltipPos.y }}
                    >
                        <div className="tooltip-header">
                            <span
                                className="tooltip-lang-badge"
                                style={{ background: hoveredNode.baseColor }}
                            >
                                {getLanguageIcon(hoveredNode.language).icon}
                            </span>
                            <div className="tooltip-title">{hoveredNode.name}</div>
                        </div>
                        <div className="tooltip-stats">
                            <span>📄 {hoveredNode.loc} lines</span>
                            <span>🔀 {hoveredNode.complexity} complexity</span>
                            <span>📥 {hoveredNode.importCount} imports</span>
                            <span>📤 {hoveredNode.importedByCount} dependents</span>
                        </div>
                        <div className="tooltip-path">{hoveredNode.path}</div>
                    </div>
                )}

                {/* Color Legend Panel */}
                <ColorLegendPanel
                    isOpen={showLegend}
                    onToggle={() => setShowLegend(!showLegend)}
                    colorScheme={colorScheme}
                    languagesInUse={languageList.map(l => l.lang)}
                />
            </div>
        </div>
    );
}
