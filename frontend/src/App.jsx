import React from 'react';
import { useWorkflow } from './context/WorkflowContext';
import { TopicPage } from './pages/TopicPage';
import { InterviewPage } from './pages/InterviewPage';
import { ProbePage } from './pages/ProbePage';
import { BriefPage } from './pages/BriefPage';
import { ReviewPage } from './pages/ReviewPage';
import { ResultPage } from './pages/ResultPage';

function AppContent() {
  const { phase } = useWorkflow();

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {phase === 'topic' && <TopicPage />}
      {phase === 'interview' && <InterviewPage />}
      {phase === 'probe' && <ProbePage />}
      {phase === 'brief' && <BriefPage />}
      {phase === 'review' && <ReviewPage />}
      {phase === 'result' && <ResultPage />}
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
