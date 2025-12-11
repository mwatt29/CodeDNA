/**
 * Graph Analytics Service
 * Implements graph algorithms for architectural analysis:
 * - Tarjan's SCC (cycle detection)
 * - Centrality measures (in/out-degree, betweenness, PageRank)
 * - Clustering (language, directory, modularity)
 * - Risk scoring
 */

/**
 * Compute all graph analytics
 * @param {Object} graph - { nodes: [], edges: [] }
 * @returns {Object} Analytics results
 */
function computeGraphAnalytics(graph) {
    const adjacency = buildAdjacencyList(graph);
    const reverseAdj = buildReverseAdjacencyList(graph);

    // Compute all analytics
    const cycles = detectCycles(adjacency, graph.nodes);
    const centrality = computeCentrality(adjacency, reverseAdj, graph.nodes);
    const clusters = computeClusters(graph.nodes);
    const risks = computeRisks(graph.nodes, centrality, cycles);

    return {
        cycles,
        centrality,
        clusters,
        risks,
        summary: {
            totalCycles: cycles.length,
            highRiskCount: risks.filter(r => r.riskLevel === 'high').length,
            mediumRiskCount: risks.filter(r => r.riskLevel === 'medium').length,
            clusterCount: Object.keys(clusters.byLanguage).length
        }
    };
}

/**
 * Build adjacency list from graph edges
 */
function buildAdjacencyList(graph) {
    const adj = new Map();

    // Initialize all nodes
    for (const node of graph.nodes) {
        adj.set(node.id, []);
    }

    // Add edges
    for (const edge of graph.edges) {
        if (adj.has(edge.source)) {
            adj.get(edge.source).push(edge.target);
        }
    }

    return adj;
}

/**
 * Build reverse adjacency list (incoming edges)
 */
function buildReverseAdjacencyList(graph) {
    const adj = new Map();

    for (const node of graph.nodes) {
        adj.set(node.id, []);
    }

    for (const edge of graph.edges) {
        if (adj.has(edge.target)) {
            adj.get(edge.target).push(edge.source);
        }
    }

    return adj;
}

/**
 * Tarjan's algorithm for Strongly Connected Components
 * Detects cycles in the dependency graph
 */
function detectCycles(adjacency, nodes) {
    const index = new Map();
    const lowlink = new Map();
    const onStack = new Map();
    const stack = [];
    const sccs = [];
    let currentIndex = 0;

    function strongConnect(nodeId) {
        index.set(nodeId, currentIndex);
        lowlink.set(nodeId, currentIndex);
        currentIndex++;
        stack.push(nodeId);
        onStack.set(nodeId, true);

        const neighbors = adjacency.get(nodeId) || [];
        for (const neighbor of neighbors) {
            if (!index.has(neighbor)) {
                strongConnect(neighbor);
                lowlink.set(nodeId, Math.min(lowlink.get(nodeId), lowlink.get(neighbor)));
            } else if (onStack.get(neighbor)) {
                lowlink.set(nodeId, Math.min(lowlink.get(nodeId), index.get(neighbor)));
            }
        }

        // If nodeId is a root node, pop the stack and generate an SCC
        if (lowlink.get(nodeId) === index.get(nodeId)) {
            const scc = [];
            let w;
            do {
                w = stack.pop();
                onStack.set(w, false);
                scc.push(w);
            } while (w !== nodeId);

            // Only keep SCCs with more than 1 node (actual cycles)
            if (scc.length > 1) {
                sccs.push(scc);
            }
        }
    }

    // Run Tarjan's algorithm on all nodes
    for (const node of nodes) {
        if (!index.has(node.id)) {
            strongConnect(node.id);
        }
    }

    // Format cycles with node info
    return sccs.map((cycle, idx) => ({
        id: `cycle-${idx + 1}`,
        nodes: cycle,
        nodeLabels: cycle.map(id => {
            const node = nodes.find(n => n.id === id);
            return node?.data?.label || id;
        }),
        size: cycle.length,
        severity: cycle.length > 3 ? 'high' : cycle.length > 2 ? 'medium' : 'low'
    }));
}

/**
 * Compute centrality measures for all nodes
 */
function computeCentrality(adjacency, reverseAdj, nodes) {
    const centrality = {};

    for (const node of nodes) {
        const id = node.id;
        const outDegree = (adjacency.get(id) || []).length;
        const inDegree = (reverseAdj.get(id) || []).length;

        centrality[id] = {
            nodeId: id,
            label: node.data?.label || id,
            inDegree,
            outDegree,
            totalDegree: inDegree + outDegree,
            // Normalized scores (will be computed after all nodes)
            betweenness: 0,
            pageRank: 0
        };
    }

    // Compute betweenness centrality (simplified - count paths through each node)
    computeBetweenness(adjacency, nodes, centrality);

    // Compute PageRank
    computePageRank(adjacency, reverseAdj, nodes, centrality);

    // Sort by total degree for rankings
    const rankings = Object.values(centrality)
        .sort((a, b) => b.totalDegree - a.totalDegree)
        .slice(0, 10);

    return {
        byNode: centrality,
        topByDegree: rankings,
        topByPageRank: Object.values(centrality)
            .sort((a, b) => b.pageRank - a.pageRank)
            .slice(0, 10),
        topByBetweenness: Object.values(centrality)
            .sort((a, b) => b.betweenness - a.betweenness)
            .slice(0, 10)
    };
}

/**
 * Simplified betweenness centrality
 * Counts how many shortest paths go through each node
 */
