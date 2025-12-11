import { useState } from 'react';
import './UploadForm.css';

export default function UploadForm({ onAnalyzed, isLoading, setIsLoading }) {
    const [repoUrl, setRepoUrl] = useState('');
    const [error, setError] = useState('');
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setStatus('');

        if (!repoUrl.trim()) {
            setError('Please enter a GitHub repository URL');
            return;
        }

        // Validate GitHub URL
        const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
        if (!githubRegex.test(repoUrl.trim())) {
            setError('Please enter a valid GitHub repository URL');
            return;
        }

        setIsLoading(true);

        try {
            // Step 1: Clone repository
            setStatus('🔄 Cloning repository...');
            const uploadResponse = await fetch('http://localhost:3001/api/uploadRepo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repoUrl: repoUrl.trim() })
            });

            if (!uploadResponse.ok) {
                const data = await uploadResponse.json();
                throw new Error(data.error || 'Failed to clone repository');
            }

            const { repoId } = await uploadResponse.json();

            // Step 2: Analyze repository
            setStatus('🔍 Analyzing codebase...');
            const analyzeResponse = await fetch(`http://localhost:3001/api/analyze/${repoId}`);

            if (!analyzeResponse.ok) {
                const data = await analyzeResponse.json();
                throw new Error(data.error || 'Failed to analyze repository');
            }

            const result = await analyzeResponse.json();

            setStatus('✅ Analysis complete!');
            onAnalyzed(result);

        } catch (err) {
            setError(err.message || 'Something went wrong');
            setStatus('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="upload-form-container">
            <div className="upload-card">
                <div className="logo">
                    <span className="logo-icon">🧬</span>
                    <h1>CodeDNA</h1>
                </div>
                <p className="tagline">Visualize your codebase structure and dependencies</p>

                <form onSubmit={handleSubmit} className="upload-form">
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="https://github.com/user/repository"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            disabled={isLoading}
                            className="repo-input"
                        />
                        <button type="submit" disabled={isLoading} className="analyze-btn">
                            {isLoading ? (
                                <span className="spinner"></span>
                            ) : (
                                '🔬 Analyze'
                            )}
                        </button>
                    </div>
                </form>

                {status && <p className="status-message">{status}</p>}
                {error && <p className="error-message">❌ {error}</p>}

                <div className="features">
                    <div className="feature">
                        <span>📊</span>
                        <span>Dependency Graph</span>
                    </div>
                    <div className="feature">
                        <span>📏</span>
                        <span>Complexity Metrics</span>
                    </div>
                    <div className="feature">
                        <span>🤖</span>
                        <span>AI Summaries</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
