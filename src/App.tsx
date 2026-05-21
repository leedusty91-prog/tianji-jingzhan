import React from 'react';
import { NiHaishaSearch } from './components/NiHaishaSearch';
import { FlowingRiverBackground } from './components/FlowingRiverBackground';

export const App: React.FC = () => {
  return (
    <div className="app-container">
      <NiHaishaSearch />
      <FlowingRiverBackground />
    </div>
  );
};

export default App;
