import React from 'react';
import { NiHaishaSearch } from './components/NiHaishaSearch';
import { FlowingRiverBackground } from './components/FlowingRiverBackground';

export const App: React.FC = () => {
  return (
    <>
      <FlowingRiverBackground />
      <div className="app-container">
        <NiHaishaSearch />
      </div>
    </>
  );
};

export default App;
