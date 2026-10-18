import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { IconContext } from '@phosphor-icons/react';
import App from './App';
import { BookmarkProvider } from './hooks/useBookmarks';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <IconContext.Provider value={{ weight: 'duotone' }}>
      <BrowserRouter>
        <BookmarkProvider>
          <App />
        </BookmarkProvider>
      </BrowserRouter>
    </IconContext.Provider>
  </React.StrictMode>
);
