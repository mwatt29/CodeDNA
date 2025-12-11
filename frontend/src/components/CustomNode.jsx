import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import './CustomNode.css';

function CustomNode({ data, selected }) {
    const { label, language, loc, complexity, color, importCount } = data;

    // Scale node size based on complexity
    const scale = Math.min(1 + complexity / 50, 2);

    return (
        <div
            className={`custom-node ${selected ? 'selected' : ''}`}
            style={{
                '--node-color': color,
                transform: `scale(${scale})`,
            }}
        >
            <Handle type="target" position={Position.Top} className="handle" />

            <div className="node-content">
                <div className="node-label">{label}</div>
                <div className="node-stats">
                    <span className="stat" title="Lines of Code">
                        📄 {loc}
                    </span>
                    <span className="stat" title="Complexity Score">
                        🔀 {complexity}
                    </span>
                </div>
            </div>

            <div className="language-badge" style={{ backgroundColor: color }}>
                {language.slice(0, 2).toUpperCase()}
            </div>

            <Handle type="source" position={Position.Bottom} className="handle" />
        </div>
    );
}

export default memo(CustomNode);
