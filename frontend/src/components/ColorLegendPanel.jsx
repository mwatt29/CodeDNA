import { useState } from 'react';
import { LANGUAGE_ICONS, RISK_INDICATORS, SHAPE_INDICATORS, COLOR_SCHEMES } from '../utils/graphUtils3D';
import './ColorLegendPanel.css';

export default function ColorLegendPanel({
    isOpen,
    onToggle,
    colorScheme,
    languagesInUse = []
}) {
    const [activeTab, setActiveTab] = useState('languages');

    // Filter to only show languages actually in the repository
    const activeLanguages = languagesInUse.length > 0
        ? languagesInUse.map(lang => ({
            key: lang,
            ...LANGUAGE_ICONS[lang?.toLowerCase()] || LANGUAGE_ICONS.unknown
        }))
        : Object.entries(LANGUAGE_ICONS).map(([key, value]) => ({ key, ...value }));

    return (
        <>
            {/* Toggle Button */}
            <button
                className={`legend-toggle-btn ${isOpen ? 'active' : ''}`}
                onClick={onToggle}
                title="Toggle color legend"
            >
                <span className="legend-icon">🎨</span>
                <span className="legend-label">Legend</span>
            </button>

            {/* Legend Panel */}
            <div className={`color-legend-panel ${isOpen ? 'open' : ''}`}>
                <div className="legend-panel-header">
                    <h3>Visual Guide</h3>
                    <button className="legend-close-btn" onClick={onToggle}>×</button>
                </div>

                {/* Tab Navigation */}
                <div className="legend-tabs">
                    <button
                        className={`legend-tab ${activeTab === 'languages' ? 'active' : ''}`}
                        onClick={() => setActiveTab('languages')}
                    >
                        Languages
                    </button>
                    <button
                        className={`legend-tab ${activeTab === 'risk' ? 'active' : ''}`}
                        onClick={() => setActiveTab('risk')}
                    >
                        Risk Levels
                    </button>
                    <button
                        className={`legend-tab ${activeTab === 'shapes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('shapes')}
                    >
                        Shapes
                    </button>
                </div>

                {/* Tab Content */}
                <div className="legend-content">
                    {/* Languages Tab */}
                    {activeTab === 'languages' && (
                        <div className="legend-section">
                            <p className="legend-description">
                                {colorScheme === COLOR_SCHEMES.LANGUAGE
                                    ? 'Nodes are colored by their programming language.'
                                    : colorScheme === COLOR_SCHEMES.COMPLEXITY
                                        ? 'Currently showing complexity colors. Switch to "Language" mode to see language colors.'
                                        : 'Currently showing heatmap colors. Switch to "Language" mode to see language colors.'}
                            </p>
                            <div className="language-grid">
                                {activeLanguages.map(({ key, icon, color, name }) => (
                                    <div key={key} className="language-item">
                                        <span
                                            className="language-dot"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="language-icon" style={{ color }}>
                                            {icon}
                                        </span>
                                        <span className="language-name">{name || key}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Risk Levels Tab */}
                    {activeTab === 'risk' && (
                        <div className="legend-section">
                            <p className="legend-description">
                                Nodes with architectural issues have colored glows indicating risk level.
                            </p>
                            <div className="risk-list">
                                {Object.entries(RISK_INDICATORS).map(([key, { color, label, description }]) => (
                                    <div key={key} className="risk-item">
                                        <div
                                            className="risk-indicator"
                                            style={{
                                                backgroundColor: color,
                                                boxShadow: `0 0 12px ${color}`
                                            }}
                                        />
                                        <div className="risk-info">
                                            <span className="risk-label">{label}</span>
                                            <span className="risk-description">{description}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Shapes Tab */}
                    {activeTab === 'shapes' && (
                        <div className="legend-section">
                            <p className="legend-description">
                                Node shapes indicate file complexity and risk status.
                            </p>
                            <div className="shapes-list">
                                <div className="shape-item">
                                    <div className="shape-preview sphere" />
                                    <div className="shape-info">
                                        <span className="shape-label">Sphere</span>
                                        <span className="shape-description">Normal file with standard complexity</span>
                                    </div>
                                </div>
                                <div className="shape-item">
                                    <div className="shape-preview icosahedron" />
                                    <div className="shape-info">
                                        <span className="shape-label">Faceted Shape</span>
                                        <span className="shape-description">High complexity (&gt;20) or high-risk file</span>
                                    </div>
                                </div>
                            </div>

                            <div className="size-guide">
                                <h4>Node Size</h4>
                                <p className="legend-description">
                                    Larger nodes indicate files with more code, higher complexity, or more connections.
                                </p>
                                <div className="size-scale">
                                    <div className="size-dot small" />
                                    <div className="size-dot medium" />
                                    <div className="size-dot large" />
                                </div>
                                <div className="size-labels">
                                    <span>Small/Simple</span>
                                    <span>Large/Complex</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Tips */}
                <div className="legend-tips">
                    <h4>Quick Tips</h4>
                    <ul>
                        <li><strong>Click</strong> a node to zoom and see details</li>
                        <li><strong>Labels</strong> appear on important files (high PageRank)</li>
                        <li><strong>Glowing nodes</strong> need architectural attention</li>
                    </ul>
                </div>
            </div>
        </>
    );
}
