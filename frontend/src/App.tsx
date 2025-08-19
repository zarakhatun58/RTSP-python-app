import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from './pages/Landing';
import "./index.css"; 

const App = () => {
  return (
    <div>
      <BrowserRouter>
      <Header/>
          <Routes>
            <Route path="/" element={<Landing />} />
            
          </Routes>
          <Footer/>
        </BrowserRouter>
    </div>
  );
};

export default App;