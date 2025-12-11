import { useState } from 'react';
import UploadForm from './components/UploadForm';
import GraphView from './components/GraphView';
import FileInspector from './components/FileInspector';
import './App.css';

function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  const handleAnalyzed = (result) => {
    setAnalysisResult(result);
    setSelectedNode(null);
  };

  const handleBack = () => {
    setAnalysisResult(null);
    setSelectedNode(null);
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleCloseInspector = () => {
    setSelectedNode(null);
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
          <GraphView
            graph={analysisResult.graph}
            stats={analysisResult.stats}
            onNodeClick={handleNodeClick}
            onBack={handleBack}
          />
          <FileInspector
            node={selectedNode}
            onClose={handleCloseInspector}
          />
        </>
      )}
    </div>
  );
}

export default App;
