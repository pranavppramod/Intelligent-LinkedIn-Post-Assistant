import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

export const ResultPage = () => {
  const { graphState, brief, resetWorkflow } = useWorkflow();
  const [activeTab, setActiveTab] = useState('post'); // post, brief, eval, scores

  if (!graphState) return null;

  const result = graphState;
  const evaluation = result.evaluation || {};
  const verdict = result.verdict || {};
  const decision = result.decision || null;

  const passesFaithfulness = verdict.passes_faithfulness;
  
  const winningPost = result.best_post || result.post || '';
  const paragraphs = winningPost.split('\n\n');
  const originalHook = paragraphs.length > 0 ? paragraphs[0] : '';
  const postBody = paragraphs.length > 1 ? paragraphs.slice(1).join('\n\n') : '';

  const altHooks = result.best_alternative_hooks || result.alternative_hooks || [];
  const [selectedHook, setSelectedHook] = useState(originalHook);

  const finalDisplayText = postBody ? `${selectedHook}\n\n${postBody}` : selectedHook;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6">
        {!passesFaithfulness && (
          <div className="bg-red-100 text-red-800 px-4 py-3 rounded font-medium mb-3 shadow-sm border border-red-200">
            ⚠️ No draft passed the faithfulness check. This post contains material not supported by your brief — review every specific claim before publishing.
          </div>
        )}
        {decision && (
          <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded border">
            Stopped because: {decision.reason}
            {result.best_iteration < result.iteration && ` (Returned draft #${result.best_iteration} which scored higher)`}
          </p>
        )}
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button 
            onClick={() => setActiveTab('post')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'post' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            📝 Final Post
          </button>
          <button 
            onClick={() => setActiveTab('brief')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'brief' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            🎯 Your Brief
          </button>
          <button 
            onClick={() => setActiveTab('eval')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'eval' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            📊 Evaluation
          </button>
        </nav>
      </div>

      {/* TAB CONTENTS */}
      <div className="mb-12">
        {activeTab === 'post' && (
          <div>
            {altHooks.length > 0 && (
              <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-100">
                <p className="font-semibold mb-3 text-blue-900">Want a different opening? Swap the hook:</p>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input type="radio" name="hook" checked={selectedHook === originalHook} onChange={() => setSelectedHook(originalHook)} className="mt-1" />
                    <span className="text-sm text-gray-800"><span className="font-medium">Original</span> (Keep as generated): {originalHook}</span>
                  </label>
                  {altHooks.map((h, i) => (
                    <label key={i} className="flex items-start space-x-3 cursor-pointer">
                      <input type="radio" name="hook" checked={selectedHook === h.text} onChange={() => setSelectedHook(h.text)} className="mt-1" />
                      <span className="text-sm text-gray-800"><span className="font-medium">{h.angle}:</span> <span className="text-gray-600">{h.text}</span></span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <textarea 
              className="w-full h-[500px] border border-gray-300 rounded p-6 font-sans text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm leading-relaxed resize-none bg-white"
              readOnly
              value={finalDisplayText}
            />
          </div>
        )}

        {activeTab === 'brief' && (
          <div className="bg-gray-50 p-8 rounded border shadow-sm">
             <h4 className="font-bold text-xl mb-2">{brief?.thesis}</h4>
             <p className="text-sm text-gray-500 mb-8 border-b pb-4">This is the position the post will argue.</p>
             
             <div className="mb-6">
               <h5 className="font-semibold text-gray-800 mb-3">Evidence</h5>
               <ul className="list-disc pl-5 text-gray-700 space-y-2">{brief?.evidence?.map((e,i) => <li key={i}>{e}</li>)}</ul>
             </div>
             <div>
               <h5 className="font-semibold text-gray-800 mb-3">Details</h5>
               <ul className="list-disc pl-5 text-gray-700 space-y-2">{brief?.details?.map((d,i) => <li key={i}>{d}</li>)}</ul>
             </div>
          </div>
        )}

        {activeTab === 'eval' && (
          <div className="space-y-8">
            {evaluation.unsupported_claims && evaluation.unsupported_claims.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-6 rounded shadow-sm">
                <h3 className="font-bold text-lg mb-3">Claims Not Supported by Your Brief</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {evaluation.unsupported_claims.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}

            {evaluation.scores && Object.keys(evaluation.scores).length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Score Breakdown</h3>
                <div className="grid grid-cols-1 gap-4">
                  {Object.entries(evaluation.scores).map(([metric, data]) => {
                    const scoreValue = data?.score || 0;
                    const percentage = (scoreValue / 10) * 100;
                    return (
                      <div key={metric} className="bg-white border border-gray-200 rounded p-5 shadow-sm">
                        <div className="flex justify-between items-end mb-3">
                          <span className="font-bold capitalize text-gray-800">{metric}</span>
                          <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">{scoreValue}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                          <div 
                            className={`h-2.5 rounded-full ${scoreValue >= 8 ? 'bg-green-500' : scoreValue >= 5 ? 'bg-yellow-400' : 'bg-red-500'}`} 
                            style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{data?.observation || ''}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {evaluation.strengths && evaluation.strengths.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Strengths</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}

            {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Areas to Improve</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {evaluation.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            {evaluation.improvement_opportunities && evaluation.improvement_opportunities.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Improvement Opportunities</h3>
                <div className="space-y-4">
                  {evaluation.improvement_opportunities.map((opp, i) => (
                    <div key={i} className="bg-blue-50 border border-blue-100 rounded p-5">
                      <div className="flex gap-3 items-center mb-3">
                        <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                          {opp.category || 'General'}
                        </span>
                        {opp.priority && (
                          <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${
                            opp.priority.toLowerCase() === 'high' ? 'bg-red-100 text-red-800' : 
                            opp.priority.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {opp.priority} Priority
                          </span>
                        )}
                      </div>
                      {opp.reason && <p className="text-sm text-gray-700 mb-2"><strong>Reason:</strong> {opp.reason}</p>}
                      {opp.recommendation && <p className="text-sm text-gray-700"><strong>Recommendation:</strong> {opp.recommendation}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <hr className="border-gray-200 mb-12" />

      {/* SECONDARY SUMMARY / SCORE INFORMATION */}
      <div className="mb-12">
        <h3 className="text-lg font-bold mb-6 text-gray-800">Final Metrics</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">Craft Score</p>
            <p className="text-4xl font-bold text-gray-900">{verdict.craft_score || 0}<span className="text-xl text-gray-400">/10</span></p>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center justify-center">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">Faithfulness</p>
            <p className="text-4xl font-bold text-gray-900">{verdict.faithfulness || 0}<span className="text-xl text-gray-400">/10</span></p>
          </div>
        </div>
      </div>

      {/* WRITE ANOTHER POST */}
      <div className="mt-16 text-center">
        <button 
          onClick={resetWorkflow}
          className="bg-blue-600 text-white font-bold py-4 px-8 rounded-lg hover:bg-blue-700 transition-colors shadow-md text-lg w-full sm:w-auto"
        >
          Write another post
        </button>
      </div>
    </div>
  );
};

