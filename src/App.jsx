import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FormPage from './pages/FormPage';
import ResultPage from './pages/ResultPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<FormPage />} />
        <Route path='/result' element={<ResultPage />} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
