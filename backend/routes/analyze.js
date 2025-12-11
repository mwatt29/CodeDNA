const express = require('express');
const router = express.Router();
const path = require('path');
const { walkDirectory, filterSupportedFiles } = require('../utils/fileUtils');
const { parseFile } = require('../services/parserService');
const { buildGraph } = require('../services/graphBuilder');
const { computeGraphAnalytics } = require('../services/graphAnalytics');

// Get activeRepos from upload route
const uploadRoutes = require('./upload');

router.get('/analyze/:repoId', async (req, res) => {
    try {
        const { repoId } = req.params;
        const repo = uploadRoutes.activeRepos.get(repoId);

        if (!repo) {
            return res.status(404).json({ error: 'Repository not found' });
        }

        console.log(`🔍 Analyzing repository: ${repoId}`);
        console.log(`📁 Path: ${repo.repoPath}`);

        // Walk directory and get all files
        const allFiles = await walkDirectory(repo.repoPath);

        // Filter for supported languages
        const supportedFiles = filterSupportedFiles(allFiles);
        console.log(`📄 Found ${supportedFiles.length} supported files`);

        // Parse each file and extract metrics
        const parsedFiles = [];
        for (const filePath of supportedFiles) {
            try {
                const result = await parseFile(filePath, repo.repoPath);
                parsedFiles.push(result);
            } catch (err) {
                console.warn(`⚠️ Failed to parse ${filePath}: ${err.message}`);
            }
        }

        // Build graph from parsed files
        const graph = buildGraph(parsedFiles, repo.repoPath);

        // Compute graph analytics (SCC, centrality, clustering, risks)
        console.log(`📊 Computing graph analytics...`);
        const analytics = computeGraphAnalytics(graph);
        console.log(`✅ Found ${analytics.cycles.length} cycles, ${analytics.risks.length} risk items`);

        console.log(`✅ Analysis complete: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

        res.json({
            success: true,
            repoId,
            graph,
            analytics,
            stats: {
                totalFiles: supportedFiles.length,
                parsedFiles: parsedFiles.length,
                nodes: graph.nodes.length,
                edges: graph.edges.length,
                cycles: analytics.cycles.length,
                highRiskModules: analytics.summary.highRiskCount
            }
        });

    } catch (error) {
        console.error('❌ Analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze repository',
            details: error.message
        });
    }
});

module.exports = router;
