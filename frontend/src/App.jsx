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
    <div className="min-h-screen flex flex-col">
      {/* Global Header */}
      <header className="h-[76px] flex items-center px-6 md:px-10 max-w-[1320px] w-full mx-auto">
        <div className="font-editorial text-[22px] tracking-tight">LinkedInForge</div>
      </header>

      {/* Main Content Container */}
      <main className="flex-grow w-full max-w-[1320px] mx-auto px-6 md:px-10 pt-[56px] lg:pt-[80px] pb-24">
        {phase === 'topic' && <TopicPage />}
        {phase === 'interview' && <InterviewPage />}
        {phase === 'probe' && <ProbePage />}
        {phase === 'brief' && <BriefPage />}
        {phase === 'review' && <ReviewPage />}
        {phase === 'result' && <ResultPage />}
      </main>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
