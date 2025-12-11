import { useState } from 'react';
import './AnalyticsPanel.css';

export default function AnalyticsPanel({ analytics, onNodeHighlight, onClose }) {
    const [activeTab, setActiveTab] = useState('risks');
    const [refactorSuggestions, setRefactorSuggestions] = useState(null);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    if (!analytics) return null;

    const { cycles, risks, centrality, clusters, summary } = analytics;

    const handleGetSuggestions = async () => {
        setLoadingSuggestions(true);
        try {
            const response = await fetch('http://localhost:3001/api/ai/refactor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cycles,
                    risks,
                    centrality
                })
            });
            const data = await response.json();
            setRefactorSuggestions(data.suggestions);
        } catch (err) {
            console.error('Failed to get suggestions:', err);
            setRefactorSuggestions('Failed to generate suggestions. Check console for details.');
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleNodeClick = (nodeId) => {
        onNodeHighlight?.(nodeId);
    };

    const getRiskBadgeClass = (level) => {
        return `risk-badge risk-${level}`;
    };

    return (
        <div className="analytics-panel">
            <div className="analytics-header">
                <h2>📊 Analytics</h2>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <div className={`summary-card ${cycles.length > 0 ? 'warning' : 'good'}`}>
                    <span className="card-icon">🔄</span>
                    <span className="card-value">{cycles.length}</span>
                    <span className="card-label">Cycles</span>
                </div>
                <div className={`summary-card ${summary.highRiskCount > 0 ? 'danger' : 'good'}`}>
                    <span className="card-icon">⚠️</span>
                    <span className="card-value">{summary.highRiskCount}</span>
                    <span className="card-label">High Risk</span>
                </div>
                <div className="summary-card neutral">
                    <span className="card-icon">📦</span>
                    <span className="card-value">{Object.keys(clusters.byLanguage).length}</span>
                    <span className="card-label">Languages</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="analytics-tabs">
                <button
                    className={activeTab === 'risks' ? 'active' : ''}
                    onClick={() => setActiveTab('risks')}
                >
                    Risks
                </button>
                <button
                    className={activeTab === 'cycles' ? 'active' : ''}
                    onClick={() => setActiveTab('cycles')}
                >
                    Cycles
                </button>
                <button
                    className={activeTab === 'centrality' ? 'active' : ''}
                    onClick={() => setActiveTab('centrality')}
                >
                    Centrality
                </button>
                <button
                    className={activeTab === 'clusters' ? 'active' : ''}
                    onClick={() => setActiveTab('clusters')}
                >
                    Clusters
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'risks' && (
                    <div className="risks-tab">
                        {risks.length === 0 ? (
                            <div className="empty-state">
                                <span>✅</span>
                                <p>No architectural risks detected!</p>
                            </div>
                        ) : (
                            <div className="risk-list">
                                {risks.slice(0, 10).map((risk, idx) => (
                                    <div
                                        key={idx}
                                        className="risk-item"
                                        onClick={() => handleNodeClick(risk.nodeId)}
                                    >
                                        <div className="risk-header">
                                            <span className={getRiskBadgeClass(risk.riskLevel)}>
                                                {risk.riskLevel.toUpperCase()}
                                            </span>
                                            <span className="risk-label">{risk.label}</span>
                                        </div>
                                        <div className="risk-factors">
                                            {risk.riskFactors.map((factor, i) => (
                                                <span key={i} className="factor-tag">{factor}</span>
                                            ))}
                                        </div>
                                        <div className="risk-stats">
                                            <span>📄 {risk.loc} LOC</span>
                                            <span>🔀 {risk.complexity} complexity</span>
                                            <span>📥 {risk.inDegree} imports</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'cycles' && (
                    <div className="cycles-tab">
                        {cycles.length === 0 ? (
                            <div className="empty-state">
                                <span>✅</span>
                                <p>No circular dependencies found!</p>
                            </div>
                        ) : (
                            <div className="cycle-list">
                                {cycles.map((cycle, idx) => (
                                    <div key={idx} className="cycle-item">
                                        <div className="cycle-header">
                                            <span className={`severity-badge ${cycle.severity}`}>
                                                {cycle.severity}
                                            </span>
                                            <span>{cycle.size} files</span>
                                        </div>
                                        <div className="cycle-path">
                                            {cycle.nodeLabels.map((label, i) => (
                                                <span key={i}>
                                                    <button
                                                        className="node-link"
                                                        onClick={() => handleNodeClick(cycle.nodes[i])}
                                                    >
                                                        {label}
                                                    </button>
                                                    {i < cycle.nodeLabels.length - 1 && (
                                                        <span className="arrow">→</span>
                                                    )}
                                                </span>
                                            ))}
                                            <span className="arrow">→</span>
                                            <span className="cycle-return">{cycle.nodeLabels[0]}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'centrality' && (
                    <div className="centrality-tab">
                        <h4>📈 Most Connected Modules</h4>
                        <div className="centrality-list">
                            {centrality.topByDegree.map((node, idx) => (
                                <div
                                    key={idx}
                                    className="centrality-item"
                                    onClick={() => handleNodeClick(node.nodeId)}
                                >
                                    <span className="rank">#{idx + 1}</span>
                                    <span className="node-name">{node.label}</span>
                                    <div className="degree-stats">
                                        <span className="in-degree" title="Files that import this">
                                            📥 {node.inDegree}
                                        </span>
                                        <span className="out-degree" title="Files imported by this">
                                            📤 {node.outDegree}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <h4>⭐ Highest Impact (PageRank)</h4>
                        <div className="centrality-list">
                            {centrality.topByPageRank.slice(0, 5).map((node, idx) => (
                                <div
                                    key={idx}
                                    className="centrality-item"
                                    onClick={() => handleNodeClick(node.nodeId)}
                                >
                                    <span className="rank">#{idx + 1}</span>
                                    <span className="node-name">{node.label}</span>
                                    <span className="pagerank">
                                        {(node.pageRank * 100).toFixed(1)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'clusters' && (
                    <div className="clusters-tab">
                        <h4>🗂️ By Language</h4>
                        <div className="cluster-list">
                            {Object.entries(clusters.languageCounts).map(([lang, count]) => (
                                <div key={lang} className="cluster-item">
                                    <span className="cluster-name">{lang}</span>
                                    <span className="cluster-count">{count} files</span>
                                </div>
                            ))}
                        </div>

                        <h4>📁 By Directory</h4>
                        <div className="cluster-list">
                            {Object.entries(clusters.directoryCounts)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 8)
                                .map(([dir, count]) => (
                                    <div key={dir} className="cluster-item">
                                        <span className="cluster-name">{dir || '(root)'}</span>
                                        <span className="cluster-count">{count} files</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            {/* AI Suggestions Section */}
            <div className="ai-suggestions-section">
                <div className="section-header">
                    <span>🤖 AI Refactor Guidance</span>
                </div>

                {!refactorSuggestions && !loadingSuggestions && (
                    <button
                        className="get-suggestions-btn"
                        onClick={handleGetSuggestions}
                    >
                        Generate Suggestions
                    </button>
                )}

                {loadingSuggestions && (
                    <div className="loading-suggestions">
                        <span className="spinner"></span>
                        Analyzing architecture...
                    </div>
                )}

                {refactorSuggestions && (
                    <div className="suggestions-content">
                        {typeof refactorSuggestions === 'string' ? (
                            <div className="suggestion-text">
                                {refactorSuggestions.split('\n').map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>
                        ) : (
                            <div className="suggestions-list">
                                {refactorSuggestions.map((suggestion, idx) => (
                                    <div key={idx} className="suggestion-item">
                                        <h5>{suggestion.title}</h5>
                                        <p>{suggestion.description}</p>
                                        <ul>
                                            {suggestion.actions?.map((action, i) => (
                                                <li key={i}>{action}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
