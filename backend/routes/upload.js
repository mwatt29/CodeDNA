const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Store active repos in memory (for MVP - no database)
const activeRepos = new Map();

router.post('/uploadRepo', async (req, res) => {
    try {
        const { repoUrl } = req.body;

        if (!repoUrl) {
            return res.status(400).json({ error: 'Repository URL is required' });
        }

        // Validate GitHub URL
        const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
        if (!githubRegex.test(repoUrl)) {
            return res.status(400).json({ error: 'Invalid GitHub repository URL' });
        }

        const repoId = uuidv4();
        const repoPath = path.join(os.tmpdir(), `codedna_${repoId}`);

        console.log(`[CLONE] Cloning repository: ${repoUrl}`);
        console.log(`[CLONE] Target path: ${repoPath}`);

        // Clone the repository
        const git = simpleGit();
        await git.clone(repoUrl, repoPath, ['--depth', '1']);

        // Store repo info
        activeRepos.set(repoId, {
            repoUrl,
            repoPath,
            createdAt: new Date().toISOString()
        });

        console.log(`[OK] Repository cloned successfully: ${repoId}`);

        res.json({
            success: true,
            repoId,
            message: 'Repository cloned successfully'
        });

    } catch (error) {
        console.error('[ERROR] Clone error:', error);
        res.status(500).json({
            error: 'Failed to clone repository',
            details: error.message
        });
    }
});

// Get repo info
router.get('/repo/:repoId', (req, res) => {
    const { repoId } = req.params;
    const repo = activeRepos.get(repoId);

    if (!repo) {
        return res.status(404).json({ error: 'Repository not found' });
    }

    res.json(repo);
});

// Export activeRepos for use in analyze route
router.activeRepos = activeRepos;

module.exports = router;
