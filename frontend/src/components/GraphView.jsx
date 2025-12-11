import { useCallback, useMemo } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';
import './GraphView.css';

const nodeTypes = { custom: CustomNode };

export default function GraphView({ graph, stats, onNodeClick, onBack }) {
    const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const handleNodeClick = useCallback(
        (event, node) => {
            onNodeClick?.(node);
        },
        [onNodeClick]
    );

    // Language color mapping for minimap
    const nodeColor = useCallback((node) => {
        return node.data?.color || '#666';
    }, []);

    return (
        <div className="graph-view">
            <div className="graph-header">
                <button onClick={onBack} className="back-button">
                    ← Analyze Another
                </button>
                <div className="stats-bar">
                    <span className="stat-item">
                        <span className="stat-icon">📁</span>
                        <span className="stat-value">{stats.totalFiles}</span>
                        <span className="stat-label">Files</span>
                    </span>
                    <span className="stat-item">
                        <span className="stat-icon">🔗</span>
                        <span className="stat-value">{stats.edges}</span>
                        <span className="stat-label">Dependencies</span>
                    </span>
                </div>
                <div className="legend">
                    <span className="legend-item">
                        <span className="legend-dot" style={{ background: '#f7df1e' }}></span>
                        JS
                    </span>
                    <span className="legend-item">
                        <span className="legend-dot" style={{ background: '#3178c6' }}></span>
                        TS
                    </span>
                    <span className="legend-item">
                        <span className="legend-dot" style={{ background: '#3776ab' }}></span>
                        PY
                    </span>
                </div>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.1}
                maxZoom={2}
            >
                <Controls className="controls" />
                <MiniMap
                    nodeColor={nodeColor}
                    className="minimap"
                    zoomable
                    pannable
                />
                <Background variant="dots" gap={20} size={1} color="#333" />
            </ReactFlow>
        </div>
    );
}
