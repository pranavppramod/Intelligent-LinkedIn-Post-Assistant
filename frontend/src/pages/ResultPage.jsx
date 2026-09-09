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
      <div className="flex justify-between items-center mb-6">
        <div>
          {passesFaithfulness ? (
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded font-medium inline-block mb-2">Done</div>
          ) : (
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded font-medium mb-2">
              No draft passed the faithfulness check. This post contains material not supported by your brief — review every specific claim before publishing.
            </div>
          )}
          {decision && (
            <p className="text-sm text-gray-500">
              Stopped because: {decision.reason}
              {result.best_iteration < result.iteration && ` (Returned draft #${result.best_iteration} which scored higher)`}
            </p>
          )}
        </div>
        <button 
          onClick={resetWorkflow}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Write another
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 p-4 rounded border text-center">
          <p className="text-sm text-gray-500">Craft score</p>
          <p className="text-2xl font-bold">{verdict.craft_score || 0}/10</p>
        </div>
        <div className="bg-gray-50 p-4 rounded border text-center">
          <p className="text-sm text-gray-500">Winning draft</p>
          <p className="text-2xl font-bold">#{result.best_iteration || 0}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded border text-center">
          <p className="text-sm text-gray-500">Faithfulness</p>
          <p className="text-2xl font-bold">{verdict.faithfulness || 0}/10</p>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button 
            onClick={() => setActiveTab('post')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'post' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            📝 Final Post
          </button>
          <button 
            onClick={() => setActiveTab('brief')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'brief' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            🎯 Your Brief
          </button>
          <button 
            onClick={() => setActiveTab('eval')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'eval' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            📊 Evaluation
          </button>
          <button 
            onClick={() => setActiveTab('scores')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'scores' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            📈 Scores
          </button>
        </nav>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'post' && (
        <div>
          {altHooks.length > 0 && (
            <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-100">
              <p className="font-semibold mb-2">Want a different opening? Swap the hook:</p>
              <div className="space-y-2">
                <label className="flex items-start space-x-2">
                  <input type="radio" name="hook" checked={selectedHook === originalHook} onChange={() => setSelectedHook(originalHook)} className="mt-1" />
                  <span className="text-sm">Original (Keep as generated): {originalHook}</span>
                </label>
                {altHooks.map((h, i) => (
                  <label key={i} className="flex items-start space-x-2">
                    <input type="radio" name="hook" checked={selectedHook === h.text} onChange={() => setSelectedHook(h.text)} className="mt-1" />
                    <span className="text-sm font-medium">{h.angle}: <span className="font-normal text-gray-600">{h.text}</span></span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <textarea 
            className="w-full h-[500px] border border-gray-300 rounded p-4 font-sans focus:outline-none"
            readOnly
            value={finalDisplayText}
          />
        </div>
      )}

      {activeTab === 'brief' && (
        <div className="bg-gray-50 p-6 rounded border">
           <h4 className="font-bold mb-2">{brief?.thesis}</h4>
           <p className="text-sm text-gray-600 mb-6">This is the position the post will argue.</p>
           
           <div className="mb-4">
             <h5 className="font-semibold text-sm">Evidence</h5>
             <ul className="list-disc pl-5 text-sm text-gray-700">{brief?.evidence?.map((e,i) => <li key={i}>{e}</li>)}</ul>
           </div>
           <div>
             <h5 className="font-semibold text-sm">Details</h5>
             <ul className="list-disc pl-5 text-sm text-gray-700">{brief?.details?.map((d,i) => <li key={i}>{d}</li>)}</ul>
           </div>
        </div>
      )}

      {activeTab === 'eval' && (
        <div className="space-y-8">
          {evaluation.unsupported_claims && evaluation.unsupported_claims.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded shadow-sm">
              <h3 className="font-bold mb-2">Claims Not Supported by Your Brief</h3>
              <ul className="list-disc pl-5 space-y-1">
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
                    <div key={metric} className="bg-white border border-gray-200 rounded p-4 shadow-sm">
                      <div className="flex justify-between items-end mb-2">
                        <span className="font-bold capitalize text-gray-800">{metric}</span>
                        <span className="text-sm font-semibold text-gray-600">{scoreValue}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div 
                          className={`h-2 rounded-full ${scoreValue >= 8 ? 'bg-green-500' : scoreValue >= 5 ? 'bg-yellow-400' : 'bg-red-500'}`} 
                          style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-700">{data?.observation || ''}</p>
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
                  <div key={i} className="bg-blue-50 border border-blue-100 rounded p-4">
                    <div className="flex gap-3 items-center mb-2">
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

      {activeTab === 'scores' && (
        <div>
           {evaluation.scores && Object.entries(evaluation.scores).map(([metric, data]) => (
             <div key={metric} className="mb-4 bg-white border rounded p-4">
               <div className="flex justify-between items-center mb-2">
                 <span className="font-bold capitalize">{metric}</span>
                 <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{data.score}/10</span>
               </div>
               <p className="text-sm text-gray-600">{data.observation}</p>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

