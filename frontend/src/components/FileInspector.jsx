import { useState } from 'react';
import './FileInspector.css';

export default function FileInspector({ node, onClose }) {
    const [summary, setSummary] = useState('');
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState('');

    if (!node) return null;

    const { label, path, language, loc, complexity, color, importCount } = node.data;

    const handleGetSummary = async () => {
        setLoadingSummary(true);
        setSummaryError('');

        try {
            // We'd need the file content for this - for now show placeholder
            const response = await fetch('http://localhost:3001/api/ai/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileContent: `// File: ${path}\n// This is a ${language} file with ${loc} lines of code.`,
                    path
                })
            });

            if (!response.ok) throw new Error('Failed to get summary');

            const data = await response.json();
            setSummary(data.summary);
        } catch (err) {
            setSummaryError(err.message);
        } finally {
            setLoadingSummary(false);
        }
    };

    return (
        <div className="file-inspector">
            <div className="inspector-header">
                <div className="file-info">
                    <div className="file-icon" style={{ background: color }}>
                        {language.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="file-name">{label}</h3>
                        <p className="file-path">{path}</p>
                    </div>
                </div>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="metrics-grid">
                <div className="metric-card">
                    <span className="metric-icon">📄</span>
                    <div className="metric-info">
                        <span className="metric-value">{loc}</span>
                        <span className="metric-label">Lines</span>
                    </div>
                </div>
                <div className="metric-card">
                    <span className="metric-icon">🔀</span>
                    <div className="metric-info">
                        <span className="metric-value">{complexity}</span>
                        <span className="metric-label">Complexity</span>
                    </div>
                </div>
                <div className="metric-card">
                    <span className="metric-icon">📥</span>
                    <div className="metric-info">
                        <span className="metric-value">{importCount || 0}</span>
                        <span className="metric-label">Imports</span>
                    </div>
                </div>
                <div className="metric-card">
                    <span className="metric-icon">💻</span>
                    <div className="metric-info">
                        <span className="metric-value" style={{ textTransform: 'capitalize' }}>{language}</span>
                        <span className="metric-label">Language</span>
                    </div>
                </div>
            </div>

            <div className="ai-section">
                <div className="ai-header">
                    <span className="ai-icon">🤖</span>
                    <span>AI Summary</span>
                </div>

                {!summary && !loadingSummary && (
                    <button className="summary-btn" onClick={handleGetSummary}>
                        Generate Summary
                    </button>
                )}

                {loadingSummary && (
                    <div className="summary-loading">
                        <span className="spinner"></span>
                        Analyzing file...
                    </div>
                )}

                {summary && (
                    <p className="summary-text">{summary}</p>
                )}

                {summaryError && (
                    <p className="summary-error">❌ {summaryError}</p>
                )}
            </div>
        </div>
    );
}
