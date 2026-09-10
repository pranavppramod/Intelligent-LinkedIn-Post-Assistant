import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { fetchLiveContext } from '../services/api';

export const BriefPage = () => {
  const { brief, topic, setPhase, setThreadId, selectedReferences, setSelectedReferences } = useWorkflow();
  const [isFetchingContext, setIsFetchingContext] = useState(false);
  const [rawSearchResults, setRawSearchResults] = useState(null);
  const [contextError, setContextError] = useState(null);
  const [isReturning, setIsReturning] = useState(false);
  
  if (!brief) return null;

  const gaps = [];
  if (!brief.evidence || brief.evidence.length === 0) gaps.push("first-hand experience");
  if (!brief.thesis || brief.thesis.split(' ').length < 5) gaps.push("a clear position");
  if (!brief.details || brief.details.length === 0) gaps.push("concrete specifics (numbers, tools, timeframes)");
  if (!brief.takeaway) gaps.push("a reader takeaway");

  const hasNoEvidence = !brief.evidence || brief.evidence.length === 0;

  const handleFetchContext = async () => {
    if (rawSearchResults) return;
    setIsFetchingContext(true);
    setContextError(null);
    try {
      const results = await fetchLiveContext(topic, brief.thesis || '');
      setRawSearchResults(results);
    } catch (err) {
      setContextError("Failed to fetch live context.");
    } finally {
      setIsFetchingContext(false);
    }
  };

  const toggleReference = (ref) => {
    setSelectedReferences(prev => {
      const exists = prev.find(p => p.url === ref.url);
      if (exists) return prev.filter(p => p.url !== ref.url);
      return [...prev, ref];
    });
  };

  const handleWritePost = () => {
    // Generate the LangGraph thread ID right before starting optimization
    const newThreadId = crypto.randomUUID();
    setThreadId(newThreadId);
    setPhase('review');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <p className="text-gray-500 mb-2">Step 3 — check this before we write</p>
      <h2 className="text-2xl font-bold mb-4">The angle</h2>
      <p className="text-sm text-gray-600 mb-6">
        Everything below comes from your answers. Nothing else can appear in the post — if the angle is wrong, fix it here rather than rewriting the post later.
      </p>

      {/* Brief Display */}
      <div className="bg-white border border-gray-200 rounded p-6 mb-6">
        <h4 className="text-lg font-semibold mb-1">{brief.thesis || <span className="italic">_No clear position captured_</span>}</h4>
        <p className="text-sm text-gray-500 mb-6">This is the position the post will argue.</p>
        
        <hr className="mb-6 border-gray-100" />
        
        <div className="flex flex-col md:flex-row gap-8 mb-6">
          <div className="flex-1">
            <h5 className="font-semibold mb-2">Written for</h5>
            <p className="text-gray-700">{brief.audience || "Professionals on LinkedIn"}</p>
          </div>
          <div className="flex-1">
            <h5 className="font-semibold mb-2">They should leave thinking</h5>
            <p className="text-gray-700">{brief.takeaway || <span className="italic">_Nothing specific captured_</span>}</p>
          </div>
        </div>

        <hr className="mb-6 border-gray-100" />

        <div className="mb-6">
          <h5 className="font-semibold mb-2">Drawing on your experience</h5>
          {brief.evidence && brief.evidence.length > 0 ? (
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              {brief.evidence.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          ) : (
            <p className="text-gray-500 italic">_Nothing captured. The post will have no first-hand material to draw on._</p>
          )}
        </div>

        {brief.details && brief.details.length > 0 && (
          <div>
            <h5 className="font-semibold mb-2">And these specifics</h5>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              {brief.details.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}
      </div>

      {hasNoEvidence && (
        <div className="bg-red-50 text-red-800 p-4 rounded mb-6">
          <strong>This brief has no first-hand experience in it.</strong><br/><br/>
          The writer would have nothing to draw on and would invent specifics, which the faithfulness check then rejects. That cycle costs several minutes and produces a post you cannot publish.<br/><br/>
          Go back and answer at least one question with something that actually happened — a project, a decision, a thing that broke.
        </div>
      )}

      {!hasNoEvidence && gaps.length > 0 && (
        <div className="bg-blue-50 text-blue-800 p-4 rounded mb-6 text-sm">
          The brief is usable, but these would strengthen it:
          <ul className="list-disc pl-5 mt-2 space-y-1">
            {gaps.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </div>
      )}

      {/* Live Context */}
      <hr className="my-8 border-gray-200" />
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-1">🌐 Add Live Context (Optional)</h3>
        <p className="text-sm text-gray-500 mb-4">Ground your post with real-time industry data, news, or benchmarks.</p>
        
        <label className="flex items-center space-x-2 cursor-pointer mb-4">
          <input 
            type="checkbox" 
            className="w-4 h-4 text-blue-600 rounded"
            onChange={(e) => e.target.checked && handleFetchContext()}
            disabled={isFetchingContext || rawSearchResults !== null}
            checked={rawSearchResults !== null}
          />
          <span className="text-gray-800 font-medium">Search the web for current data supporting your thesis</span>
        </label>

        {isFetchingContext && (
          <div className="flex items-center text-blue-600 my-4 text-sm">
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Finding relevant context...
          </div>
        )}

        {contextError && <p className="text-red-600 text-sm mb-4">{contextError}</p>}

        {rawSearchResults && rawSearchResults.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold mb-3 text-sm">Select the facts you want to explicitly include in your draft:</p>
            <div className="space-y-3">
              {rawSearchResults.map((ref, i) => {
                const isSelected = selectedReferences.some(p => p.url === ref.url);
                return (
                  <div key={i} className={`border p-4 rounded ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mt-1 w-4 h-4 text-blue-600 rounded"
                        checked={isSelected}
                        onChange={() => toggleReference(ref)}
                      />
                      <div>
                        <p className="font-bold text-sm mb-1">{ref.title}</p>
                        <p className="text-xs text-gray-600 mb-2">{ref.snippet}</p>
                        <a href={ref.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Source Link</a>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {rawSearchResults && rawSearchResults.length === 0 && (
          <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-sm mt-4">
            No relevant live data found right now.
          </div>
        )}
      </div>

      <hr className="my-8 border-gray-200" />

      <div className="flex gap-4">
        <button
          onClick={() => {
            setIsReturning(true);
            // using a microtask so state flush can render the text if react batches it
            Promise.resolve().then(() => setPhase('interview'));
          }}
          disabled={isReturning}
          className="w-1/3 bg-gray-100 text-gray-800 border border-gray-300 py-2 px-4 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          {isReturning ? 'Returning to your answers...' : 'Back to answers'}
        </button>
        <button
          onClick={handleWritePost}
          disabled={hasNoEvidence}
          className="w-2/3 bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Write the post
        </button>
      </div>
    </div>
  );
};