function computeBetweenness(adjacency, nodes, centrality) {
    const nodeIds = nodes.map(n => n.id);

    for (const source of nodeIds) {
        // BFS from source
        const visited = new Set();
        const queue = [source];
        const paths = new Map();
        paths.set(source, [source]);
        visited.add(source);

        while (queue.length > 0) {
            const current = queue.shift();
            const neighbors = adjacency.get(current) || [];

            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                    paths.set(neighbor, [...paths.get(current), neighbor]);
                }
            }
        }

        // Count nodes on paths (excluding source and destination)
        for (const [dest, path] of paths) {
            if (dest !== source && path.length > 2) {
                for (let i = 1; i < path.length - 1; i++) {
                    if (centrality[path[i]]) {
                        centrality[path[i]].betweenness++;
                    }
                }
            }
        }
    }

    // Normalize betweenness
    const maxBetweenness = Math.max(...Object.values(centrality).map(c => c.betweenness), 1);
    for (const id in centrality) {
        centrality[id].betweenness = centrality[id].betweenness / maxBetweenness;
    }
}

/**
 * PageRank algorithm
 * Iterative computation of node importance
 */
function computePageRank(adjacency, reverseAdj, nodes, centrality) {
    const damping = 0.85;
    const iterations = 20;
    const n = nodes.length;

    if (n === 0) return;

    // Initialize PageRank
    const pr = new Map();
    for (const node of nodes) {
        pr.set(node.id, 1 / n);
    }

    // Iterate
    for (let i = 0; i < iterations; i++) {
        const newPr = new Map();

        for (const node of nodes) {
            const id = node.id;
            const incomingNodes = reverseAdj.get(id) || [];

            let sum = 0;
            for (const incoming of incomingNodes) {
                const outDegree = (adjacency.get(incoming) || []).length;
                if (outDegree > 0) {
                    sum += pr.get(incoming) / outDegree;
                }
            }

            newPr.set(id, (1 - damping) / n + damping * sum);
        }

        // Update PageRank values
        for (const [id, value] of newPr) {
            pr.set(id, value);
        }
    }

    // Store in centrality
    for (const [id, value] of pr) {
        if (centrality[id]) {
            centrality[id].pageRank = value;
        }
    }
}

/**
 * Compute clusters based on language and directory
 */
function computeClusters(nodes) {
    const byLanguage = {};
    const byDirectory = {};

    for (const node of nodes) {
        const lang = node.data?.language || 'unknown';
        const dir = node.data?.directory || 'root';

        if (!byLanguage[lang]) {
            byLanguage[lang] = [];
        }
        byLanguage[lang].push({
            id: node.id,
            label: node.data?.label
        });

        if (!byDirectory[dir]) {
            byDirectory[dir] = [];
        }
        byDirectory[dir].push({
            id: node.id,
            label: node.data?.label
        });
    }

    return {
        byLanguage,
        byDirectory,
        languageCounts: Object.fromEntries(
            Object.entries(byLanguage).map(([k, v]) => [k, v.length])
        ),
        directoryCounts: Object.fromEntries(
            Object.entries(byDirectory).map(([k, v]) => [k, v.length])
        )
    };
}

/**
 * Compute risk scores for nodes
 * Identifies architectural hotspots
 */
function computeRisks(nodes, centrality, cycles) {
    const risks = [];

    // Create a set of nodes in cycles
    const cycleNodes = new Set();
    for (const cycle of cycles) {
        for (const nodeId of cycle.nodes) {
            cycleNodes.add(nodeId);
        }
    }

    for (const node of nodes) {
        const id = node.id;
        const cent = centrality.byNode[id] || {};
        const complexity = node.data?.complexity || 0;
        const loc = node.data?.loc || 0;
        const inCycle = cycleNodes.has(id);

        // Risk factors
        let riskScore = 0;
        const riskFactors = [];

        // High complexity
        if (complexity > 20) {
            riskScore += 30;
            riskFactors.push('High complexity');
        } else if (complexity > 10) {
            riskScore += 15;
            riskFactors.push('Moderate complexity');
        }

        // High coupling (many imports to this file)
        if (cent.inDegree > 5) {
            riskScore += 25;
            riskFactors.push('High coupling (many dependents)');
        } else if (cent.inDegree > 3) {
            riskScore += 10;
            riskFactors.push('Moderate coupling');
        }

        // High dependencies (many imports from this file)
        if (cent.outDegree > 8) {
            riskScore += 20;
            riskFactors.push('Too many dependencies');
        } else if (cent.outDegree > 5) {
            riskScore += 10;
            riskFactors.push('Many dependencies');
        }

        // In a cycle
        if (inCycle) {
            riskScore += 35;
            riskFactors.push('Part of circular dependency');
        }

        // God module (large file with high centrality)
        if (loc > 300 && cent.totalDegree > 5) {
            riskScore += 25;
            riskFactors.push('God module (large + central)');
        }

        // High betweenness (refactoring bottleneck)
        if (cent.betweenness > 0.5) {
            riskScore += 15;
            riskFactors.push('Refactoring bottleneck');
        }

        if (riskScore > 0) {
            const riskLevel = riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';
            risks.push({
                nodeId: id,
                label: node.data?.label || id,
                riskScore,
                riskLevel,
                riskFactors,
                complexity,
                loc,
                inDegree: cent.inDegree,
                outDegree: cent.outDegree,
                inCycle
            });
        }
    }

    // Sort by risk score
    return risks.sort((a, b) => b.riskScore - a.riskScore);
}

module.exports = {
    computeGraphAnalytics,
    detectCycles,
    computeCentrality,
    computeClusters,
    computeRisks
};
