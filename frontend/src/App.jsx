import { useState } from 'react';
import UploadForm from './components/UploadForm';
import GraphView3D from './components/GraphView3D';
import FileInspector from './components/FileInspector';
import AnalyticsPanel from './components/AnalyticsPanel';
import './App.css';


function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [highlightedNode, setHighlightedNode] = useState(null);

  const handleAnalyzed = (result) => {
    setAnalysisResult(result);
    setSelectedNode(null);
    setShowAnalytics(true);
  };

  const handleBack = () => {
    setAnalysisResult(null);
    setSelectedNode(null);
    setShowAnalytics(false);
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleCloseInspector = () => {
    setSelectedNode(null);
  };

  const handleNodeHighlight = (nodeId) => {
    setHighlightedNode(nodeId);
  };

  const handleCloseAnalytics = () => {
    setShowAnalytics(false);
  };

  const handleToggleAnalytics = () => {
    setShowAnalytics(!showAnalytics);
  };

  return (
    <div className="app">
      {!analysisResult ? (
        <UploadForm
          onAnalyzed={handleAnalyzed}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      ) : (
        <>
          <GraphView3D
            graph={analysisResult.graph}
            stats={analysisResult.stats}
            analytics={analysisResult.analytics}
            onNodeClick={handleNodeClick}
            onBack={handleBack}
            highlightedNode={highlightedNode}
            onToggleAnalytics={handleToggleAnalytics}
            showAnalytics={showAnalytics}
          />
          <FileInspector
            node={selectedNode}
            onClose={handleCloseInspector}
          />
          {showAnalytics && analysisResult.analytics && (
            <AnalyticsPanel
              analytics={analysisResult.analytics}
              onNodeHighlight={handleNodeHighlight}
              onClose={handleCloseAnalytics}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
