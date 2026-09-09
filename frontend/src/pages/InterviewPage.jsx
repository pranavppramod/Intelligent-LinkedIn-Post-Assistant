import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { probeInterview, finishInterview } from '../services/api';

export const InterviewPage = () => {
  const { topic, tone, questions, setAnswers, setProbeQuestions, setBrief, setBriefId, setPhase } = useWorkflow();
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleTextChange = (id, text, textTitle) => {
    setCurrentAnswers(prev => ({
      ...prev,
      [id]: { question_id: id, question_text: textTitle, answer: text }
    }));
  };

  const getAnswerList = () => {
    return questions.map(q => {
      const ans = currentAnswers[q.id];
      return ans || { question_id: q.id, question_text: q.text, answer: '' };
    });
  };

  const handleContinue = async () => {
    setIsSubmitting(true);
    setError(null);
    const answerList = getAnswerList();
    setAnswers(answerList);
    
    try {
      const data = await probeInterview(topic, tone, answerList);
      if (data.questions && data.questions.length > 0) {
        setProbeQuestions(data.questions);
        setPhase('probe');
      } else {
        await finalizeInterview(answerList, false);
      }
    } catch (err) {
      setError("Failed to submit answers.");
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    setError(null);
    const answerList = getAnswerList();
    setAnswers(answerList);
    await finalizeInterview(answerList, false);
  };

  const finalizeInterview = async (answerList, wasProbed) => {
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

  const filledCount = Object.values(currentAnswers).filter(a => a.answer.trim() !== '').length;
  const progressPercent = questions.length > 0 ? (filledCount / questions.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <p className="text-gray-500 mb-2">Step 2 — your actual views</p>
      <h2 className="text-2xl font-bold mb-4">{topic}</h2>
      <div className="bg-blue-50 text-blue-800 p-4 rounded mb-6 text-sm">
        Short answers are fine. Specifics matter more than polish — numbers, names, and what actually happened are what stop the post sounding generic.
      </div>

      <div className="mb-4 text-sm text-gray-600">
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
          <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
        </div>
        {filledCount} of {questions.length} answered
      </div>

      <div className="space-y-6 mb-8">
        {questions.map((q) => (
          <div key={q.id} className="border border-gray-200 p-4 rounded bg-white">
            <h3 className="font-semibold mb-1">{q.text}</h3>
            <p className="text-sm text-gray-500 mb-3">{q.why}</p>
            <textarea
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={4}
              placeholder={q.placeholder}
              value={currentAnswers[q.id]?.answer || ''}
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
          className="w-1/4 bg-gray-100 text-gray-800 border border-gray-300 py-2 px-4 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          Skip to brief
        </button>
        <button
          onClick={handleContinue}
          disabled={isSubmitting}
          className="w-3/4 bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors flex justify-center items-center"
        >
          {isSubmitting ? 'Loading...' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

