import React, { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { getCuratedTopics, startInterview } from '../services/api';

const CATEGORIES = [
  "AI & Deep Learning", 
  "Quantum Mechanics", 
  "Evolutionary Biology", 
  "Productivity & Deep Work", 
  "World Affairs"
];

const TONES = [
  "Direct, punchy, and technical (like a senior engineer)",
  "Conversational, casual, and highly relatable (story-driven)",
  "Sharp, contrarian, and bold (challenging conventional wisdom)",
  "Witty, sarcastic, and funny (uses dry humor and developer self-deprecation without losing technical accuracy)",
  "Academic, measured, and deeply analytical"
];

export const TopicPage = () => {
  const { setTopic, tone, setTone, setQuestions, setPhase } = useWorkflow();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [curatedArticles, setCuratedArticles] = useState([]);
  const [isLoadingCurated, setIsLoadingCurated] = useState(false);
  const [curatedError, setCuratedError] = useState(null);
  const [manualTopic, setManualTopic] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState(null);

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setIsLoadingCurated(true);
    setCuratedError(null);
    try {
      const data = await getCuratedTopics(category);
      setCuratedArticles(data.articles || []);
    } catch (err) {
      setCuratedError("Could not fetch trending news right now. Try another category or enter manually.");
    } finally {
      setIsLoadingCurated(false);
    }
  };

  const handleStartInterview = async (selectedTopic) => {
    if (!selectedTopic.trim()) {
      setStartError("Please enter a topic or select a news article above.");
      return;
    }
    
    setIsStarting(true);
    setStartError(null);
    setTopic(selectedTopic.trim());
    
    try {
      const data = await startInterview(selectedTopic.trim(), tone);
      setQuestions(data.questions || []);
      setPhase('interview');
    } catch (err) {
      setStartError("Could not start interview. Please try again.");
      setIsStarting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">🚀 LinkedInForge</h1>
      <p className="text-gray-500 mb-8">Step 1 — what are you writing about?</p>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">💡 Need inspiration?</h3>
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Select a domain to see trending news:</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-blue-100 border-blue-500 text-blue-800' 
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Select Post Tone & Vibe:</p>
          <select 
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TONES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {isLoadingCurated && (
          <div className="text-blue-600 my-4 flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Curating trending topics in {selectedCategory}...
          </div>
        )}

        {curatedError && (
          <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
            {curatedError}
          </div>
        )}

        {!isLoadingCurated && selectedCategory && curatedArticles.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold mb-3">Trending in {selectedCategory}:</p>
            <div className="space-y-4">
              {curatedArticles.map((article, idx) => (
                <div key={idx} className="border border-gray-200 rounded p-4 shadow-sm bg-white">
                  <h4 className="text-lg font-medium mb-2">{article.headline}</h4>
                  <p className="text-gray-600 mb-4">{article.summary}</p>
                  <button 
                    onClick={() => handleStartInterview(`${article.headline}: ${article.summary}`)}
                    disabled={isStarting}
                    className="bg-white text-gray-800 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Write about this
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoadingCurated && selectedCategory && curatedArticles.length === 0 && !curatedError && (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded mt-4">
            No articles were found for this category right now. Please try another category or enter your topic manually below.
          </div>
        )}
      </div>

      <hr className="my-8 border-gray-200" />

      <div>
        <h3 className="text-xl font-semibold mb-4">✍️ Or enter your own topic</h3>
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-1">Topic</label>
          <input 
            type="text"
            value={manualTopic}
            onChange={(e) => setManualTopic(e.target.value)}
            placeholder="Agentic engineering"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Just the subject. You'll be asked for the details next.</p>
        </div>

        {startError && (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded mb-4">
            {startError}
          </div>
        )}

        <button 
          onClick={() => handleStartInterview(manualTopic)}
          disabled={isStarting}
          className="w-full bg-red-500 text-white font-medium py-2 px-4 rounded hover:bg-red-600 transition-colors disabled:opacity-50 flex justify-center items-center"
        >
          {isStarting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Working out what to ask you...
            </>
          ) : (
            "Start interview"
          )}
        </button>
      </div>
    </div>
  );
};

