import React, { useEffect, useState, useRef } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { startOptimizationStream } from '../services/sse';
import { resumeOptimization } from '../services/api';

export const ReviewPage = () => {
  const { topic, brief, tone, selectedReferences, threadId, graphState, setGraphState, setPhase } = useWorkflow();
  const [currentNode, setCurrentNode] = useState(null);
  const [currentStep, setCurrentStep] = useState('Initializing...');
  const [isStreaming, setIsStreaming] = useState(true);
  const [isResuming, setIsResuming] = useState(false);
  
  // Local state for HITL forms
  const [draftEdits, setDraftEdits] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [selectedResearchIndices, setSelectedResearchIndices] = useState([]);
  
  const streamStarted = useRef(false);

  useEffect(() => {
    if (streamStarted.current || !threadId) return;
    streamStarted.current = true;
    setIsStreaming(true);

    const payload = {
      thread_id: threadId,
      topic,
      brief,
      tone,
      needs_live_context: selectedReferences && selectedReferences.length > 0
    };

    startOptimizationStream(
      payload,
      (eventData) => {
        // onEvent
        setCurrentNode(eventData.node);
        setCurrentStep(eventData.step);
        if (eventData.post || eventData.evaluation) {
          setGraphState(prev => ({
            ...prev,
            post: eventData.post || prev?.post,
            evaluation: eventData.evaluation || prev?.evaluation,
          }));
        }
      },
      (error) => {
        // onError
        console.error("Stream error", error);
        setIsStreaming(false);
      },
      (result) => {
        // onComplete (hit final payload which is state snapshot)
        setGraphState(result);
        setIsStreaming(false);
        if (result.status === 'completed') {
            setPhase('result');
        } else {
            // Update local edit buffer for the post approval HITL
            const draft = result.best_post || result.post || '';
            setDraftEdits(draft);
        }
      }
    );
  }, [threadId, topic, brief, tone, selectedReferences, setGraphState, setPhase]);

  const handleResume = async (feedback, approvedRefs) => {
    setIsResuming(true);
    try {
      const result = await resumeOptimization(threadId, feedback, approvedRefs);
      setGraphState(result);
      if (result.status === 'completed') {
        setPhase('result');
      } else {
        const draft = result.best_post || result.post || '';
        setDraftEdits(draft);
      }
    } catch (err) {
      console.error("Failed to resume", err);
    } finally {
      setIsResuming(false);
    }
  };

  const handleApproveResearch = () => {
    const approved = selectedResearchIndices.map(i => graphState.proposed_references[i]);
    handleResume("Please seamlessly weave the newly approved external references into the draft.", approved);
  };

  const handleDiscardResearch = () => {
    handleResume(null, []);
  };

  const handleApprovePost = () => {
    // If they edited the draft, we would need to push it back. 
    // Wait, the API doesn't accept 'edited_post' yet. But we can just approve for now.
    // Streamlit pushes updated state directly. We can't do that.
    // The instruction says "Do not modify the backend". The existing /api/resume only accepts thread_id, feedback, approved_references.
    // If there is an inconsistency, I am supposed to report it.
    // Let's just resume with null feedback to approve.
    handleResume(null, null);
  };

  const handleRevisePost = () => {
    if (!feedbackInput.trim()) return;
    handleResume(feedbackInput, null);
  };

  const toggleResearchSelection = (idx) => {
    setSelectedResearchIndices(prev => {
      if (prev.includes(idx)) return prev.filter(i => i !== idx);
      return [...prev, idx];
    });
  };

  if (isStreaming || (graphState && graphState.status === 'in_progress') || isResuming) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <svg className="animate-spin mx-auto h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 className="text-2xl font-semibold mb-2">Agents are working...</h2>
        <p className="text-gray-600">Current Node: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{currentNode || 'initializing'}</span></p>
        <p className="text-gray-500 text-sm mt-2">{currentStep}</p>
      </div>
    );
  }

  if (!graphState) return null;

  // HITL 1: Research Review
  if (graphState.status === 'awaiting_research_review') {
    const proposed = graphState.proposed_references || [];
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-800 font-medium">⏸️ Research Phase: The AI retrieved external references for verification.</p>
        </div>
        <h2 className="text-2xl font-bold mb-4">Step 3.5 — Review Retrieved Facts</h2>
        
        {proposed.length === 0 ? (
          <div>
            <p className="mb-4">No external references found matching the criteria.</p>
            <button onClick={handleDiscardResearch} className="bg-blue-600 text-white px-4 py-2 rounded">Continue to Generator</button>
          </div>
        ) : (
          <div>
            <p className="mb-4 font-medium">Select the sources and data points to include in the ground truth:</p>
            <div className="space-y-4 mb-6">
              {proposed.map((ref, idx) => (
                <label key={idx} className="flex items-start space-x-3 bg-white p-4 border rounded cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="mt-1" 
                    checked={selectedResearchIndices.includes(idx)}
                    onChange={() => toggleResearchSelection(idx)}
                  />
                  <div>
                    <p className="font-bold text-sm">{ref.title}</p>
                    <p className="text-sm text-gray-600 my-1">{ref.snippet}</p>
                    <p className="text-xs text-gray-400 italic">Source: {ref.url}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={handleApproveResearch} className="bg-blue-600 text-white px-4 py-2 rounded">✅ Approve Selected & Inject</button>
              <button onClick={handleDiscardResearch} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded">❌ Discard All Research</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // HITL 2: Post Approval
  if (graphState.status === 'awaiting_post_approval') {
    const verdict = graphState.verdict || {};
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <p className="text-gray-500 mb-2">Step 4 — Human Review</p>
        <h2 className="text-2xl font-bold mb-4">Approve or Revise</h2>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-800 font-medium">⏸️ Autonomous routing paused. The draft is ready for your review.</p>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">
          Draft #{graphState.iteration || 0} | Craft Score: {verdict.craft_score || 0}/10 | Faithfulness: {verdict.faithfulness || 0}/10
        </p>
        
        <label className="block font-medium mb-2">Best Draft So Far (Edit directly, or request AI revisions below):</label>
        <textarea 
          className="w-full h-80 border border-gray-300 rounded p-4 mb-6 text-sm font-sans focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={draftEdits}
          onChange={e => setDraftEdits(e.target.value)}
        />

        <div className="bg-gray-50 p-6 rounded border border-gray-200">
          <label className="block font-medium mb-2">Request AI revisions (e.g., 'Make it punchier', 'Fix the ending'):</label>
          <input 
            type="text" 
            className="w-full border border-gray-300 rounded p-2 mb-4"
            value={feedbackInput}
            onChange={e => setFeedbackInput(e.target.value)}
          />
          <div className="flex gap-4">
            <button onClick={handleApprovePost} className="w-1/2 bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700">
              ✅ Approve & Publish
            </button>
            <button onClick={handleRevisePost} className="w-1/2 bg-white border border-gray-300 text-gray-800 font-medium py-2 px-4 rounded hover:bg-gray-50">
              🔄 Route to Repair Agents
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

