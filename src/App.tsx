// src/App.tsx
import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DragAndDropDemo from './components/DragAndDropDemo';

const App: React.FC = () => {


  return (
    <DndProvider backend={HTML5Backend}>
      <DragAndDropDemo/>
    </DndProvider>
  );
};

export default App;
