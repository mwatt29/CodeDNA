const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize AI clients
let openai = null;
let anthropic = null;

try {
    if (process.env.OPENAI_API_KEY) {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        console.log('✅ OpenAI configured');
    }
} catch (error) {
    console.warn('⚠️ OpenAI not configured');
}

try {
    if (process.env.ANTHROPIC_API_KEY) {
        anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        console.log('✅ Claude/Anthropic configured');
    }
} catch (error) {
    console.warn('⚠️ Claude/Anthropic not configured');
}

/**
 * Select the best available AI provider
 */
function getAIProvider() {
    if (anthropic) return 'claude';
    if (openai) return 'openai';
    return null;
}

/**
 * Generate AI response using available provider
 */
async function generateAIResponse(prompt, maxTokens = 500) {
    const provider = getAIProvider();

    if (provider === 'claude') {
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: maxTokens,
            messages: [{ role: 'user', content: prompt }]
        });
        return response.content[0].text;
    }

    if (provider === 'openai') {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
            temperature: 0.3
        });
        return completion.choices[0]?.message?.content || '';
    }

    return null;
}

/**
 * File summarization endpoint
 */
router.post('/ai/summarize', async (req, res) => {
    try {
        const { fileContent, path: filePath } = req.body;

        if (!fileContent) {
            return res.status(400).json({ error: 'File content is required' });
        }

        const provider = getAIProvider();
        if (!provider) {
            return res.json({
                success: true,
                summary: `This is the file at ${filePath || 'unknown path'}. AI summarization requires an API key. Set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variable.`,
                aiEnabled: false
            });
        }

        console.log(`🤖 Generating AI summary for: ${filePath} (using ${provider})`);

        const maxContent = 8000;
        const truncatedContent = fileContent.length > maxContent
            ? fileContent.slice(0, maxContent) + '\n\n... [truncated]'
            : fileContent;

        const prompt = `You are analyzing a codebase. Summarize the purpose of the following file in 2-3 sentences. Be concise and focus on the main functionality.

File path: ${filePath || 'unknown'}

Content:
${truncatedContent}`;

        const summary = await generateAIResponse(prompt, 200);

        res.json({
            success: true,
            summary: summary || 'Unable to generate summary.',
            aiEnabled: true,
            provider
        });

    } catch (error) {
        console.error('❌ AI summary error:', error);
        res.status(500).json({
            error: 'Failed to generate summary',
            details: error.message
        });
    }
});

/**
 * Refactor guidance endpoint
 * Takes analytics data and generates actionable suggestions
 */
router.post('/ai/refactor', async (req, res) => {
    try {
        const { cycles, risks, centrality } = req.body;

        const provider = getAIProvider();
        if (!provider) {
            return res.json({
                success: true,
                suggestions: generateFallbackSuggestions(cycles, risks),
                aiEnabled: false
            });
        }

        console.log(`🤖 Generating refactor suggestions (using ${provider})`);

        // Build context for the AI
        let context = 'You are an expert software architect analyzing a codebase for architectural issues.\n\n';

        // Add cycle information
        if (cycles && cycles.length > 0) {
            context += `## Circular Dependencies Detected (${cycles.length} cycles):\n`;
            for (const cycle of cycles.slice(0, 5)) {
                context += `- Cycle: ${cycle.nodeLabels.join(' → ')} → ${cycle.nodeLabels[0]}\n`;
            }
            context += '\n';
        }

        // Add high-risk modules
        if (risks && risks.length > 0) {
            const highRisks = risks.filter(r => r.riskLevel === 'high').slice(0, 5);
            if (highRisks.length > 0) {
                context += `## High-Risk Modules:\n`;
                for (const risk of highRisks) {
                    context += `- ${risk.label}: ${risk.riskFactors.join(', ')}\n`;
                }
                context += '\n';
            }
        }

        // Add centrality leaders
        if (centrality?.topByDegree) {
            context += `## Most Connected Modules:\n`;
            for (const node of centrality.topByDegree.slice(0, 3)) {
                context += `- ${node.label}: ${node.inDegree} imports, ${node.outDegree} dependencies\n`;
            }
            context += '\n';
        }

        const prompt = `${context}
Based on this analysis, provide 3-5 specific, actionable refactoring suggestions. For each suggestion:
1. Identify the specific issue
2. Explain why it's problematic
3. Provide a concrete solution

Format each suggestion with a clear title and explanation. Be specific about file names when possible.`;

        const suggestions = await generateAIResponse(prompt, 800);

        res.json({
            success: true,
            suggestions: suggestions || 'Unable to generate suggestions.',
            aiEnabled: true,
            provider
        });

    } catch (error) {
        console.error('❌ Refactor guidance error:', error);
        res.status(500).json({
            error: 'Failed to generate refactor guidance',
            details: error.message
        });
    }
});

/**
 * Generate fallback suggestions when AI is not available
 */
function generateFallbackSuggestions(cycles, risks) {
    const suggestions = [];

    if (cycles && cycles.length > 0) {
        suggestions.push({
            title: 'Break Circular Dependencies',
            description: `Found ${cycles.length} circular dependency cycles. Consider:`,
            actions: [
                'Extract shared interfaces to break import cycles',
                'Use dependency injection instead of direct imports',
                'Create a shared module for common functionality'
            ],
            files: cycles[0]?.nodeLabels || []
        });
    }

    if (risks && risks.length > 0) {
        const highRisks = risks.filter(r => r.riskLevel === 'high');
        if (highRisks.length > 0) {
            suggestions.push({
                title: 'Address High-Risk Modules',
                description: `${highRisks.length} modules flagged as high risk:`,
                actions: highRisks.slice(0, 3).map(r =>
                    `${r.label}: ${r.riskFactors[0]}`
                ),
                files: highRisks.slice(0, 3).map(r => r.label)
            });
        }

        const godModules = risks.filter(r =>
            r.riskFactors.some(f => f.includes('God module'))
        );
        if (godModules.length > 0) {
            suggestions.push({
                title: 'Split God Modules',
                description: 'Large files with too many responsibilities:',
                actions: [
                    'Break into smaller, focused modules',
                    'Apply Single Responsibility Principle',
                    'Extract reusable utilities'
                ],
                files: godModules.map(r => r.label)
            });
        }
    }

    if (suggestions.length === 0) {
        suggestions.push({
            title: 'Architecture Looks Good!',
            description: 'No major architectural issues detected.',
            actions: ['Continue monitoring as codebase grows'],
            files: []
        });
    }

    return suggestions;
}

module.exports = router;
