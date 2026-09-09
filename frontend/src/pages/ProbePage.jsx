import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { finishInterview } from '../services/api';

export const ProbePage = () => {
  const { topic, tone, answers, probeQuestions, setAnswers, setBrief, setBriefId, setPhase } = useWorkflow();
  const [probeAnswers, setProbeAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleTextChange = (id, text, textTitle) => {
    setProbeAnswers(prev => ({
      ...prev,
      [id]: { question_id: id, question_text: textTitle, answer: text }
    }));
  };

  const getFinalAnswerList = () => {
    const newAnswers = probeQuestions.map(q => {
      const ans = probeAnswers[q.id];
      return ans || { question_id: q.id, question_text: q.text, answer: '' };
    });
    return [...answers, ...newAnswers];
  };

  const finalizeInterview = async (answerList, wasProbed) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await finishInterview(topic, tone, answerList, wasProbed);
      setBrief(data.brief);
      setBriefId(data.brief_id);
      setPhase('brief');
    } catch (err) {
      setError("Failed to create brief.");
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    const finalAnswers = getFinalAnswerList();
    setAnswers(finalAnswers);
    finalizeInterview(finalAnswers, true);
  };

  const handleSkip = () => {
    finalizeInterview(answers, false);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <p className="text-gray-500 mb-2">One more thing</p>
      <h2 className="text-2xl font-bold mb-4">A couple of follow-ups</h2>
      <div className="bg-blue-50 text-blue-800 p-4 rounded mb-6 text-sm">
        Some answers were a little general. These are the specifics that will keep the post from sounding like everyone else's. Skip any you'd rather not answer.
      </div>

      <div className="space-y-6 mb-8">
        {probeQuestions.map((q) => (
          <div key={q.id} className="border border-gray-200 p-4 rounded bg-white">
            <h3 className="font-semibold mb-1">{q.text}</h3>
            <div className="bg-yellow-50 text-yellow-800 p-2 mb-3 rounded text-sm">
              💡 <strong>Tip:</strong> {q.why}
            </div>
            <textarea
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={4}
              placeholder={q.placeholder}
              value={probeAnswers[q.id]?.answer || ''}
              onChange={(e) => handleTextChange(q.id, e.target.value, q.text)}
            ></textarea>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={handleSkip}
          disabled={isSubmitting}
          className="w-1/3 bg-gray-100 text-gray-800 border border-gray-300 py-2 px-4 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          Skip these
        </button>
        <button
          onClick={handleContinue}
          disabled={isSubmitting}
          className="w-2/3 bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex justify-center items-center"
        >
          {isSubmitting ? 'Loading...' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

