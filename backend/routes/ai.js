const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Initialize OpenAI client (will use OPENAI_API_KEY from environment)
let openai = null;
try {
    if (process.env.OPENAI_API_KEY) {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
} catch (error) {
    console.warn('⚠️ OpenAI not configured');
}

router.post('/ai/summarize', async (req, res) => {
    try {
        const { fileContent, path: filePath } = req.body;

        if (!fileContent) {
            return res.status(400).json({ error: 'File content is required' });
        }

        if (!openai) {
            // Return a placeholder if no API key
            return res.json({
                success: true,
                summary: `This is the file at ${filePath || 'unknown path'}. AI summarization requires an OpenAI API key to be configured. Set the OPENAI_API_KEY environment variable to enable this feature.`,
                aiEnabled: false
            });
        }

        console.log(`🤖 Generating AI summary for: ${filePath}`);

        // Truncate content if too long
        const maxContent = 8000;
        const truncatedContent = fileContent.length > maxContent
            ? fileContent.slice(0, maxContent) + '\n\n... [truncated]'
            : fileContent;

        const prompt = `You are analyzing a codebase. Summarize the purpose of the following file in 2-3 sentences. Be concise and focus on the main functionality.

File path: ${filePath || 'unknown'}

Content:
${truncatedContent}`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
            temperature: 0.3
        });

        const summary = completion.choices[0]?.message?.content || 'Unable to generate summary.';

        res.json({
            success: true,
            summary,
            aiEnabled: true
        });

    } catch (error) {
        console.error('❌ AI summary error:', error);
        res.status(500).json({
            error: 'Failed to generate summary',
            details: error.message
        });
    }
});

module.exports = router;
