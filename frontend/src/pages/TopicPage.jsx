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

      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4">What do you want to write about?</h2>
        
        <div className="mb-4">
          <textarea 
            value={manualTopic}
            onChange={(e) => setManualTopic(e.target.value)}
            placeholder="Tell me what you're thinking about..."
            className="w-full h-32 p-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans text-lg resize-none shadow-sm"
          ></textarea>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">Select Post Tone & Vibe:</p>
          <select 
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {TONES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {startError && (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded mb-4 shadow-sm border border-yellow-200">
            {startError}
          </div>
        )}

        <button 
          onClick={() => handleStartInterview(manualTopic)}
          disabled={isStarting}
          className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center shadow-md text-lg"
        >
          {isStarting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Getting your interview ready...
            </>
          ) : (
            "Start interview"
          )}
        </button>
      </div>

      <hr className="my-10 border-gray-200" />

      <div className="mb-8 opacity-90">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">💡 Need inspiration?</h3>
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-3">Select a domain to see trending news:</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoadingCurated && (
          <div className="text-blue-600 my-4 flex items-center text-sm">
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Curating trending topics in {selectedCategory}...
          </div>
        )}

        {curatedError && (
          <div className="bg-red-50 text-red-700 p-4 rounded mb-4 text-sm">
            {curatedError}
          </div>
        )}

        {!isLoadingCurated && selectedCategory && curatedArticles.length > 0 && (
          <div className="mt-6">
            <p className="font-semibold mb-3 text-gray-700">Trending in {selectedCategory}:</p>
            <div className="space-y-4">
              {curatedArticles.map((article, idx) => (
                <div key={idx} className="border border-gray-200 rounded p-4 shadow-sm bg-gray-50 hover:bg-white transition-colors">
                  <h4 className="text-lg font-medium mb-2 text-gray-800">{article.headline}</h4>
                  <p className="text-gray-600 mb-4 text-sm">{article.summary}</p>
                  <button 
                    onClick={() => handleStartInterview(`${article.headline}: ${article.summary}`)}
                    disabled={isStarting}
                    className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm font-medium shadow-sm"
                  >
                    Write about this
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoadingCurated && selectedCategory && curatedArticles.length === 0 && !curatedError && (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded mt-4 text-sm">
            No articles were found for this category right now. Please try another category or enter your topic manually above.
          </div>
        )}
      </div>
    </div>
  );
};

